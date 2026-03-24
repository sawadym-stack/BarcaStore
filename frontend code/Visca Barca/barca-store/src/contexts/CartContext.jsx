import React, { createContext, useReducer, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "./AuthContext";

const initial = { cart: [], wishlist: [] };

function reducer(state, action) {
  switch (action.type) {
    case "setLists":
      return { cart: action.payload.cart, wishlist: action.payload.wishlist };

    case "addToCart": {
      const exist = state.cart.find((i) => i.id === action.payload.id);
      let newCart;

      if (exist)
        newCart = state.cart.map((i) =>
          i.id === action.payload.id ? { ...i, qty: i.qty + 1 } : i
        );
      else newCart = [...state.cart, { ...action.payload, qty: 1 }];

      return { ...state, cart: newCart };
    }

    case "removeFromCart":
      return { ...state, cart: state.cart.filter((i) => i.id !== action.payload) };

    case "addToWishlist":
      if (state.wishlist.find((w) => w.id === action.payload.id)) return state;
      return { ...state, wishlist: [...state.wishlist, action.payload] };

    case "removeFromWishlist":
      return {
        ...state,
        wishlist: state.wishlist.filter((i) => i.id !== action.payload),
      };

    default:
      return state;
  }
}

export const CartContext = createContext();

export function CartProvider({ children }) {
  const { user } = useContext(AuthContext);
  const [state, dispatch] = useReducer(reducer, initial);

  // Load cart/wishlist from db.json
  useEffect(() => {
    if (!user) return;

    axios.get(`http://localhost:5000/users/${user.id}`).then((r) => {
      dispatch({
        type: "setLists",
        payload: { cart: r.data.cart || [], wishlist: r.data.wishlist || [] },
      });
    });
  }, [user]);

  const saveToDB = async (newCart, newWishlist) => {
    if (!user) return;
    await axios.patch(`http://localhost:5000/users/${user.id}`, {
      cart: newCart,
      wishlist: newWishlist,
    });
  };

  const addToCart = async (product) => {
    dispatch({ type: "addToCart", payload: product });
    const updatedCart = [
      ...state.cart.filter((i) => i.id !== product.id),
      { ...product, qty: (state.cart.find((i) => i.id === product.id)?.qty || 0) + 1 },
    ];
    await saveToDB(updatedCart, state.wishlist);
  };

  const removeFromCart = async (id) => {
    const newCart = state.cart.filter((i) => i.id !== id);
    dispatch({ type: "removeFromCart", payload: id });
    await saveToDB(newCart, state.wishlist);
  };

  const addToWishlist = async (product) => {
    dispatch({ type: "addToWishlist", payload: product });
    const newWishlist = [...state.wishlist, product];
    await saveToDB(state.cart, newWishlist);
  };

  const removeFromWishlist = async (id) => {
    dispatch({ type: "removeFromWishlist", payload: id });
    const newWishlist = state.wishlist.filter((w) => w.id !== id);
    await saveToDB(state.cart, newWishlist);
  };

  return (
    <CartContext.Provider
      value={{
        cart: state.cart,
        wishlist: state.wishlist,
        addToCart,
        removeFromCart,
        addToWishlist,
        removeFromWishlist,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
