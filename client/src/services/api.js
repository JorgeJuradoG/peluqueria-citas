import axios from "axios";
import { SALON_SLUG, BASENAME, TOKEN_KEY, USER_KEY } from "../lib/salon";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (SALON_SLUG) config.headers["X-Salon"] = SALON_SLUG;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isLogin = err.config?.url?.startsWith("/auth/login");
    if (err.response?.status === 401 && localStorage.getItem(TOKEN_KEY) && !isLogin) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.location.href = `${BASENAME}/login`;
    }
    return Promise.reject(err);
  }
);

export default api;