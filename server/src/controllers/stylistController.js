import Stylist from "../models/Stylist.js";
import User from "../models/User.js";
import Service from "../models/Service.js";
import Appointment from "../models/Appointment.js";
import { DateTime } from "luxon";
import { getAvailableSlots } from "../utils/availability.js";

export async function getStylists(req, res) {
  const stylists = await Stylist.find({ active: true })
    .populate("user", "name email")
    .populate("services", "name durationMinutes price");
  res.json(stylists);
}

export async function getStylistById(req, res) {
  const stylist = await Stylist.findById(req.params.id)
    .populate("user", "name email")
    .populate("services", "name durationMinutes price");
  if (!stylist) {
    return res.status(404).json({ message: "Estilista no encontrado" });
  }
  res.json(stylist);
}

export async function createStylist(req, res) {
  const { userId, bio, services, workingHours, daysOff } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: "Usuario no encontrado" });
  }

  // Al crear el perfil, el usuario pasa a tener rol stylist
  if (user.role === "client") {
    user.role = "stylist";
    await user.save();
  }

  const stylist = await Stylist.create({
    user: userId,
    bio,
    services,
    workingHours,
    daysOff,
  });
  res.status(201).json(stylist);
}

export async function updateStylist(req, res) {
  const { bio, services, workingHours, daysOff, active } = req.body;
  const stylist = await Stylist.findById(req.params.id);
  if (!stylist) {
    return res.status(404).json({ message: "Estilista no encontrado" });
  }

  if (bio !== undefined) stylist.bio = bio;
  if (services !== undefined) stylist.services = services;
  if (workingHours !== undefined) stylist.workingHours = workingHours;
  if (daysOff !== undefined) stylist.daysOff = daysOff;
  if (active !== undefined) stylist.active = active;

  await stylist.save();
  res.json(stylist);
}

export async function getAvailability(req, res) {
  const { date, serviceId } = req.query;
  const TZ = process.env.SALON_TIMEZONE || "Europe/Madrid";

  const localDay = DateTime.fromISO(String(date), { zone: TZ }).startOf("day");
  if (!localDay.isValid) {
    return res.status(400).json({ message: "Fecha inválida (usa formato AAAA-MM-DD)" });
  }

  const [stylist, service] = await Promise.all([
    Stylist.findById(req.params.id),
    Service.findById(serviceId),
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
    stylist: stylist._id,
    status: { $in: ["pending", "confirmed"] },
    start: { $lt: dayEnd },
    end: { $gt: dayStart },
  });

  const slots = getAvailableSlots({ stylist, service, localDay, appointments });
  res.json({ date: localDay.toISODate(), slots });
}