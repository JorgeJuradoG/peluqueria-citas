import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const backend = "http://localhost:4000";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Vite rechaza dominios desconocidos (como el de un túnel). Solo para desarrollo
    allowedHosts: true,
    proxy: {
      "/api": backend,
      "/socket.io": { target: backend, ws: true },
    },
  },
});