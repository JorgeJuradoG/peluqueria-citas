import bcrypt from "bcryptjs";
import { DateTime } from "luxon";
import Stylist from "../models/Stylist.js";
import User from "../models/User.js";
import Service from "../models/Service.js";
import Appointment from "../models/Appointment.js";
import { getAvailableSlots } from "../utils/availability.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
const PHONE_RE = /^\+?[\d\s-]{9,15}$/;

// Horario por defecto: lunes a viernes, mañana y tarde. El admin lo ajusta después
const DEFAULT_HOURS = [1, 2, 3, 4, 5].flatMap((dayOfWeek) => [
  { dayOfWeek, start: "09:00", end: "14:00" },
  { dayOfWeek, start: "16:00", end: "20:00" },
]);

// ¿Todos los ids son servicios de esta peluquería?
async function allServicesBelong(ids, salon) {
  if (!Array.isArray(ids)) return false;
  const unique = new Set(ids.map(String));
  const count = await Service.countDocuments({ _id: { $in: [...unique] }, salon });
  return count === unique.size;
}

export async function getStylists(req, res) {
  const stylists = await Stylist.find({ salon: req.salon._id, active: true })
    .populate("user", "name email")
    .populate("services", "name durationMinutes price");
  res.json(stylists);
}

// Admin: incluye los desactivados
export async function getAllStylists(req, res) {
  const stylists = await Stylist.find({ salon: req.salon._id })
    .sort({ active: -1, createdAt: 1 })
    .populate("user", "name email")
    .populate("services", "name durationMinutes price");
  res.json(stylists);
}

export async function getStylistById(req, res) {
  const stylist = await Stylist.findOne({ _id: req.params.id, salon: req.salon._id })
    .populate("user", "name email")
    .populate("services", "name durationMinutes price");
  if (!stylist) {
    return res.status(404).json({ message: "Estilista no encontrado" });
  }
  res.json(stylist);
}

export async function createStylist(req, res) {
  const salon = req.salon._id;
  const { userId, bio, services = [], workingHours, daysOff } = req.body;

  if (!(await allServicesBelong(services, salon))) {
    return res.status(400).json({ message: "Algún servicio no existe en esta peluquería" });
  }

  let user;
  let createdUser = false;

  if (userId) {
    // Convertir en estilista a un usuario que ya existe en ESTA peluquería
    user = await User.findOne({ _id: userId, salon });
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
  } else {
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
      return res.status(400).json({
        message: "La contraseña debe tener al menos 8 caracteres, una letra y un número",
      });
    }

    user = await User.findOne({ salon, email });
    if (!user) {
      user = await User.create({
        salon,
        name,
        email,
        phone,
        passwordHash: await bcrypt.hash(password, 10),
        role: "stylist",
      });
      createdUser = true;
    }
    // Si ya existía como cliente, se le promociona (conserva SU contraseña)
  }

  if (user.role === "admin" || user.role === "superadmin") {
    return res.status(409).json({ message: "Un administrador no puede ser estilista" });
  }
  if (await Stylist.exists({ user: user._id })) {
    return res.status(409).json({ message: "Esa persona ya es estilista" });
  }

  try {
    const stylist = await Stylist.create({
      salon,
      user: user._id,
      bio,
      services,
      workingHours: workingHours?.length ? workingHours : DEFAULT_HOURS,
      daysOff,
    });

    if (user.role === "client") {
      user.role = "stylist";
      await user.save();
    }

    res.status(201).json({ stylist, accountCreated: createdUser });
  } catch (err) {
    // No dejamos una cuenta huérfana si falló el perfil
    if (createdUser) await User.deleteOne({ _id: user._id });
    throw err;
  }
}

export async function updateStylist(req, res) {
  const salon = req.salon._id;
  const { bio, services, workingHours, daysOff, active } = req.body;

  const stylist = await Stylist.findOne({ _id: req.params.id, salon });
  if (!stylist) {
    return res.status(404).json({ message: "Estilista no encontrado" });
  }

  if (services !== undefined) {
    if (!(await allServicesBelong(services, salon))) {
      return res.status(400).json({ message: "Algún servicio no existe en esta peluquería" });
    }
    stylist.services = services;
  }
  if (bio !== undefined) stylist.bio = bio;
  if (workingHours !== undefined) stylist.workingHours = workingHours;
  if (daysOff !== undefined) stylist.daysOff = daysOff;
  if (active !== undefined) stylist.active = active;

  await stylist.save();
  res.json(stylist);
}

export async function getAvailability(req, res) {
  const { date, serviceId, excludeAppointment } = req.query;
  const salon = req.salon._id;
  const TZ = req.salon.timezone;

  const localDay = DateTime.fromISO(String(date), { zone: TZ }).startOf("day");
  if (!localDay.isValid) {
    return res.status(400).json({ message: "Fecha inválida (usa formato AAAA-MM-DD)" });
  }

  const [stylist, service] = await Promise.all([
    Stylist.findOne({ _id: req.params.id, salon }),
    Service.findOne({ _id: serviceId, salon }),
  ]);
  if (!stylist || !stylist.active) {
    return res.status(404).json({ message: "Estilista no encontrado" });
  }
  if (!service || !service.active) {
    return res.status(404).json({ message: "Servicio no encontrado" });
  }
  if (!stylist.services.some((s) => s.equals(service._id))) {
    return res.status(400).json({ message: "Este estilista no ofrece ese servicio" });
  }

  const dayStart = localDay.toJSDate();
  const dayEnd = localDay.plus({ days: 1 }).toJSDate();

  const appointments = await Appointment.find({
    salon,
    stylist: stylist._id,
    status: { $in: ["pending", "confirmed"] },
    start: { $lt: dayEnd },
    end: { $gt: dayStart },
    ...(excludeAppointment ? { _id: { $ne: excludeAppointment } } : {}),
  });

  const slots = getAvailableSlots({ stylist, service, localDay, appointments, tz: TZ });
  res.json({ date: localDay.toISODate(), slots });
}