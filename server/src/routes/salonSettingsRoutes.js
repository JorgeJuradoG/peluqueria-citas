import { Router } from "express";
import rateLimit from "express-rate-limit";
import { updateSalonSettings } from "../controllers/salonController.js";
import { exportSalonData, deleteSalon } from "../controllers/salonAccountController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

// Cerrar la peluquería es irreversible: pocos intentos por hora
const closeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
  message: { message: "Demasiados intentos. Inténtalo de nuevo más tarde." },
});

router.put("/", requireAuth, requireRole("admin"), updateSalonSettings);

// Descarga de los datos de la peluquería (solo administrador)
router.get("/export", requireAuth, requireRole("admin"), exportSalonData);

// Cierre definitivo: pide la dirección de la peluquería y la contraseña
router.post("/close", closeLimiter, requireAuth, requireRole("admin"), deleteSalon);

export default router;