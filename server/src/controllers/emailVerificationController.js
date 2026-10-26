import User from "../models/User.js";
import AuthToken from "../models/AuthToken.js";
import { hashToken, issueToken, VERIFY_TTL_MS } from "../services/authTokens.js";
import { sendEmailVerification } from "../services/authMails.js";

const INVALID_LINK = "El enlace no es válido o ha caducado";

// Con sesión iniciada: envía (o reenvía) el enlace de confirmación
export async function sendVerification(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

  if (user.emailVerified !== false) {
    return res.json({ message: "Tu correo ya está confirmado", emailVerified: true });
  }

  // Descanso de 60 s por cuenta, como al recuperar la contraseña
  const recent = await AuthToken.exists({
    user: user._id,
    type: "verify",
    createdAt: { $gt: new Date(Date.now() - 60 * 1000) },
  });
  if (recent) {
    return res.status(429).json({ message: "Espera un minuto antes de pedir otro correo" });
  }

  const raw = await issueToken({ user, type: "verify", ttlMs: VERIFY_TTL_MS });
  sendEmailVerification(user, req.salon, raw); // sin await: nunca rompe la respuesta
  res.json({ message: "Te hemos enviado un correo para confirmar tu dirección" });
}

// Público: el enlace del correo. Consumo atómico, un solo uso
export async function confirmEmail(req, res) {
  const raw = String(req.body.token || "");

  const doc = await AuthToken.findOneAndUpdate(
    {
      tokenHash: hashToken(raw),
      salon: req.salon._id,
      type: "verify",
      usedAt: null,
      expiresAt: { $gt: new Date() },
    },
    { $set: { usedAt: new Date() } }
  );
  if (!doc) return res.status(400).json({ message: INVALID_LINK });

  const result = await User.updateOne({ _id: doc.user }, { $set: { emailVerified: true } });
  if (result.matchedCount === 0) return res.status(400).json({ message: INVALID_LINK });

  res.json({ message: "Correo confirmado", emailVerified: true });
}