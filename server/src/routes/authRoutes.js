import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  register,
  login,
  getMe,
  updateMe,
  changePassword,
} from "../controllers/authController.js";
import {
  forgotPassword,
  tokenInfo,
  resetPassword,
} from "../controllers/passwordController.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiados intentos. Prueba de nuevo en unos minutos." },
});

const forgotLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiadas solicitudes. Inténtalo de nuevo más tarde." },
});

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);

router.post("/forgot-password", forgotLimiter, forgotPassword);
router.post("/token-info", authLimiter, tokenInfo);
router.post("/reset-password", authLimiter, resetPassword);

router.get("/me", requireAuth, getMe);
router.put("/me", requireAuth, updateMe);
router.put("/password", requireAuth, changePassword);

export default router;