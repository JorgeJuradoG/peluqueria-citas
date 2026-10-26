import "dotenv/config";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { DateTime } from "luxon";
import Salon from "../models/Salon.js";
import User from "../models/User.js";
import Service from "../models/Service.js";
import Stylist from "../models/Stylist.js";
import Appointment from "../models/Appointment.js";

const SLUG = "demo";
const TZ = "Europe/Madrid";

const PROFILE = {
  name: "Salón Demo",
  slug: SLUG,
  timezone: TZ,
  active: true,
  demo: true,
  heroTitle: "Tu mejor versión empieza aquí",
  tagline: "Cortes, color y barbería en el centro de la ciudad",
  about:
    "Somos un equipo de profesionales con más de 15 años de experiencia. Cuidamos cada detalle para que salgas como nuevo.",
  hours: "Lunes a viernes: 9:00-20:00\nSábados: 10:00-14:00",
  address: "Calle Mayor 12, Madrid",
  phone: "+34 600 123 456",
  social: { instagram: "salon_demo", whatsapp: "34600123456", website: "" },
  sections: { howItWorks: true, perks: true },
  staffTerm: "profesional",
  branding: {
    accent: "#5b8fd1",
    font: "modern",
    radius: "round",
    icon: "sparkles",
    hero: "light",
    decor: "dots",
    cards: "outline",
  },
};

const SERVICES = [
  { name: "Corte de pelo", durationMinutes: 30, price: 15 },
  { name: "Tinte", durationMinutes: 60, price: 35 },
  { name: "Arreglo de barba", durationMinutes: 20, price: 10 },
  { name: "Peinado", durationMinutes: 40, price: 22 },
  { name: "Corte y barba", durationMinutes: 45, price: 24 },
];

const hoursFor = (days) =>
  days.flatMap((dayOfWeek) => [
    { dayOfWeek, start: "09:00", end: "14:00" },
    { dayOfWeek, start: "16:00", end: "20:00" },
  ]);

const STYLISTS = [
  { name: "Marta", bio: "Especialista en cortes y color", days: [1, 2, 3, 4, 5], services: [0, 1, 3] },
  { name: "Luis", bio: "Barbería clásica", days: [2, 3, 4, 5, 6], services: [0, 2, 4] },
  { name: "Elena", bio: "Color y peinados", days: [1, 2, 3, 4], services: [1, 3] },
];

const CLIENTS = ["Ana", "Carlos", "Sofía", "Pablo"];

// Con servicios de hasta 60 min, estas horas nunca se solapan entre sí
const SLOTS = [[10, 0], [11, 30], [17, 0], [18, 30]];

const email = (name) => `${name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}@demo.example`;

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  let salon = await Salon.findOne({ slug: SLUG });
  if (salon && !salon.demo) {
    throw new Error(`Ya existe una peluquería real con la dirección "${SLUG}". No se toca.`);
  }
  if (salon) {
    salon.set(PROFILE);
    await salon.save();
  } else {
    salon = await Salon.create(PROFILE);
  }

  // Solo se borra lo de esta peluquería
  const base = { salon: salon._id };
  await Appointment.deleteMany(base);
  await Stylist.deleteMany(base);
  await Service.deleteMany(base);
  await User.deleteMany(base);

  // Contraseña aleatoria que nadie conoce: a la demo se entra por el botón, no con contraseña
  const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10);
  const user = (name, role) => ({ ...base, name, email: email(name), passwordHash, role });

  await User.create(user("Laura", "admin"));
  const stylistUsers = await User.create(STYLISTS.map((s) => user(s.name, "stylist")));
  const clients = await User.create(CLIENTS.map((c) => user(c, "client")));
  const services = await Service.create(SERVICES.map((s) => ({ ...base, ...s })));

  const stylists = [];
  for (const [i, def] of STYLISTS.entries()) {
    const doc = await Stylist.create({
      ...base,
      user: stylistUsers[i]._id,
      bio: def.bio,
      services: def.services.map((k) => services[k]._id),
      workingHours: hoursFor(def.days),
    });
    stylists.push({ doc, def });
  }

  // Citas alrededor de hoy: las pasadas "completadas", las futuras "confirmadas"
  const today = DateTime.now().setZone(TZ).startOf("day");
  const now = new Date();
  const appointments = [];

  for (let offset = -5; offset <= 9; offset++) {
    const day = today.plus({ days: offset });
    const dow = day.weekday % 7;

    stylists.forEach(({ doc, def }, si) => {
      if (!def.days.includes(dow)) return;
      SLOTS.forEach(([hour, minute], i) => {
        if ((i + offset + si + 10) % 3 === 0) return; // deja huecos libres
        const start = day.set({ hour, minute }).toJSDate();
        const service = services[def.services[(i + offset + 10) % def.services.length]];
        appointments.push({
          ...base,
          client: clients[(i + offset + si + 10) % clients.length]._id,
          stylist: doc._id,
          service: service._id,
          start,
          end: new Date(start.getTime() + service.durationMinutes * 60000),
          status: start < now ? "completed" : "confirmed",
          reminderSentAt: new Date(), // nunca se envían recordatorios de la demo
        });
      });
    });
  }
  await Appointment.create(appointments);

  console.log(`Demo lista en /s/${SLUG}`);
  console.log(
    `  ${STYLISTS.length} estilistas, ${CLIENTS.length} clientes, ${SERVICES.length} servicios y ${appointments.length} citas`
  );
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});