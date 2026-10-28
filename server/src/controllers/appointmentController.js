import Appointment from "../models/Appointment.js";
import Stylist from "../models/Stylist.js";
import Service from "../models/Service.js";
import { fitsInWorkingHours } from "../utils/availability.js";
import { emitToStylist } from "../sockets/index.js";
import {
  sendAppointmentConfirmation,
  sendAppointmentCancelled,
  sendAppointmentRescheduled,
} from "../services/appointmentMails.js";
import { DateTime } from "luxon";
import { initialReminderSentAt } from "../utils/reminders.js";
import { canClientChange, cancellationMessage } from "../utils/cancellation.js";

const ACTIVE_STATUSES = ["pending", "confirmed"];

// Segunda comprobación, ya guardada la cita. Dos reservas que se solapan en parte y llegan a
// la vez pueden pasar las dos la primera comprobación; al volver a mirar, al menos una ve a la
// otra y se retira. En el peor caso se rechazan las dos, pero nunca quedan dos citas solapadas
function findConflict(appointment) {
  return Appointment.exists({
    _id: { $ne: appointment._id },
    salon: appointment.salon,
    stylist: appointment.stylist,
    status: { $in: ACTIVE_STATUSES },
    start: { $lt: appointment.end },
    end: { $gt: appointment.start },
  });
}

export async function createAppointment(req, res) {
  const salon = req.salon._id;
  const { stylistId, serviceId, start, notes } = req.body;

  const startDate = new Date(start);
  if (isNaN(startDate.getTime())) {
    return res.status(400).json({ message: "Fecha de inicio inválida" });
  }
  if (startDate <= new Date()) {
    return res.status(400).json({ message: "La cita debe ser en el futuro" });
  }

  const [stylist, service] = await Promise.all([
    Stylist.findOne({ _id: stylistId, salon }),
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

  const endDate = new Date(startDate.getTime() + service.durationMinutes * 60000);

  if (!fitsInWorkingHours(stylist, startDate, endDate, req.salon.timezone)) {
    return res
      .status(400)
      .json({ message: "Ese horario está fuera del horario del estilista" });
  }

  const overlap = await Appointment.findOne({
    salon,
    stylist: stylist._id,
    status: { $in: ACTIVE_STATUSES },
    start: { $lt: endDate },
    end: { $gt: startDate },
  });
  if (overlap) {
    return res.status(409).json({ message: "Ese hueco ya está ocupado" });
  }

  const appointment = await Appointment.create({
    salon,
    client: req.user.id,
    stylist: stylist._id,
    service: service._id,
    start: startDate,
    end: endDate,
    notes,
    // Si la cita ya cae dentro de la ventana, la confirmación hace de recordatorio
    reminderSentAt: initialReminderSentAt(startDate),
  });

  if (await findConflict(appointment)) {
    await Appointment.deleteOne({ _id: appointment._id });
    return res.status(409).json({ message: "Ese hueco ya está ocupado" });
  }

  emitToStylist(stylist._id, "appointment:created", {
    stylistId: stylist._id,
    start: appointment.start,
    end: appointment.end,
  });

  // Sin await: el cliente no espera al correo
  sendAppointmentConfirmation(appointment._id, req.salon);

  res.status(201).json(appointment);
}

export async function getMyAppointments(req, res) {
  const appointments = await Appointment.find({
    salon: req.salon._id,
    client: req.user.id,
  })
    .sort({ start: 1 })
    .populate("service", "name durationMinutes price")
    .populate({ path: "stylist", populate: { path: "user", select: "name" } });
  res.json(appointments);
}

export async function cancelAppointment(req, res) {
  const appointment = await Appointment.findOne({
    _id: req.params.id,
    salon: req.salon._id,
  });
  if (!appointment) {
    return res.status(404).json({ message: "Cita no encontrada" });
  }
  const isOwner = appointment.client.equals(req.user.id);
  if (!isOwner && req.user.role !== "admin") {
    return res.status(403).json({ message: "No puedes cancelar esta cita" });
  }
  if (!ACTIVE_STATUSES.includes(appointment.status)) {
    return res.status(409).json({ message: "Esta cita ya está cerrada" });
  }
  if (req.user.role === "client" && appointment.start <= new Date()) {
    return res.status(400).json({ message: "No se puede cancelar una cita pasada" });
  }

  // Los clientes respetan la antelación mínima; el personal puede cancelar siempre
  if (req.user.role === "client" && !canClientChange(appointment.start, req.salon.cancellationHours)) {
    return res
      .status(403)
      .json({ message: cancellationMessage(req.salon.cancellationHours, req.salon.phone) });
  }

  appointment.status = "cancelled";
  await appointment.save();

  emitToStylist(appointment.stylist, "appointment:cancelled", {
    stylistId: appointment.stylist,
    start: appointment.start,
    end: appointment.end,
  });

  sendAppointmentCancelled(appointment._id, req.salon, { byClient: isOwner });

  res.json(appointment);
}

export async function getAgenda(req, res) {
  const salon = req.salon._id;
  const TZ = req.salon.timezone;
  let rangeStart;
  let rangeEnd;

  if (req.query.from && req.query.to) {
    // Rango (vista semanal). Las fechas son días en la zona de la peluquería, no en UTC
    rangeStart = DateTime.fromISO(String(req.query.from), { zone: TZ }).toJSDate();
    rangeEnd = DateTime.fromISO(String(req.query.to), { zone: TZ }).toJSDate();
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

  let stylist;
  if (req.user.role === "admin") {
    if (!req.query.stylistId) {
      return res.status(400).json({ message: "Falta stylistId" });
    }
    stylist = await Stylist.findOne({ _id: req.query.stylistId, salon });
    if (!stylist) {
      return res.status(404).json({ message: "Estilista no encontrado" });
    }
  } else {
    stylist = await Stylist.findOne({ user: req.user.id, salon });
    if (!stylist) {
      return res.status(404).json({ message: "No tienes perfil de estilista" });
    }
  }

  const appointments = await Appointment.find({
    salon,
    stylist: stylist._id,
    status: { $in: [...ACTIVE_STATUSES, "completed"] },
    start: { $lt: rangeEnd },
    end: { $gt: rangeStart },
  })
    .sort({ start: 1 })
    .populate("client", "name email")
    .populate("service", "name durationMinutes price");

  res.json({ stylistId: stylist._id, appointments });
}

export async function updateAppointmentStatus(req, res) {
  const salon = req.salon._id;
  const { status } = req.body;
  if (!["completed", "cancelled"].includes(status)) {
    return res.status(400).json({ message: "Estado no permitido" });
  }

  const appointment = await Appointment.findOne({ _id: req.params.id, salon });
  if (!appointment) {
    return res.status(404).json({ message: "Cita no encontrada" });
  }

  // El admin puede con todas; el estilista solo con las suyas
  if (req.user.role !== "admin") {
    const profile = await Stylist.findOne({ user: req.user.id, salon });
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

  if (status === "cancelled") {
    sendAppointmentCancelled(appointment._id, req.salon, { byClient: false });
  }

  res.json(appointment);
}

export async function rescheduleAppointment(req, res) {
  const salon = req.salon._id;
  const appointment = await Appointment.findOne({ _id: req.params.id, salon });
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

  // La antelación se mide sobre la hora ACTUAL de la cita, no sobre la nueva
  if (req.user.role === "client" && !canClientChange(appointment.start, req.salon.cancellationHours)) {
    return res
      .status(403)
      .json({ message: cancellationMessage(req.salon.cancellationHours, req.salon.phone) });
  }

  const newStart = new Date(req.body.start);
  if (isNaN(newStart.getTime()) || newStart <= new Date()) {
    return res.status(400).json({ message: "La nueva fecha debe ser válida y futura" });
  }

  const [stylist, service] = await Promise.all([
    Stylist.findOne({ _id: appointment.stylist, salon }),
    Service.findOne({ _id: appointment.service, salon }),
  ]);
  if (!stylist || !stylist.active || !service) {
    return res.status(404).json({ message: "Estilista o servicio no disponible" });
  }

  const newEnd = new Date(newStart.getTime() + service.durationMinutes * 60000);

  if (!fitsInWorkingHours(stylist, newStart, newEnd, req.salon.timezone)) {
    return res
      .status(400)
      .json({ message: "Ese horario está fuera del horario del estilista" });
  }

  const overlap = await Appointment.findOne({
    _id: { $ne: appointment._id }, // ignora la propia cita
    salon,
    stylist: stylist._id,
    status: { $in: ACTIVE_STATUSES },
    start: { $lt: newEnd },
    end: { $gt: newStart },
  });
  if (overlap) {
    return res.status(409).json({ message: "Ese hueco ya está ocupado" });
  }

  const previous = {
    start: appointment.start,
    end: appointment.end,
    reminderSentAt: appointment.reminderSentAt,
  };
  const oldStart = previous.start;
  appointment.start = newStart;
  appointment.end = newEnd;
  // Nueva hora, nuevo recordatorio (salvo que ya caiga dentro de la ventana)
  appointment.reminderSentAt = initialReminderSentAt(newStart);
  await appointment.save();

  if (await findConflict(appointment)) {
    appointment.set(previous); // vuelve a la hora que tenía
    await appointment.save();
    return res.status(409).json({ message: "Ese hueco ya está ocupado" });
  }

  emitToStylist(stylist._id, "appointment:updated", {
    stylistId: stylist._id,
    start: appointment.start,
    end: appointment.end,
  });

  sendAppointmentRescheduled(appointment._id, req.salon, oldStart, { byClient: isOwner });

  res.json(appointment);
}

// Staff: citas de hoy (todo el equipo si es admin, solo las suyas si es estilista)
// y la siguiente cita abierta (puede ser de otro día o estar en curso)
export async function getToday(req, res) {
  const salon = req.salon._id;
  const tz = req.salon.timezone;

  const filter = { salon };
  let stylistId = null;
  if (req.user.role !== "admin") {
    const profile = await Stylist.findOne({ user: req.user.id, salon });
    if (!profile) {
      return res.status(404).json({ message: "No tienes perfil de estilista" });
    }
    filter.stylist = profile._id;
    stylistId = profile._id;
  }

  const dayStart = DateTime.now().setZone(tz).startOf("day");
  const dayEnd = dayStart.plus({ days: 1 });

  const populate = [
    { path: "client", select: "name email phone" },
    { path: "service", select: "name durationMinutes price" },
    { path: "stylist", select: "user", populate: { path: "user", select: "name" } },
  ];

  const [appointments, next] = await Promise.all([
    Appointment.find({
      ...filter,
      status: { $in: [...ACTIVE_STATUSES, "completed"] },
      start: { $gte: dayStart.toJSDate(), $lt: dayEnd.toJSDate() },
    })
      .sort({ start: 1 })
      .populate(populate),
    Appointment.findOne({
      ...filter,
      status: { $in: ACTIVE_STATUSES },
      end: { $gt: new Date() },
    })
      .sort({ start: 1 })
      .populate(populate),
  ]);

  const total = (list) =>
    Math.round(list.reduce((t, a) => t + (a.service?.price ?? 0), 0) * 100) / 100;
  const done = appointments.filter((a) => a.status === "completed");
  const open = appointments.filter((a) => ACTIVE_STATUSES.includes(a.status));

  res.json({
    date: dayStart.toISODate(),
    stylistId,
    appointments,
    next,
    summary: {
      total: appointments.length,
      completed: done.length,
      pending: open.length,
      revenue: total(done),
      expected: total(open),
    },
  });
}