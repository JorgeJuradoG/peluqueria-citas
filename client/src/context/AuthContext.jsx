import { createContext, useContext, useState } from "react";
import api from "../services/api";
import { TOKEN_KEY, USER_KEY } from "../lib/salon";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY));
    } catch {
      return null;
    }
  });

  function updateUser(next) {
    localStorage.setItem(USER_KEY, JSON.stringify(next));
    setUser(next);
  }

  function saveSession({ token, user }) {
    localStorage.setItem(TOKEN_KEY, token);
    updateUser(user);
  }

  async function login(email, password) {
    const { data } = await api.post("/auth/login", { email, password });
    saveSession(data);
  }

  async function register({ name, email, phone, password }) {
    const { data } = await api.post("/auth/register", { name, email, phone, password });
    saveSession(data);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, saveSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}