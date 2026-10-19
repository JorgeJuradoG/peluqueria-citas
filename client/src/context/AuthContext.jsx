import { createContext, useContext, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  });

  function saveSession({ token, user }) {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
  }

  async function login(email, password) {
    const { data } = await api.post("/auth/login", { email, password });
    saveSession(data);
  }

  async function register(name, email, password) {
    const { data } = await api.post("/auth/register", { name, email, password });
    saveSession(data);
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}