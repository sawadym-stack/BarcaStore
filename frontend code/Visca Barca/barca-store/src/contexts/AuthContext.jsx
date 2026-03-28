import React, { createContext, useReducer, useEffect } from "react";
import * as api from "../api/api";
import { toast } from "react-toastify";

/* ================== STORAGE KEYS ================== */

const SESSION_KEY = "barca_session";
const TOKEN_KEY = "barca_token";

/* ================== INITIAL STATE ================== */

const initial = {
  user: JSON.parse(sessionStorage.getItem(SESSION_KEY)) || null,
  status: "idle",
  error: null,
};

/* ================== REDUCER ================== */

function reducer(state, action) {
  switch (action.type) {
    case "pending":
      return { ...state, status: "loading", error: null };

    case "loginSuccess":
      return { 
        ...state, 
        status: "succeeded", 
        user: state.user ? { ...state.user, ...action.payload } : action.payload 
      };

    case "logout":
      return { ...state, user: null, status: "idle" };

    case "error":
      return { ...state, status: "failed", error: action.payload };

    case "succeeded":
      return { ...state, status: "succeeded" };

    default:
      return state;
  }
}

export const AuthContext = createContext();

/* ================== PROVIDER ================== */

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initial);

  /* ---------- persist session ---------- */
  useEffect(() => {
    if (state.user) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(state.user));
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }, [state.user]);

  /* ---------- hydrate from token ---------- */
  useEffect(() => {
    const hydrate = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        dispatch({ type: "pending" });
        try {
          const user = await api.getProfile();
          dispatch({ type: "loginSuccess", payload: user });
        } catch (err) {
          // Token invalid or expired
          localStorage.removeItem(TOKEN_KEY);
          sessionStorage.removeItem(SESSION_KEY);
          dispatch({ type: "logout" });
        }
      }
    };
    hydrate();
  }, []);

  /* ---------- ref for stable polling ---------- */
  const userRef = React.useRef(state.user);
  useEffect(() => { userRef.current = state.user; }, [state.user]);

  /* 
     SECURITY FEATURE: Session & Account Status Polling
     This effect runs every 10 seconds to sync the local user state with the backend.
     It ensures that:
     1. If an Admin suspends/blocks the user, they are kicked out of the app immediately.
     2. If the session token expires or is invalidated server-side, the user is redirected to login.
     3. Profile photo/name changes are synced in the background.
     Uses a ref to avoid re-creating the interval on every user state change.
  */
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!userRef.current) return;
      try {
        const latestUser = await api.getProfile();

        if (latestUser.status === "Suspended") {
          logout();
          toast.error("Your account has been suspended.");
          window.location.href = "/login";
        } else {
          // Only dispatch if something actually changed
          const cur = userRef.current;
          const changed = 
            cur.name !== latestUser.name ||
            cur.email !== latestUser.email ||
            cur.role !== latestUser.role ||
            (cur.profile_photo || "") !== (latestUser.profile_photo || "");
          if (changed) {
            dispatch({ type: "loginSuccess", payload: latestUser });
          }
        }
      } catch (err) {
        // If 401/403, it means token is invalid or blocked
        if (err.message.includes("Login") || err.message.includes("unauthorized") || err.message.includes("Suspended")) {
          logout();
          window.location.href = "/login";
        }
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, []); // stable - no deps

  /* ================== AUTH ACTIONS ================== */

  const login = async (data) => {
    dispatch({ type: "pending" });
    try {
      const user = await api.login(data);

      if (user.status === "Suspended") {
        toast.error("Your account is suspended.");
        throw new Error("Suspended");
      }

      dispatch({ type: "loginSuccess", payload: user });
      toast.success(`Welcome back, ${user.name}.`);
      return user;
    } catch (e) {
      dispatch({ type: "error", payload: e.message });
      throw e;
    }
  };

  const register = async ({ name, email, password }) => {
    dispatch({ type: "pending" });
    try {
      const res = await api.register({ name, email, password });
      toast.info("OTP sent to your email.");
      return res;
    } catch (e) {
      dispatch({ type: "error", payload: e.message });
      toast.error(e.message);
      throw e;
    }
  };

  const verifyOTP = async ({ email, otp }) => {
    dispatch({ type: "pending" });
    try {
      await api.verifyOTP({ email, otp });
      toast.success("Account verified. You can sign in now.");
      dispatch({ type: "succeeded" });
    } catch (e) {
      dispatch({ type: "error", payload: e.message });
      toast.error(e.message);
      throw e;
    }
  };

  const logout = async () => {
    // Call backend to invalidate refresh token server-side
    await api.logoutAPI();
    dispatch({ type: "logout" });
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("barca_refresh_token");
    sessionStorage.removeItem(SESSION_KEY);
  };

  const updateProfile = async (userData) => {
    try {
      const updatedUser = await api.updateProfile(userData);
      dispatch({ type: "loginSuccess", payload: updatedUser });
      toast.success("Profile updated.");
      return updatedUser;
    } catch (e) {
      toast.error(e.message);
      throw e;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        verifyOTP,
        logout,
        updateProfile,
        setUser: (u) => dispatch({ type: "loginSuccess", payload: u }),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

