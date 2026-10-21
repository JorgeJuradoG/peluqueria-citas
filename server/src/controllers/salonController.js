import bcrypt from "bcryptjs";
import Salon from "../models/Salon.js";
import User from "../models/User.js";
import { signToken, publicUser } from "./authController.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const RESERVED = new Set(["admin", "api", "app", "www", "login", "crear-peluqueria", "s"]);

function validTimezone(tz) {
  try {
    new Intl.DateTimeFormat("es", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

// Público: datos mínimos de una peluquería (el frontend comprueba que existe)
export async function getSalonPublic(req, res) {
  const salon = await Salon.findOne({
    slug: String(req.params.slug).toLowerCase(),
    active: true,
  }).select("name slug timezone");
  if (!salon) {
    return res.status(404).json({ message: "Peluquería no encontrada" });
  }
  res.json(salon);
}

// Público: el dueño crea su peluquería y su cuenta de administrador
export async function createSalon(req, res) {
  const salonName = String(req.body.salonName || "").trim();
  const slug = String(req.body.slug || "").trim().toLowerCase();
  const timezone = String(req.body.timezone || "Europe/Madrid");
  const adminName = String(req.body.adminName || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (salonName.length < 2 || salonName.length > 80) {
    return res.status(400).json({ message: "El nombre del negocio debe tener entre 2 y 80 caracteres" });
  }
  if (slug.length < 3 || slug.length > 40 || !SLUG_RE.test(slug) || RESERVED.has(slug)) {
    return res.status(400).json({
      message: "La dirección debe tener 3-40 caracteres: minúsculas, números y guiones",
    });
  }
  if (!validTimezone(timezone)) {
    return res.status(400).json({ message: "Zona horaria no válida" });
  }
  if (adminName.length < 2 || adminName.length > 60) {
    return res.status(400).json({ message: "Tu nombre debe tener entre 2 y 60 caracteres" });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ message: "Email no válido" });
  }
  if (!PASSWORD_RE.test(password)) {
    return res.status(400).json({
      message: "La contraseña debe tener al menos 8 caracteres, una letra y un número",
    });
  }

  if (await Salon.exists({ slug })) {
    return res.status(409).json({ message: "Esa dirección ya está en uso. Prueba con otra" });
  }

  const salon = await Salon.create({ name: salonName, slug, timezone });

  let admin;
  try {
    admin = await User.create({
      salon: salon._id,
      name: adminName,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: "admin",
    });
  } catch (err) {
    await Salon.deleteOne({ _id: salon._id }); // no dejamos una peluquería sin dueño
    throw err;
  }

  res.status(201).json({
    token: signToken(admin),
    user: publicUser(admin),
    salon: { name: salon.name, slug: salon.slug },
  });
}