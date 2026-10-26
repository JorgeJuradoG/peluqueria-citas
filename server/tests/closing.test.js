import { beforeEach, describe, expect, it, vi } from "vitest";
import Appointment from "../src/models/Appointment.js";
import AuthToken from "../src/models/AuthToken.js";
import Salon from "../src/models/Salon.js";
import Service from "../src/models/Service.js";
import Stylist from "../src/models/Stylist.js";
import User from "../src/models/User.js";
import { outbox } from "../src/services/mailer.js";
import { PASSWORD, createSalonFixture, futureSlot, http } from "./helpers.js";

describe("Datos y cierre de la peluquería", () => {
  let A;
  let B;

  const count = (Model, F) => Model.countDocuments({ salon: F.salon._id });

  async function bookIn(F) {
    const res = await http(F.slug, F.tokens.client)
      .post("/api/appointments")
      .send({
        stylistId: String(F.stylist._id),
        serviceId: String(F.service._id),
        start: futureSlot(F.salon),
      });
    expect(res.status).toBe(201);
  }

  const close = (F, token, body) =>
    http(F.slug, token).post("/api/salon-settings/close").send(body);

  beforeEach(async () => {
    outbox.length = 0;
    A = await createSalonFixture("salon-a");
    B = await createSalonFixture("salon-b");
    await bookIn(A);
    await bookIn(B);
    await AuthToken.create({
      salon: A.salon._id,
      user: A.client._id,
      type: "reset",
      tokenHash: "x".repeat(64),
      expiresAt: new Date(Date.now() + 3600 * 1000),
    });
  });

  describe("exportar", () => {
    it("el administrador descarga los datos de SU peluquería", async () => {
      const res = await http(A.slug, A.tokens.admin).get("/api/salon-settings/export");
      expect(res.status).toBe(200);
      expect(res.body.salon.slug).toBe("salon-a");
      expect(res.body.users).toHaveLength(3);
      expect(res.body.services).toHaveLength(1);
      expect(res.body.stylists).toHaveLength(1);
      expect(res.body.appointments).toHaveLength(1);
      expect(res.body.appointments[0].client.email).toBe(A.client.email);
    });

    it("no incluye contraseñas ni enlaces, ni datos de otra peluquería", async () => {
      const res = await http(A.slug, A.tokens.admin).get("/api/salon-settings/export");
      const text = JSON.stringify(res.body);
      expect(text).not.toMatch(/passwordHash|tokenHash|tokenVersion/);
      expect(text).not.toContain("salon-b");
    });

    it("solo el administrador puede", async () => {
      expect((await http(A.slug, A.tokens.client).get("/api/salon-settings/export")).status).toBe(403);
      expect((await http(A.slug, A.tokens.stylist).get("/api/salon-settings/export")).status).toBe(403);
      expect((await http(A.slug).get("/api/salon-settings/export")).status).toBe(401);
    });
  });

  describe("cerrar", () => {
    it("exige la dirección y la contraseña correctas, y no borra nada si fallan", async () => {
      const wrongSlug = await close(A, A.tokens.admin, { slug: "otra", password: PASSWORD });
      expect(wrongSlug.status).toBe(400);

      const wrongPass = await close(A, A.tokens.admin, { slug: "salon-a", password: "Mala12345" });
      expect(wrongPass.status).toBe(400);

      const empty = await close(A, A.tokens.admin, {});
      expect(empty.status).toBe(400);

      expect(await Salon.exists({ _id: A.salon._id })).toBeTruthy();
      expect(await count(User, A)).toBe(3);
      expect(await count(Appointment, A)).toBe(1);
    });

    it("solo el administrador puede cerrar", async () => {
      const body = { slug: "salon-a", password: PASSWORD };
      expect((await close(A, A.tokens.client, body)).status).toBe(403);
      expect((await close(A, A.tokens.stylist, body)).status).toBe(403);
      expect((await close(A, undefined, body)).status).toBe(401);
      expect(await Salon.exists({ _id: A.salon._id })).toBeTruthy();
    });

    it("la peluquería de demostración no se puede cerrar", async () => {
      await Salon.updateOne({ _id: A.salon._id }, { demo: true });
      const res = await close(A, A.tokens.admin, { slug: "salon-a", password: PASSWORD });
      expect(res.status).toBe(403);
      expect(await Salon.exists({ _id: A.salon._id })).toBeTruthy();
    });

    it("borra la peluquería y todo lo suyo, pero no toca a las demás", async () => {
      const res = await close(A, A.tokens.admin, { slug: "salon-a", password: PASSWORD });
      expect(res.status).toBe(200);

      expect(await Salon.exists({ _id: A.salon._id })).toBeNull();
      for (const Model of [User, Service, Stylist, Appointment, AuthToken]) {
        expect(await count(Model, A)).toBe(0);
      }

      expect(await Salon.exists({ _id: B.salon._id })).toBeTruthy();
      expect(await count(User, B)).toBe(3);
      expect(await count(Service, B)).toBe(1);
      expect(await count(Stylist, B)).toBe(1);
      expect(await count(Appointment, B)).toBe(1);
    });

    it("la web deja de existir y las sesiones dejan de servir", async () => {
      await close(A, A.tokens.admin, { slug: "salon-a", password: PASSWORD });

      expect((await http(null).get("/api/salons/salon-a")).status).toBe(404);
      expect((await http("salon-a", A.tokens.admin).get("/api/auth/me")).status).toBe(404);
    });

    it("avisa por correo al dueño", async () => {
      await close(A, A.tokens.admin, { slug: "salon-a", password: PASSWORD });
      await vi.waitFor(() => expect(outbox.some((m) => m.to === A.admin.email)).toBe(true));
      expect(outbox.filter((m) => m.to === A.admin.email).at(-1).subject).toMatch(/se ha cerrado/);
    });
  });
});