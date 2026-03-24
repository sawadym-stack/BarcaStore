import React, { createContext, useReducer, useEffect, useContext } from "react";
import * as api from "../api/api";
import { AuthContext } from "./AuthContext";

// ------------------------------------------------------------
// Initial state
// ------------------------------------------------------------

const initialState = {
  cart: [],
  wishlist: [],
  products: [],
  status: "idle",
  error: null
};

// ------------------------------------------------------------
// Reducer
// ------------------------------------------------------------

function reducer(state, action) {
  switch (action.type) {


    // ---------------- CART ----------------
    case "addToCart": {
      const exists = state.cart.find(
        (i) =>
          i.id === action.payload.id &&
          i.selectedSize === action.payload.selectedSize
      );

      const updatedCart = exists
        ? state.cart.map((i) =>
          i.id === action.payload.id &&
            i.selectedSize === action.payload.selectedSize
            ? { ...i, qty: i.qty + 1 }
            : i
        )
        : [...state.cart, { ...action.payload, qty: 1 }];

      return { ...state, cart: updatedCart };
    }

    case "removeFromCart":
      return {
        ...state,
        cart: state.cart.filter(
          (i) =>
            !(
              i.id === action.payload.id &&
              i.selectedSize === action.payload.selectedSize
            )
        )
      };

    case "clearCart":
      return { ...state, cart: [] };

    case "increaseQty":
      return {
        ...state,
        cart: state.cart.map((i) =>
          i.id === action.payload.id &&
            i.selectedSize === action.payload.selectedSize
            ? { ...i, qty: i.qty + 1 }
            : i
        )
      };

    case "decreaseQty":
      return {
        ...state,
        cart: state.cart.map((i) =>
          i.id === action.payload.id &&
            i.selectedSize === action.payload.selectedSize &&
            i.qty > 1
            ? { ...i, qty: i.qty - 1 }
            : i
        )
      };

    case "updateCartItemSize": {
      const { id, oldSize, newSize } = action.payload;
      const sourceItem = state.cart.find((i) => i.id === id && i.selectedSize === oldSize);
      const targetItem = state.cart.find((i) => i.id === id && i.selectedSize === newSize);

      if (!sourceItem) return state;

      if (targetItem) {
        // Merge with existing size
        return {
          ...state,
          cart: state.cart
            .map((i) =>
              i.id === id && i.selectedSize === newSize
                ? { ...i, qty: i.qty + sourceItem.qty }
                : i
            )
            .filter((i) => !(i.id === id && i.selectedSize === oldSize))
        };
      }

      return {
        ...state,
        cart: state.cart.map((i) =>
          i.id === id && i.selectedSize === oldSize
            ? { ...i, selectedSize: newSize }
            : i
        )
      };
    }

    // ---------------- WISHLIST ----------------
    case "addToWishlist":
      if (state.wishlist.find((i) => i.id === action.payload.id)) return state;
      return { ...state, wishlist: [...state.wishlist, action.payload] };

    case "removeFromWishlist":
      return {
        ...state,
        wishlist: state.wishlist.filter((i) => i.id !== action.payload)
      };

    // ---------------- PRODUCTS ----------------
    case "setProducts":
      return { ...state, products: action.payload };

    case "addProduct":
      return { ...state, products: [...state.products, action.payload] };

    case "editProduct":
      return {
        ...state,
        products: state.products.map((p) =>
          p.id === action.payload.id ? action.payload : p
        )
      };

    case "deleteProduct":
      return {
        ...state,
        products: state.products.filter((p) => p.id !== action.payload)
      };

    case "setCart":
      return { ...state, cart: action.payload };

    case "setWishlist":
      return { ...state, wishlist: action.payload };

    case "clear":
      return { ...state, cart: [], wishlist: [] };

    default:
      return state;
  }
}

// ------------------------------------------------------------
// Context
// ------------------------------------------------------------

export const StoreContext = createContext();

// ------------------------------------------------------------
// Provider
// ------------------------------------------------------------

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const { user, logout: authLogout } = useContext(AuthContext);




  // ------------------------------------------------------------
  // SYNC CART & WISHLIST ON USER CHANGE
  // ------------------------------------------------------------

  useEffect(() => {
    if (user) {
      syncWithDB();
    } else {
      dispatch({ type: "clear" });
    }
  }, [user]);

  const syncWithDB = async () => {
    try {
      const cartData = await api.getCart();
      const wishlistData = await api.getWishlist();

      // Normalize cart data
      const normalizedCart = (cartData.items || []).map((item) => ({
        cartItemId: item.id,
        id: item.product_id,
        name: item.product_name,
        price: item.price,
        category: item.category,
        img: item.image_url,
        qty: item.quantity,
        selectedSize: item.size,
      }));

      // Normalize wishlist data
      const normalizedWishlist = (wishlistData.items || []).map((item) => ({
        wishlistItemId: item.id,
        id: item.product_id,
        name: item.product_name,
        price: item.price,
        img: item.image_url,
      }));

      dispatch({ type: "setCart", payload: normalizedCart });
      dispatch({ type: "setWishlist", payload: normalizedWishlist });
    } catch (err) {
      console.error("Failed to sync with DB:", err);
    }
  };

  // ------------------------------------------------------------
  // PRODUCTS
  // ------------------------------------------------------------

  const fetchProducts = async () => {
    const items = await api.getProducts();
    dispatch({ type: "setProducts", payload: items });
  };

  const addProduct = async (p) => {
    const product = await api.addProduct(p);
    dispatch({ type: "addProduct", payload: product });
  };

  const editProduct = async (id, data) => {
    const product = await api.updateProduct(id, data);
    dispatch({ type: "editProduct", payload: product });
  };

  const deleteProduct = async (id) => {
    await api.deleteProduct(id);
    dispatch({ type: "deleteProduct", payload: id });
  };

  // ------------------------------------------------------------
  // CART & WISHLIST ACTIONS
  // ------------------------------------------------------------

  const addToCart = async (p, selectedSize = "M") => {
    if (user) {
      try {
        await api.addToCart({ product_id: p.id, quantity: 1, size: selectedSize });
        await syncWithDB();
      } catch (err) {
        console.error("Add to cart failed:", err);
        throw err;
      }
    } else {
      dispatch({ type: "addToCart", payload: { ...p, selectedSize } });
    }
  };

  const removeFromCart = async (id, selectedSize) => {
    if (user) {
      try {
        const item = state.cart.find((i) => i.id === id && i.selectedSize === selectedSize);
        if (item && item.cartItemId) {
          await api.deleteCartItem(item.cartItemId);
          await syncWithDB();
        }
      } catch (err) {
        console.error("Remove from cart failed:", err);
      }
    } else {
      dispatch({ type: "removeFromCart", payload: { id, selectedSize } });
    }
  };

  const clearCart = async () => {
    if (user) {
      try {
        await api.clearCart();
        await syncWithDB();
      } catch (err) {
        console.error("Clear cart failed:", err);
      }
    } else {
      dispatch({ type: "clearCart" });
    }
  };

  const increaseQty = async (id, selectedSize) => {
    if (user) {
      try {
        const item = state.cart.find((i) => i.id === id && i.selectedSize === selectedSize);
        if (item && item.cartItemId) {
          await api.updateCartItem(item.cartItemId, { quantity: item.qty + 1 });
          await syncWithDB();
        }
      } catch (err) {
        console.error("Increase qty failed:", err);
      }
    } else {
      dispatch({ type: "increaseQty", payload: { id, selectedSize } });
    }
  };

  const decreaseQty = async (id, selectedSize) => {
    if (user) {
      try {
        const item = state.cart.find((i) => i.id === id && i.selectedSize === selectedSize);
        if (item && item.cartItemId) {
          if (item.qty > 1) {
            await api.updateCartItem(item.cartItemId, { quantity: item.qty - 1 });
            await syncWithDB();
          } else {
            await removeFromCart(id, selectedSize);
          }
        }
      } catch (err) {
        console.error("Decrease qty failed:", err);
      }
    } else {
      dispatch({ type: "decreaseQty", payload: { id, selectedSize } });
    }
  };

  const updateCartItemSize = async (id, oldSize, newSize) => {
    if (user) {
      try {
        const item = state.cart.find((i) => i.id === id && i.selectedSize === oldSize);
        if (item && item.cartItemId) {
          await api.updateCartItem(item.cartItemId, { quantity: item.qty, size: newSize });
          await syncWithDB();
        }
      } catch (err) {
        console.error("Update size failed:", err);
      }
    } else {
      dispatch({
        type: "updateCartItemSize",
        payload: { id, oldSize, newSize }
      });
    }
  };

  const addToWishlist = async (p) => {
    if (user) {
      try {
        await api.addToWishlist(p.id);
        await syncWithDB();
      } catch (err) {
        console.error("Add to wishlist failed:", err);
      }
    } else {
      dispatch({ type: "addToWishlist", payload: p });
    }
  };

  const removeFromWishlist = async (id) => {
    if (user) {
      try {
        await api.removeFromWishlist(id);
        await syncWithDB();
      } catch (err) {
        console.error("Remove from wishlist failed:", err);
        throw err;
      }
    } else {
      dispatch({ type: "removeFromWishlist", payload: id });
    }
  };

  // ------------------------------------------------------------
  // Provider
  // ------------------------------------------------------------

  const logout = () => {
    authLogout();                 // clears AuthContext + localStorage tokens
    // NOTE: We intentionally do NOT dispatch "clear" here.
    // Cart & wishlist stay in localStorage so they survive re-login.
  };

  return (
    <StoreContext.Provider
      value={{
        ...state,
        user,
        logout,
        fetchProducts,
        addProduct,
        editProduct,
        deleteProduct,
        addToCart,
        removeFromCart,
        clearCart,
        increaseQty,
        decreaseQty,
        updateCartItemSize,
        addToWishlist,
        removeFromWishlist
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}
