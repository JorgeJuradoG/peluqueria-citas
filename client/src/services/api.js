import axios from "axios";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers["X-Salon"] = import.meta.env.VITE_SALON_SLUG;
  return config;
});

// Si el token caduca o es inválido, limpiamos la sesión y volvemos al login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isLogin = err.config?.url?.startsWith("/auth/login");
    if (err.response?.status === 401 && localStorage.getItem("token") && !isLogin) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;