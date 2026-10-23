import request from "supertest";
import bcrypt from "bcryptjs";
import { DateTime } from "luxon";
import app from "../src/app.js";
import Salon from "../src/models/Salon.js";
import User from "../src/models/User.js";
import Service from "../src/models/Service.js";
import Stylist from "../src/models/Stylist.js";

export const PASSWORD = "Password1";

let passwordHash;
async function getHash() {
  passwordHash ??= await bcrypt.hash(PASSWORD, 4); // coste bajo: más rápido en tests
  return passwordHash;
}

// Cliente HTTP ya configurado con la peluquería y, opcionalmente, un token
export function http(slug, token) {
  const build = (method) => (url) => {
    let req = request(app)[method](url);
    if (slug) req = req.set("X-Salon", slug);
    if (token) req = req.set("Authorization", `Bearer ${token}`);
    return req;
  };
  return {
    get: build("get"),
    post: build("post"),
    put: build("put"),
    patch: build("patch"),
    delete: build("delete"),
  };
}

export async function loginAs(slug, email, password = PASSWORD) {
  const res = await http(slug).post("/api/auth/login").send({ email, password });
  if (res.status !== 200) {
    throw new Error(`Login fallido (${res.status}): ${JSON.stringify(res.body)}`);
  }
  return res.body.token;
}

export async function createUser({ salon, name, email, role = "client" }) {
  return User.create({
    salon: salon._id,
    name,
    email,
    role,
    passwordHash: await getHash(),
  });
}

const ALL_WEEK = [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
  dayOfWeek,
  start: "09:00",
  end: "20:00",
}));

// Una peluquería completa y lista para usar
export async function createSalonFixture(slug, { timezone = "Europe/Madrid" } = {}) {
  const salon = await Salon.create({ name: `Peluquería ${slug}`, slug, timezone });

  const admin = await createUser({ salon, name: "Admin", email: `admin@${slug}.test`, role: "admin" });
  const stylistUser = await createUser({
    salon,
    name: "Estilista",
    email: `stylist@${slug}.test`,
    role: "stylist",
  });
  const client = await createUser({ salon, name: "Cliente", email: `client@${slug}.test` });

  const service = await Service.create({
    salon: salon._id,
    name: `Corte ${slug}`,
    durationMinutes: 30,
    price: 15,
  });
  const stylist = await Stylist.create({
    salon: salon._id,
    user: stylistUser._id,
    bio: "Estilista de pruebas",
    services: [service._id],
    workingHours: ALL_WEEK,
  });

  return {
    slug,
    salon,
    admin,
    stylistUser,
    client,
    service,
    stylist,
    tokens: {
      admin: await loginAs(slug, admin.email),
      stylist: await loginAs(slug, stylistUser.email),
      client: await loginAs(slug, client.email),
    },
  };
}

// Instante futuro (ISO en UTC) dentro del horario de trabajo: a las 10:00 locales
export function futureSlot(salon, daysAhead = 3, hour = 10, minute = 0) {
  return DateTime.now()
    .setZone(salon.timezone)
    .plus({ days: daysAhead })
    .set({ hour, minute, second: 0, millisecond: 0 })
    .toUTC()
    .toISO();
}

// Fecha futura AAAA-MM-DD en la zona de la peluquería
export function futureDate(salon, daysAhead = 3) {
  return DateTime.now().setZone(salon.timezone).plus({ days: daysAhead }).toISODate();
}