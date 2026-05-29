import { createContext, useContext, useReducer, useEffect, useCallback } from "react";
import api from "../services/api.js";

const AuthContext = createContext(null);

const initialState = {
  user:    null,
  token:   localStorage.getItem("mf_token") || null,
  loading: true,
  error:   null,
};

function authReducer(state, action) {
  switch (action.type) {
    case "SET_LOADING":  return { ...state, loading: action.payload };
    case "LOGIN_SUCCESS":
      return { ...state, user: action.payload.user, token: action.payload.token, loading: false, error: null };
    case "LOGOUT":
      return { ...initialState, token: null, loading: false };
    case "UPDATE_USER":  return { ...state, user: { ...state.user, ...action.payload } };
    case "SET_ERROR":    return { ...state, error: action.payload, loading: false };
    default:             return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // ── Bootstrap: load user from stored token ─────────────
  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("mf_token");
      if (!token) { dispatch({ type: "SET_LOADING", payload: false }); return; }
      try {
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        const { data } = await api.get("/api/auth/me");
        dispatch({ type: "LOGIN_SUCCESS", payload: { user: data.user, token } });
      } catch {
        localStorage.removeItem("mf_token");
        dispatch({ type: "LOGOUT" });
      }
    };
    init();
  }, []);

  const login = useCallback(async (email, password) => {
    dispatch({ type: "SET_LOADING", payload: true });
    const { data } = await api.post("/api/auth/login", { email, password });
    localStorage.setItem("mf_token", data.token);
    api.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
    dispatch({ type: "LOGIN_SUCCESS", payload: data });
    return data;
  }, []);

  const register = useCallback(async (formData) => {
    dispatch({ type: "SET_LOADING", payload: true });
    const { data } = await api.post("/api/auth/register", formData);
    localStorage.setItem("mf_token", data.token);
    api.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
    dispatch({ type: "LOGIN_SUCCESS", payload: data });
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("mf_token");
    delete api.defaults.headers.common["Authorization"];
    dispatch({ type: "LOGOUT" });
  }, []);

  const updateUser = useCallback((updates) => {
    dispatch({ type: "UPDATE_USER", payload: updates });
  }, []);

  const isRole = useCallback((...roles) => roles.includes(state.user?.role), [state.user]);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateUser, isRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
