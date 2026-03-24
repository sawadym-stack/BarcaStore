import React, { createContext, useReducer, useEffect } from "react";
import * as api from "../api/api";

const initial = { products: [], status: "idle",  loading: true, error: null };

function reducer(state, action) {
  switch (action.type) {
    case "loading":
      return { ...state, status: "loading" };
    case "set":
      return { ...state, status: "succeeded", products: action.payload };
    case "add":
      return { ...state, products: [...state.products, action.payload] };
    case "edit":
      return {
        ...state,
        products: state.products.map((p) =>
          p.id === action.payload.id ? action.payload : p
        ),
      };
    case "delete":
      return {
        ...state,
        products: state.products.filter((p) => p.id !== action.payload),
      };
    case "error":
      return { ...state, status: "failed", error: action.payload };
    default:
      return state;
  }
}

export const ProductContext = createContext();

export function ProductProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initial);

  const fetchProducts = async () => {
    dispatch({ type: "loading" });
    try {
      const items = await api.getProducts();
      dispatch({ type: "set", payload: items });
    } catch (e) {
      dispatch({ type: "error", payload: e.message });
    }
  };

  const addProduct = async (p) => {
    const newP = await api.addProduct(p);
    dispatch({ type: "add", payload: newP });
    return newP;
  };

  const editProduct = async (id, data) => {
    const upd = await api.updateProduct(id, data);
    dispatch({ type: "edit", payload: upd });
    return upd;
  };

  const deleteProduct = async (id) => {
    await api.deleteProduct(id);
    dispatch({ type: "delete", payload: id });
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <ProductContext.Provider
      value={{ ...state, fetchProducts, addProduct, editProduct, deleteProduct }}
    >
      {children}
    </ProductContext.Provider>
  );
}
