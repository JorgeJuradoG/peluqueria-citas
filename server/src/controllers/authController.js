import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
const PHONE_RE = /^\+?[\d\s-]{9,15}$/;

const PASSWORD_MSG = "La contraseña debe tener al menos 8 caracteres, una letra y un número";

export function signToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role, tv: user.tokenVersion ?? 0 },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

export function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    role: user.role,
    createdAt: user.createdAt,
  };
}

export async function register(req, res) {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const phone = String(req.body.phone || "").trim();
  const password = String(req.body.password || "");

  if (name.length < 2 || name.length > 60) {
    return res.status(400).json({ message: "El nombre debe tener entre 2 y 60 caracteres" });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ message: "Email no válido" });
  }
  if (phone && !PHONE_RE.test(phone)) {
    return res.status(400).json({ message: "Teléfono no válido" });
  }
  if (!PASSWORD_RE.test(password)) {
    return res.status(400).json({ message: PASSWORD_MSG });
  }

  // El rol NO se toma del body: todo registro público es "client"
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    salon: req.salon._id,
    name,
    email,
    phone,
    passwordHash,
  });

  res.status(201).json({ token: signToken(user), user: publicUser(user) });
}

export async function login(req, res) {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  const user = await User.findOne({ salon: req.salon._id, email });
  const valid = user && (await bcrypt.compare(password, user.passwordHash));

  if (!valid) {
    return res.status(401).json({ message: "Email o contraseña incorrectos" });
  }

  res.json({ token: signToken(user), user: publicUser(user) });
}

export async function getMe(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
  res.json(publicUser(user));
}

export async function updateMe(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

  const name = String(req.body.name ?? user.name).trim();
  const phone = String(req.body.phone ?? user.phone ?? "").trim();

  if (name.length < 2 || name.length > 60) {
    return res.status(400).json({ message: "El nombre debe tener entre 2 y 60 caracteres" });
  }
  if (phone && !PHONE_RE.test(phone)) {
    return res.status(400).json({ message: "Teléfono no válido" });
  }

  user.name = name;
  user.phone = phone;
  await user.save();

  res.json(publicUser(user));
}

export async function changePassword(req, res) {
  const currentPassword = String(req.body.currentPassword || "");
  const newPassword = String(req.body.newPassword || "");

  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) {
    return res.status(400).json({ message: "La contraseña actual no es correcta" });
  }
  if (!PASSWORD_RE.test(newPassword)) {
    return res.status(400).json({ message: PASSWORD_MSG });
  }
  if (newPassword === currentPassword) {
    return res.status(400).json({ message: "La nueva contraseña debe ser distinta" });
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  user.tokenVersion = (user.tokenVersion ?? 0) + 1;
  await user.save();

  res.json({
    message: "Contraseña actualizada",
    token: signToken(user),
    user: publicUser(user),
  });
}