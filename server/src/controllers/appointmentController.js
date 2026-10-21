import Appointment from "../models/Appointment.js";
import Stylist from "../models/Stylist.js";
import Service from "../models/Service.js";
import { fitsInWorkingHours } from "../utils/availability.js";
import { emitToStylist } from "../sockets/index.js";
import { DateTime } from "luxon";

const ACTIVE_STATUSES = ["pending", "confirmed"];

export async function createAppointment(req, res) {
  const { stylistId, serviceId, start, notes } = req.body;

  const startDate = new Date(start);
  if (isNaN(startDate.getTime())) {
    return res.status(400).json({ message: "Fecha de inicio inválida" });
  }
  if (startDate <= new Date()) {
    return res.status(400).json({ message: "La cita debe ser en el futuro" });
  }

  const [stylist, service] = await Promise.all([
    Stylist.findById(stylistId),
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

  const endDate = new Date(startDate.getTime() + service.durationMinutes * 60000);

  if (!fitsInWorkingHours(stylist, startDate, endDate)) {
    return res
      .status(400)
      .json({ message: "Ese horario está fuera del horario del estilista" });
  }

  // ¿Hay alguna cita activa del estilista que choque con esta franja?
  const overlap = await Appointment.findOne({
    stylist: stylist._id,
    status: { $in: ACTIVE_STATUSES },
    start: { $lt: endDate },
    end: { $gt: startDate },
  });
  if (overlap) {
    return res.status(409).json({ message: "Ese hueco ya está ocupado" });
  }

  const appointment = await Appointment.create({
    client: req.user.id,
    stylist: stylist._id,
    service: service._id,
    start: startDate,
    end: endDate,
    notes,
  });

  emitToStylist(stylist._id, "appointment:created", {
    stylistId: stylist._id,
    start: appointment.start,
    end: appointment.end,
  });

  res.status(201).json(appointment);
}

export async function getMyAppointments(req, res) {
  const appointments = await Appointment.find({ client: req.user.id })
    .sort({ start: 1 })
    .populate("service", "name durationMinutes price")
    .populate({ path: "stylist", populate: { path: "user", select: "name" } });
  res.json(appointments);
}

export async function cancelAppointment(req, res) {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    return res.status(404).json({ message: "Cita no encontrada" });
  }
  const isOwner = appointment.client.equals(req.user.id);
  if (!isOwner && req.user.role !== "admin") {
    return res.status(403).json({ message: "No puedes cancelar esta cita" });
  }
  appointment.status = "cancelled";
  await appointment.save();

  emitToStylist(appointment.stylist, "appointment:cancelled", {
    stylistId: appointment.stylist,
    start: appointment.start,
    end: appointment.end,
  });

  res.json(appointment);
}

export async function getAgenda(req, res) {
  const TZ = process.env.SALON_TIMEZONE || "Europe/Madrid";
  let rangeStart;
  let rangeEnd;

  if (req.query.from && req.query.to) {
    // Rango (vista semanal)
    rangeStart = new Date(String(req.query.from));
    rangeEnd = new Date(String(req.query.to));
    if (isNaN(rangeStart) || isNaN(rangeEnd) || rangeEnd <= rangeStart) {
      return res.status(400).json({ message: "Rango de fechas inválido" });
    }
    if (rangeEnd - rangeStart > 35 * 24 * 3600 * 1000) {
      return res.status(400).json({ message: "El rango máximo es de 35 días" });
    }
  } else {
    // Un solo día (vista lista)
    const localDay = DateTime.fromISO(String(req.query.date), { zone: TZ }).startOf("day");
    if (!localDay.isValid) {
      return res.status(400).json({ message: "Fecha inválida (usa formato AAAA-MM-DD)" });
    }
    rangeStart = localDay.toJSDate();
    rangeEnd = localDay.plus({ days: 1 }).toJSDate();
  }

  let stylistId;
  if (req.user.role === "admin") {
    stylistId = req.query.stylistId;
    if (!stylistId) {
      return res.status(400).json({ message: "Falta stylistId" });
    }
  } else {
    const profile = await Stylist.findOne({ user: req.user.id });
    if (!profile) {
      return res.status(404).json({ message: "No tienes perfil de estilista" });
    }
    stylistId = profile._id;
  }

  const appointments = await Appointment.find({
    stylist: stylistId,
    status: { $in: [...ACTIVE_STATUSES, "completed"] },
    start: { $lt: rangeEnd },
    end: { $gt: rangeStart },
  })
    .sort({ start: 1 })
    .populate("client", "name email")
    .populate("service", "name durationMinutes price");

  res.json({ stylistId, appointments });
}

export async function updateAppointmentStatus(req, res) {
  const { status } = req.body;
  if (!["completed", "cancelled"].includes(status)) {
    return res.status(400).json({ message: "Estado no permitido" });
  }

  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    return res.status(404).json({ message: "Cita no encontrada" });
  }

  // El admin puede con todas; el estilista solo con las suyas
  if (req.user.role !== "admin") {
    const profile = await Stylist.findOne({ user: req.user.id });
    if (!profile || !appointment.stylist.equals(profile._id)) {
      return res.status(403).json({ message: "Esta cita no es tuya" });
    }
  }

  if (!ACTIVE_STATUSES.includes(appointment.status)) {
    return res.status(409).json({ message: "Esta cita ya está cerrada" });
  }

  appointment.status = status;
  await appointment.save();

  emitToStylist(
    appointment.stylist,
    status === "cancelled" ? "appointment:cancelled" : "appointment:updated",
    { stylistId: appointment.stylist, start: appointment.start, end: appointment.end }
  );

  res.json(appointment);
}

export async function rescheduleAppointment(req, res) {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    return res.status(404).json({ message: "Cita no encontrada" });
  }

  const isOwner = appointment.client.equals(req.user.id);
  if (!isOwner && req.user.role !== "admin") {
    return res.status(403).json({ message: "No puedes modificar esta cita" });
  }
  if (!ACTIVE_STATUSES.includes(appointment.status)) {
    return res.status(409).json({ message: "Esta cita ya está cerrada" });
  }
  if (appointment.start <= new Date()) {
    return res.status(400).json({ message: "No se puede reprogramar una cita pasada" });
  }

  const newStart = new Date(req.body.start);
  if (isNaN(newStart.getTime()) || newStart <= new Date()) {
    return res.status(400).json({ message: "La nueva fecha debe ser válida y futura" });
  }

  const [stylist, service] = await Promise.all([
    Stylist.findById(appointment.stylist),
    Service.findById(appointment.service),
  ]);
  if (!stylist || !stylist.active || !service) {
    return res.status(404).json({ message: "Estilista o servicio no disponible" });
  }

  const newEnd = new Date(newStart.getTime() + service.durationMinutes * 60000);

  if (!fitsInWorkingHours(stylist, newStart, newEnd)) {
    return res
      .status(400)
      .json({ message: "Ese horario está fuera del horario del estilista" });
  }

  const overlap = await Appointment.findOne({
    _id: { $ne: appointment._id }, // ignora la propia cita
    stylist: stylist._id,
    status: { $in: ACTIVE_STATUSES },
    start: { $lt: newEnd },
    end: { $gt: newStart },
  });
  if (overlap) {
    return res.status(409).json({ message: "Ese hueco ya está ocupado" });
  }

  appointment.start = newStart;
  appointment.end = newEnd;
  await appointment.save();

  // Misma sala: un solo evento basta para que todos recarguen sus huecos
  emitToStylist(stylist._id, "appointment:updated", {
    stylistId: stylist._id,
    start: appointment.start,
    end: appointment.end,
  });


  res.json(appointment);
}