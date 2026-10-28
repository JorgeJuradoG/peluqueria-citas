import express from "express";
import cors from "cors";
import helmet from "helmet";
import { allowedOrigins } from "./utils/origins.js";
import { resolveSalon } from "./middlewares/salon.js";
import { demoGuard } from "./middlewares/demo.js";
import { notFound, errorHandler } from "./middlewares/errorHandler.js";
import salonRoutes from "./routes/salonRoutes.js";
import salonSettingsRoutes from "./routes/salonSettingsRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js";
import stylistRoutes from "./routes/stylistRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import statsRoutes from "./routes/statsRoutes.js";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

// Cabeceras de seguridad. La política de contenido cubre la web que entrega este mismo
// servidor en producción: todo propio salvo los estilos en línea, que React usa a menudo
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:"],
        fontSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"],
        formAction: ["'self'"],
      },
    },
  })
);

// Solo la web propia puede llamar a la API desde el navegador
app.use(cors({ origin: allowedOrigins() }));
app.use(express.json());

// --- Rutas públicas: NO necesitan peluquería ---
app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "Servidor funcionando" });
});

app.use("/api/salons", salonRoutes);

// --- A partir de aquí, todo requiere la cabecera X-Salon ---
app.use("/api", resolveSalon);
app.use("/api", demoGuard); // las peluquerías de demostración no admiten escrituras

app.use("/api/auth", authRoutes);
app.use("/api/salon-settings", salonSettingsRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/stylists", stylistRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/stats", statsRoutes);

// En producción, el mismo servidor entrega la web ya compilada
if (process.env.NODE_ENV === "production") {
  const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../client/dist");
  app.use(express.static(dist));
  // Cualquier GET que no sea API devuelve la app (así funcionan /s/demo, /inicio...)
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api")) return next();
    res.sendFile(path.join(dist, "index.html"));
  });
}
app.use(notFound);
app.use(errorHandler);

export default app;