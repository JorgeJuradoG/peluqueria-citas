import crypto from "crypto";
import AuthToken from "../models/AuthToken.js";

export const RESET_TTL_MS = 60 * 60 * 1000; // 1 hora
export const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 días
export const VERIFY_TTL_MS = 48 * 60 * 60 * 1000; // 48 horas

export const hashToken = (raw) => crypto.createHash("sha256").update(raw).digest("hex");

// Crea un token nuevo y devuelve el valor en claro (solo se envía por correo)
export async function issueToken({ user, type, ttlMs }) {
  // Un token nuevo anula los anteriores sin usar de ESE tipo en esa cuenta
  await AuthToken.deleteMany({ user: user._id, type, usedAt: null });

  const raw = crypto.randomBytes(32).toString("hex");
  await AuthToken.create({
    salon: user.salon,
    user: user._id,
    type,
    tokenHash: hashToken(raw),
    expiresAt: new Date(Date.now() + ttlMs),
  });
  return raw;
}