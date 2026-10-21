import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  register,
  login,
  getMe,
  updateMe,
  changePassword,
} from "../controllers/authController.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiados intentos. Prueba de nuevo en unos minutos." },
});

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);

router.get("/me", requireAuth, getMe);
router.put("/me", requireAuth, updateMe);
router.put("/password", requireAuth, changePassword);

export default router;