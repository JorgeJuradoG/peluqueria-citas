import Appointment from "../models/Appointment.js";
import Stylist from "../models/Stylist.js";
import Service from "../models/Service.js";

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
  res.json(appointment);
}