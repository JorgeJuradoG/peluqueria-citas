import { DateTime } from "luxon";
import Appointment from "../models/Appointment.js";
import Service from "../models/Service.js";
import Stylist from "../models/Stylist.js";
import { workingRangesFor } from "../utils/availability.js";

const DAYS = { "7d": 7, "30d": 30, "90d": 90 };
const round2 = (n) => Math.round((n ?? 0) * 100) / 100;

const statusIn = (...list) => ({ $in: ["$status", list] });
const isCompleted = { $eq: ["$status", "completed"] };
const isOpen = statusIn("pending", "confirmed");

// Añade el servicio de cada cita (para conocer su nombre y su precio)
const withService = [
  { $lookup: { from: Service.collection.name, localField: "service", foreignField: "_id", as: "svc" } },
  { $unwind: "$svc" },
];

async function summarize(salon, from, to) {
  const [row] = await Appointment.aggregate([
    { $match: { salon, start: { $gte: from, $lt: to } } },
    ...withService,
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        cancelled: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } },
        completed: { $sum: { $cond: [isCompleted, 1, 0] } },
        upcoming: { $sum: { $cond: [isOpen, 1, 0] } },
        revenue: { $sum: { $cond: [isCompleted, "$svc.price", 0] } },
        expected: { $sum: { $cond: [isOpen, "$svc.price", 0] } },
        // Clientes distintos entre las citas no canceladas
        clients: { $addToSet: { $cond: [{ $ne: ["$status", "cancelled"] }, "$client", null] } },
      },
    },
  ]);

  if (!row) {
    return { total: 0, cancelled: 0, completed: 0, upcoming: 0, revenue: 0, expected: 0, clients: 0 };
  }
  return {
    total: row.total,
    cancelled: row.cancelled,
    completed: row.completed,
    upcoming: row.upcoming,
    revenue: round2(row.revenue),
    expected: round2(row.expected),
    clients: row.clients.filter((c) => c !== null).length,
  };
}

// Citas no canceladas por día, agrupadas en la zona horaria de la peluquería
async function perDay(salon, from, to, tz) {
  const rows = await Appointment.aggregate([
    { $match: { salon, start: { $gte: from, $lt: to }, status: { $ne: "cancelled" } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$start", timezone: tz } },
        completed: { $sum: { $cond: [isCompleted, 1, 0] } },
        upcoming: { $sum: { $cond: [{ $ne: ["$status", "completed"] }, 1, 0] } },
      },
    },
  ]);
  return new Map(rows.map((r) => [r._id, r]));
}

async function topServices(salon, from, to) {
  const rows = await Appointment.aggregate([
    { $match: { salon, start: { $gte: from, $lt: to }, status: { $ne: "cancelled" } } },
    ...withService,
    {
      $group: {
        _id: "$service",
        name: { $first: "$svc.name" },
        count: { $sum: 1 },
        revenue: { $sum: { $cond: [isCompleted, "$svc.price", 0] } },
      },
    },
    { $sort: { count: -1, name: 1 } },
    { $limit: 5 },
  ]);
  return rows.map((r) => ({
    id: String(r._id),
    name: r.name,
    count: r.count,
    revenue: round2(r.revenue),
  }));
}

async function perStylist(salon, from, to, tz) {
  const [booked, stylists] = await Promise.all([
    Appointment.aggregate([
      {
        $match: {
          salon,
          start: { $gte: from.toJSDate(), $lt: to.toJSDate() },
          status: { $ne: "cancelled" },
        },
      },
      {
        $group: {
          _id: "$stylist",
          count: { $sum: 1 },
          minutes: { $sum: { $divide: [{ $subtract: ["$end", "$start"] }, 60000] } },
        },
      },
    ]),
    Stylist.find({ salon }).populate("user", "name").lean(),
  ]);
  const byId = new Map(booked.map((b) => [String(b._id), b]));

  const dayList = [];
  for (let d = from; d < to; d = d.plus({ days: 1 })) dayList.push(d);

  return stylists
    .map((s) => {
      const b = byId.get(String(s._id));
      const schedule = { ...s, daysOff: s.daysOff ?? [], workingHours: s.workingHours ?? [] };

      let available = 0;
      for (const day of dayList) {
        for (const r of workingRangesFor(schedule, day)) available += (r.end - r.start) / 60000;
      }
      available = Math.round(available);
      const minutes = Math.round(b?.minutes ?? 0);

      return {
        id: String(s._id),
        name: s.user?.name ?? "—",
        active: s.active,
        count: b?.count ?? 0,
        minutes,
        available,
        // Sin horario en el periodo no hay porcentaje que calcular
        occupancy: available > 0 ? Math.min(100, Math.round((minutes / available) * 100)) : null,
      };
    })
    .filter((s) => s.active || s.count > 0)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

// Citas previstas para los próximos 7 días
async function nextWeek(salon) {
  const now = new Date();
  const [row] = await Appointment.aggregate([
    {
      $match: {
        salon,
        status: { $in: ["pending", "confirmed"] },
        start: { $gt: now, $lt: new Date(now.getTime() + 7 * 24 * 3600 * 1000) },
      },
    },
    ...withService,
    { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: "$svc.price" } } },
  ]);
  return { count: row?.count ?? 0, revenue: round2(row?.revenue) };
}

export async function getStats(req, res) {
  const period = req.query.period === undefined ? "7d" : String(req.query.period);
  // hasOwn: así "constructor" y similares no cuelan como periodo válido
  if (!Object.hasOwn(DAYS, period)) {
    return res.status(400).json({ message: "Periodo no válido" });
  }
  const n = DAYS[period];

  const salon = req.salon._id;
  const tz = req.salon.timezone;

  const today = DateTime.now().setZone(tz).startOf("day");
  const end = today.plus({ days: 1 });
  const start = end.minus({ days: n });
  const prevStart = start.minus({ days: n });

  const [current, previous, byDay, services, stylists, next7] = await Promise.all([
    summarize(salon, start.toJSDate(), end.toJSDate()),
    summarize(salon, prevStart.toJSDate(), start.toJSDate()),
    perDay(salon, start.toJSDate(), end.toJSDate(), tz),
    topServices(salon, start.toJSDate(), end.toJSDate()),
    perStylist(salon, start, end, tz),
    nextWeek(salon),
  ]);

  const days = [];
  for (let d = start; d < end; d = d.plus({ days: 1 })) {
    const date = d.toISODate();
    const row = byDay.get(date);
    days.push({ date, completed: row?.completed ?? 0, upcoming: row?.upcoming ?? 0 });
  }

  res.json({
    period,
    from: start.toISODate(),
    to: today.toISODate(),
    current,
    previous,
    days,
    services,
    stylists,
    next7,
  });
}