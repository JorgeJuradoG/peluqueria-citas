import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

function signToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export async function register(req, res) {
  const { name, email, password } = req.body;

  if (!name || !email || !password || password.length < 8) {
    return res.status(400).json({
      message: "Nombre, email y contraseña (mínimo 8 caracteres) son obligatorios",
    });
  }

  // El rol NO se toma del body: todo registro público es "client"
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash });

  res.status(201).json({ token: signToken(user), user: publicUser(user) });
}

export async function login(req, res) {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email?.toLowerCase() });
  const valid = user && (await bcrypt.compare(password || "", user.passwordHash));

  if (!valid) {
    return res.status(401).json({ message: "Email o contraseña incorrectos" });
  }

  res.json({ token: signToken(user), user: publicUser(user) });
}