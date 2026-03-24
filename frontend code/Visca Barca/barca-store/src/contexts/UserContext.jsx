import React, { createContext, useReducer, useEffect, useContext } from "react";
import * as api from "../api/api";
import { AuthContext } from "./AuthContext";

/* ---------------- INITIAL STATE ---------------- */

const initial = {
  users: [],
  status: "idle",
  error: null
};

/* ---------------- REDUCER ---------------- */

function reducer(state, action) {
  switch (action.type) {

    case "set":
      return {
        ...state,
        users: action.payload,
        status: "succeeded"
      };

    // ✅ UPDATE SINGLE USER LOCALLY (KEY FIX)
    case "update":
      return {
        ...state,
        users: state.users.map((u) =>
          u.id === action.payload.id
            ? { ...u, ...action.payload.data }
            : u
        )
      };

    case "error":
      return {
        ...state,
        error: action.payload,
        status: "failed"
      };

    default:
      return state;
  }
}

/* ---------------- CONTEXT ---------------- */

export const UserContext = createContext();

/* ---------------- PROVIDER ---------------- */

export function UserProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const { user } = useContext(AuthContext);

  /* FETCH USERS */
  const fetchUsers = async () => {
      dispatch({ type: "loading" }); 
    try {
      const users = await api.getUsers();
      dispatch({ type: "set", payload: users });
    } catch (e) {
      dispatch({ type: "error", payload: e.message });
    }
  };

  /* ✅ UPDATE USER (API + STATE) */
  const updateUser = async (id, data) => {
    try {
      await api.updateUser(id, data);

      // 🔥 update React state instantly
      dispatch({
        type: "update",
        payload: { id, data }
      });
    } catch (e) {
      dispatch({ type: "error", payload: e.message });
      throw e;
    }
  };

  // Only fetch users if the logged-in user is an admin
  useEffect(() => {
    if (user && (user.role === "admin" || user.role === "superadmin")) {
      fetchUsers();
    }
  }, [user]);

  return (
    <UserContext.Provider
      value={{
        users: state.users,
        status: state.status,
        error: state.error,
        fetchUsers,
        updateUser // ✅ EXPOSE THIS
      }}
    >
      {children}
    </UserContext.Provider>
  );
}
