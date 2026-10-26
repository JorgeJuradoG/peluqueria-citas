import bcrypt from "bcryptjs";
import User from "../models/User.js";
import AuthToken from "../models/AuthToken.js";
import { hashToken, issueToken, RESET_TTL_MS } from "../services/authTokens.js";
import { sendPasswordReset } from "../services/authMails.js";
import { signToken, publicUser } from "./authController.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
const INVALID_LINK = "El enlace no es válido o ha caducado";

// Pide el enlace. Responde SIEMPRE lo mismo, exista o no la cuenta
export async function forgotPassword(req, res) {
  const generic = {
    message:
      "Si existe una cuenta con ese email, te hemos enviado un enlace para restablecer la contraseña.",
  };
  const email = String(req.body.email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return res.json(generic);

  const user = await User.findOne({ salon: req.salon._id, email });
  if (user) {
    // Descanso de 60 s por cuenta: evita inundar la bandeja de alguien
    const recent = await AuthToken.exists({
      user: user._id,
      type: "reset",
      createdAt: { $gt: new Date(Date.now() - 60 * 1000) },
    });
    if (!recent) {
      const raw = await issueToken({ user, type: "reset", ttlMs: RESET_TTL_MS });
      sendPasswordReset(user, req.salon, raw); // sin await: la respuesta tarda igual exista o no
    }
  }
  res.json(generic);
}

// La pantalla comprueba el enlace antes de enseñar el formulario
export async function tokenInfo(req, res) {
  const raw = String(req.body.token || "");
  const doc = await AuthToken.findOne({
    tokenHash: hashToken(raw),
    salon: req.salon._id,
    type: { $in: ["reset","invite"]},
    usedAt: null,
    expiresAt: { $gt: new Date() },
  }).populate("user", "name email");

  if (!doc || !doc.user) return res.status(400).json({ message: INVALID_LINK });
  res.json({ type: doc.type, name: doc.user.name, email: doc.user.email });
}

// Fija la contraseña nueva, consume el token y abre sesión
export async function resetPassword(req, res) {
  const raw = String(req.body.token || "");
  const password = String(req.body.password || "");

  // Se valida ANTES de consumir el token: un error de formato no lo quema
  if (!PASSWORD_RE.test(password)) {
    return res.status(400).json({
      message: "La contraseña debe tener al menos 8 caracteres, una letra y un número",
    });
  }

  // Consumo atómico: dos peticiones a la vez no pueden usar el mismo token
  const doc = await AuthToken.findOneAndUpdate(
    {
      tokenHash: hashToken(raw),
      salon: req.salon._id,
      type: { $in: ["reset","invite"]},
      usedAt: null,
      expiresAt: { $gt: new Date() },
    },
    { $set: { usedAt: new Date() } }
  );
  if (!doc) return res.status(400).json({ message: INVALID_LINK });

  const user = await User.findById(doc.user);
  if (!user) return res.status(400).json({ message: INVALID_LINK });

  user.passwordHash = await bcrypt.hash(password, 10);
  user.tokenVersion = (user.tokenVersion ?? 0) + 1; // cierra las sesiones abiertas
  user.pendingInvite = false;
  user.emailVerified = true;
  await user.save();

  await AuthToken.deleteMany({ user: user._id, usedAt: null });

  res.json({ token: signToken(user), user: publicUser(user) });
}