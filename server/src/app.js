import express from "express";
import cors from "cors";
import { resolveSalon } from "./middlewares/salon.js";
import { notFound, errorHandler } from "./middlewares/errorHandler.js";
import salonRoutes from "./routes/salonRoutes.js";
import salonSettingsRoutes from "./routes/salonSettingsRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js";
import stylistRoutes from "./routes/stylistRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

// --- Rutas públicas: NO necesitan peluquería ---
app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "Servidor funcionando" });
});

app.use("/api/salons", salonRoutes);

// --- A partir de aquí, todo requiere la cabecera X-Salon ---
app.use("/api", resolveSalon);

app.use("/api/auth", authRoutes);
app.use("/api/salon-settings", salonSettingsRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/stylists", stylistRoutes);
app.use("/api/appointments", appointmentRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;