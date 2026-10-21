import { Router } from "express";
import rateLimit from "express-rate-limit";
import { createSalon, getSalonPublic } from "../controllers/salonController.js";

const router = Router();

// Evita que alguien cree peluquerías en bucle
const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiadas altas desde esta conexión. Inténtalo más tarde" },
});

router.post("/", createLimiter, createSalon);
router.get("/:slug", getSalonPublic);

export default router;