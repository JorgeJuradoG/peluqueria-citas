import jwt from "jsonwebtoken";
import { beforeEach, describe, expect, it } from "vitest";
import Salon from "../src/models/Salon.js";
import Service from "../src/models/Service.js";
import User from "../src/models/User.js";
import { createSalonFixture, futureDate, futureSlot, http, loginAs } from "./helpers.js";

describe("Demo de solo lectura", () => {
  let D; // peluquería de demostración
  let N; // peluquería normal

  beforeEach(async () => {
    D = await createSalonFixture("salon-demo");
    await Salon.updateOne({ _id: D.salon._id }, { demo: true });
    N = await createSalonFixture("salon-normal");
  });

  const demoToken = async (role) => {
    const res = await http(D.slug).post("/api/auth/demo").send({ role });
    expect(res.status).toBe(200);
    return res.body.token;
  };

  it("una peluquería normal no tiene demo", async () => {
    const res = await http(N.slug).post("/api/auth/demo").send({ role: "admin" });
    expect(res.status).toBe(404);
  });

  it.each(["admin", "stylist", "client"])(
    "entra como %s con su cuenta y una sesión de 2 horas",
    async (role) => {
      const res = await http(D.slug).post("/api/auth/demo").send({ role });
      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe(role);

      const payload = jwt.decode(res.body.token);
      expect(payload.exp - payload.iat).toBe(2 * 60 * 60);

      const me = await http(D.slug, res.body.token).get("/api/auth/me");
      expect(me.status).toBe(200);
    }
  );

  it("rechaza un rol que no existe", async () => {
    expect((await http(D.slug).post("/api/auth/demo").send({ role: "superadmin" })).status).toBe(400);
  });

  it("se puede leer todo lo que enseña la demo", async () => {
    const admin = await demoToken("admin");

    expect((await http(D.slug, admin).get("/api/services")).status).toBe(200);
    expect((await http(D.slug, admin).get("/api/stylists/manage/all")).status).toBe(200);

    const agenda = await http(D.slug, admin)
      .get("/api/appointments/agenda")
      .query({ date: futureDate(D.salon), stylistId: String(D.stylist._id) });
    expect(agenda.status).toBe(200);
  });

  it("bloquea cualquier escritura, con o sin sesión", async () => {
    const tokens = { admin: await demoToken("admin"), client: await demoToken("client"), none: undefined };
    const cases = [
      ["admin", "post", "/api/services", { name: "X", durationMinutes: 30, price: 5 }],
      ["admin", "put", `/api/services/${D.service._id}`, { price: 1 }],
      ["admin", "delete", `/api/services/${D.service._id}`],
      ["admin", "post", "/api/stylists", { name: "Lucía", email: "lucia@test.com", services: [] }],
      ["admin", "put", "/api/salon-settings", { name: "Hackeada" }],
      ["admin", "put", "/api/auth/password", { currentPassword: "x", newPassword: "NuevaClave1" }],
      ["client", "put", "/api/auth/me", { name: "Otro" }],
      [
        "client",
        "post",
        "/api/appointments",
        { stylistId: String(D.stylist._id), serviceId: String(D.service._id), start: futureSlot(D.salon) },
      ],
      ["client", "patch", `/api/appointments/${D.stylist._id}/cancel`],
      ["none", "post", "/api/auth/register", { name: "Laura", email: "laura@test.com", password: "Password1" }],
      ["none", "post", "/api/auth/forgot-password", { email: D.client.email }],
    ];

    for (const [who, method, url, body] of cases) {
      const res = await http(D.slug, tokens[who])[method](url).send(body ?? {});
      expect(res.status, `${method} ${url}`).toBe(403);
      expect(res.body.message).toMatch(/demo de solo lectura/);
    }

    expect(await Service.countDocuments({ salon: D.salon._id })).toBe(1);
    expect(await User.countDocuments({ email: "laura@test.com" })).toBe(0);
    expect((await Salon.findById(D.salon._id)).name).toBe(D.salon.name);
  });

  it("iniciar sesión con una cuenta normal sigue funcionando en la demo", async () => {
    await loginAs(D.slug, D.client.email);
  });

  it("una peluquería normal no se ve afectada", async () => {
    const res = await http(N.slug, N.tokens.admin)
      .post("/api/services")
      .send({ name: "Tinte", durationMinutes: 60, price: 35 });
    expect(res.status).toBe(201);
  });

  it("la API publica si es demo, y los ajustes no pueden cambiarlo", async () => {
    expect((await http(null).get(`/api/salons/${D.slug}`)).body.demo).toBe(true);
    expect((await http(null).get(`/api/salons/${N.slug}`)).body.demo).toBe(false);

    const res = await http(N.slug, N.tokens.admin)
      .put("/api/salon-settings")
      .send({ name: "Nuevo nombre", demo: true });
    expect(res.status).toBe(200);
    expect((await Salon.findById(N.salon._id)).demo).toBe(false);
  });

  it("nadie puede registrar la dirección «demo»", async () => {
    const res = await http(null)
      .post("/api/salons")
      .send({
        salonName: "Mi demo",
        slug: "demo",
        timezone: "Europe/Madrid",
        adminName: "Lola",
        email: "lola@test.com",
        password: "Password1",
      });
    expect(res.status).toBe(400);
    expect(await Salon.countDocuments({ slug: "demo" })).toBe(0);
  });

  it("una sesión de la demo no sirve en otra peluquería", async () => {
    const admin = await demoToken("admin");
    expect((await http(N.slug, admin).get("/api/auth/me")).status).toBe(403);
  });
});