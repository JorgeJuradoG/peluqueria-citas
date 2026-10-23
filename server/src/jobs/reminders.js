import cron from "node-cron";
import Appointment from "../models/Appointment.js";
import Salon from "../models/Salon.js";
import { sendAppointmentReminder } from "../services/appointmentMails.js";
import { REMINDER_MS } from "../utils/reminders.js";

let running = false;

export async function runReminders() {
  if (running) return; // evita solapar ejecuciones
  running = true;
  try {
    const now = new Date();
    const due = await Appointment.find({
      status: { $in: ["pending", "confirmed"] },
      reminderSentAt: null, // también las que no tienen el campo
      start: { $gt: now, $lte: new Date(now.getTime() + REMINDER_MS) },
    }).select("_id salon");

    const salons = new Map();
    for (const a of due) {
      // "Reclamar" la cita de forma atómica: si hubiera dos servidores, solo uno la envía
      const claimed = await Appointment.findOneAndUpdate(
        { _id: a._id, reminderSentAt: null },
        { $set: { reminderSentAt: new Date() } }
      );
      if (!claimed) continue;

      const key = String(a.salon);
      if (!salons.has(key)) salons.set(key, await Salon.findById(a.salon));
      const salon = salons.get(key);
      if (salon?.active && !salon.demo) await sendAppointmentReminder(a._id, salon);
    }

    if (due.length) console.log(`[reminders] ${due.length} cita(s) procesadas`);
  } catch (err) {
    console.error("[reminders]", err.message);
  } finally {
    running = false;
  }
}

export function startReminders() {
  cron.schedule("*/10 * * * *", runReminders);
  runReminders(); // al arrancar, recupera lo que se pudo quedar pendiente
  console.log("[reminders] Programados cada 10 minutos");
}