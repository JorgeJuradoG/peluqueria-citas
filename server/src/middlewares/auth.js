import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");

  if (type !== "Bearer" || !token) {
    return res.status(401).json({ message: "Token requerido" });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }

  const user = await User.findById(payload.id).select("role tokenVersion salon");
  if (!user || (payload.tv ?? 0) !== (user.tokenVersion ?? 0)) {
    return res.status(401).json({ message: "Sesión no válida. Vuelve a iniciar sesión" });
  }

  // Una cuenta solo funciona en SU peluquería
  if (String(user.salon) !== String(req.salon._id)) {
    return res.status(403).json({ message: "Esta cuenta pertenece a otra peluquería" });
  }

  req.user = { id: user._id.toString(), role: user.role, salon: user.salon.toString() };
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "No tienes permisos para esto" });
    }
    next();
  };
}