import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { DateTime } from "luxon";
import Salon from "../models/Salon.js";
import User from "../models/User.js";
import Service from "../models/Service.js";
import Stylist from "../models/Stylist.js";
import Appointment from "../models/Appointment.js";

const DEMO_PASSWORD = "Demo1234";

const week = (days, start, end) => days.map((dayOfWeek) => ({ dayOfWeek, start, end }));

const SALONS = [
  {
    name: "Peluquería Demo",
    slug: "peluqueria-demo",
    timezone: "Europe/Madrid",
    heroTitle: "Tu mejor versión empieza aquí",
    tagline: "Cortes con carácter en el centro de la ciudad",
    about:
      "Somos un equipo de profesionales con más de 15 años de experiencia. Cuidamos cada detalle para que salgas como nuevo.",
    hours: "Lunes a viernes: 9:00-20:00\nSábados: 10:00-14:00",
    address: "Calle Mayor 12, Madrid",
    phone: "+34 600 123 456",
    social: { instagram: "peluqueria_demo", whatsapp: "34600123456", website: "https://example.com" },
    sections: { howItWorks: true, perks: true },
    branding: {
      accent: "#b08d57",
      font: "classic",
      radius: "soft",
      icon: "scissors",
      hero: "dark",
      decor: "glow",
      cards: "shadow",
    },
    admin: { name: "Admin", email: process.env.ADMIN_EMAIL || "admin@demo.com" },
    services: [
      { name: "Corte de pelo", durationMinutes: 30, price: 15 },
      { name: "Arreglo de barba", durationMinutes: 20, price: 10 },
      { name: "Tinte", durationMinutes: 60, price: 35 },
    ],
    stylists: [
      {
        name: "Marta",
        email: "marta@demo.com",
        bio: "Especialista en cortes y color",
        services: [0, 2],
        workingHours: [
          ...week([1, 2, 3, 4, 5], "09:00", "14:00"),
          ...week([1, 2, 3, 4, 5], "16:00", "20:00"),
        ],
      },
      {
        name: "Luis",
        email: "luis@demo.com",
        bio: "Barbería clásica",
        services: [0, 1],
        workingHours: [
          ...week([2, 3, 4, 5, 6], "10:00", "14:00"),
          ...week([2, 3, 4, 5], "16:00", "20:00"),
        ],
      },
    ],
    clients: [
      { name: "Ana", email: "ana@demo.com" },
      { name: "Carlos", email: "carlos@demo.com" },
    ],
  },
  {
    name: "Barbería Atlántico",
    slug: "barberia-atlantico",
    timezone: "Atlantic/Canary",
    heroTitle: "Barba, corte y buena conversación",
    tagline: "Barbería de toda la vida, con vistas al Atlántico",
    about:
      "Una barbería de las de siempre, a pie de playa. Navaja, toalla caliente y cita sin esperas.",
    hours: "Martes a sábado: 10:00-19:00",
    address: "Paseo de la Playa 5, Las Palmas",
    phone: "+34 928 000 111",
    social: { instagram: "barberia_atlantico", whatsapp: "34928000111", website: "" },
    sections: { howItWorks: false, perks: true },
    branding: {
      accent: "#d0735a",
      font: "bold",
      radius: "sharp",
      icon: "star",
      hero: "dark",
      decor: "none",
      cards: "flat",
    },
    admin: { name: "Admin Atlántico", email: "admin@atlantico.com" },
    services: [
      { name: "Corte clásico", durationMinutes: 30, price: 14 },
      { name: "Afeitado con toalla caliente", durationMinutes: 30, price: 18 },
    ],
    stylists: [
      {
        name: "Pedro",
        email: "pedro@atlantico.com",
        bio: "Maestro barbero",
        services: [0, 1],
        workingHours: [
          ...week([1, 2, 3, 4, 5], "10:00", "14:00"),
          ...week([1, 2, 3, 4, 5], "16:00", "19:00"),
        ],
      },
    ],
    clients: [{ name: "Sara", email: "sara@atlantico.com" }],
  },
];

// n-ésimo día futuro (n >= 1) en que el estilista trabaja
function nthWorkingDay(tz, workingHours, n) {
  const days = new Set(workingHours.map((h) => h.dayOfWeek));
  let d = DateTime.now().setZone(tz).startOf("day");
  let count = 0;
  while (count < n) {
    d = d.plus({ days: 1 });
    if (days.has(d.weekday % 7)) count++;
  }
  return d;
}

async function seedSalon(def, passwordHash) {
  const salon = await Salon.create({
    name: def.name,
    slug: def.slug,
    timezone: def.timezone,
    tagline: def.tagline,
    heroTitle: def.heroTitle,
    about: def.about,
    hours: def.hours,
    address: def.address,
    phone: def.phone,
    social: def.social,
    sections: def.sections,
    branding: def.branding,
  });
  const base = { salon: salon._id };

  // El admin de la peluquería demo usa tu ADMIN_PASSWORD si existe
  const adminHash =
    def.slug === "peluqueria-demo" && process.env.ADMIN_PASSWORD
      ? await bcrypt.hash(process.env.ADMIN_PASSWORD, 10)
      : passwordHash;
  await User.create({ ...base, ...def.admin, passwordHash: adminHash, role: "admin" });

  const services = await Service.create(def.services.map((s) => ({ ...base, ...s })));

  const clients = await User.create(
    def.clients.map((c) => ({ ...base, ...c, passwordHash, role: "client" }))
  );

  const stylists = [];
  for (const s of def.stylists) {
    const user = await User.create({
      ...base,
      name: s.name,
      email: s.email,
      passwordHash,
      role: "stylist",
    });
    const stylist = await Stylist.create({
      ...base,
      user: user._id,
      bio: s.bio,
      services: s.services.map((i) => services[i]._id),
      workingHours: s.workingHours,
    });
    stylists.push({ doc: stylist, def: s });
  }

  // Citas de ejemplo por estilista, en días en que trabaja
  const slots = [
    { n: 1, hour: 10, minute: 0 },
    { n: 1, hour: 11, minute: 0 },
    { n: 2, hour: 17, minute: 0 },
  ];
  const appointments = [];
  stylists.forEach(({ doc, def: s }, i) => {
    slots.forEach((slot, j) => {
      const day = nthWorkingDay(def.timezone, s.workingHours, slot.n);
      const start = day.set({ hour: slot.hour, minute: slot.minute }).toJSDate();
      const service = services[s.services[j % s.services.length]];
      appointments.push({
        ...base,
        client: clients[(i + j) % clients.length]._id,
        stylist: doc._id,
        service: service._id,
        start,
        end: new Date(start.getTime() + service.durationMinutes * 60000),
        status: "confirmed",
      });
    });
  });
  await Appointment.create(appointments);

  console.log(`\n${def.name}  →  /s/${def.slug}`);
  console.log(`  admin:      ${def.admin.email}`);
  console.log(`  estilistas: ${def.stylists.map((s) => s.email).join(", ")}`);
  console.log(`  clientes:   ${def.clients.map((c) => c.email).join(", ")}`);
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  await Promise.all([
    Salon.deleteMany({}),
    User.deleteMany({}),
    Service.deleteMany({}),
    Stylist.deleteMany({}),
    Appointment.deleteMany({}),
  ]);

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  for (const def of SALONS) await seedSalon(def, passwordHash);

  console.log(`\nContraseña de todas las cuentas: ${DEMO_PASSWORD}`);
  console.log("(el admin de peluqueria-demo usa tu ADMIN_PASSWORD si está definida)");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});