import axios from "axios";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
});

// Adjunta el token a cada petición si hay sesión guardada
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;

//Este archivo es el equivalente a tu Invoke-RestMethod con la cabecera Authorization: lo escribes una vez y todas las pantallas lo reutilizan.