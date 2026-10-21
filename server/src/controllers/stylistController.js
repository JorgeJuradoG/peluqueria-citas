import { DateTime } from "luxon";
import Stylist from "../models/Stylist.js";
import User from "../models/User.js";
import Service from "../models/Service.js";
import Appointment from "../models/Appointment.js";
import { getAvailableSlots } from "../utils/availability.js";

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

  const user = await User.findOne({ _id: userId, salon });
  if (!user) {
    return res.status(404).json({ message: "Usuario no encontrado" });
  }
  if (!(await allServicesBelong(services, salon))) {
    return res.status(400).json({ message: "Algún servicio no existe en esta peluquería" });
  }

  if (user.role === "client") {
    user.role = "stylist";
    await user.save();
  }

  const stylist = await Stylist.create({
    salon,
    user: user._id,
    bio,
    services,
    workingHours,
    daysOff,
  });
  res.status(201).json(stylist);
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
  const TZ = process.env.SALON_TIMEZONE || "Europe/Madrid";

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

  const slots = getAvailableSlots({ stylist, service, localDay, appointments });
  res.json({ date: localDay.toISODate(), slots });
}