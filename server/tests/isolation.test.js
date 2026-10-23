import { beforeEach, describe, expect, it } from "vitest";
import Appointment from "../src/models/Appointment.js";
import Service from "../src/models/Service.js";
import Stylist from "../src/models/Stylist.js";
import User from "../src/models/User.js";
import { createSalonFixture, futureDate, futureSlot, http } from "./helpers.js";

describe("Aislamiento entre peluquerías", () => {
  let A;
  let B;

  beforeEach(async () => {
    A = await createSalonFixture("salon-a");
    B = await createSalonFixture("salon-b");
  });

  async function bookInA() {
    const res = await http(A.slug, A.tokens.client)
      .post("/api/appointments")
      .send({
        stylistId: String(A.stylist._id),
        serviceId: String(A.service._id),
        start: futureSlot(A.salon),
      });
    expect(res.status).toBe(201);
    return res.body;
  }

  it("rechaza peticiones sin peluquería o con una que no existe", async () => {
    expect((await http(null).get("/api/services")).status).toBe(400);
    expect((await http("no-existe").get("/api/services")).status).toBe(404);
  });

  it("cada peluquería solo ve sus propios servicios y estilistas", async () => {
    const services = await http(B.slug).get("/api/services");
    expect(services.status).toBe(200);
    expect(services.body.map((s) => s._id)).toEqual([String(B.service._id)]);

    const stylists = await http(B.slug).get("/api/stylists");
    expect(stylists.status).toBe(200);
    expect(stylists.body.map((s) => s._id)).toEqual([String(B.stylist._id)]);
  });

  it("una cuenta de A no funciona en B", async () => {
    const res = await http(B.slug, A.tokens.admin).get("/api/appointments/me");
    expect(res.status).toBe(403);
  });

  it("el mismo email puede registrarse en dos peluquerías, pero no dos veces en la misma", async () => {
    const body = { name: "Laura", email: "laura@test.com", password: "Password1" };

    expect((await http(A.slug).post("/api/auth/register").send(body)).status).toBe(201);
    expect((await http(B.slug).post("/api/auth/register").send(body)).status).toBe(201);
    expect((await http(A.slug).post("/api/auth/register").send(body)).status).toBe(409);
  });

  describe("servicios", () => {
    it("el admin de B no puede ver, editar ni desactivar un servicio de A", async () => {
      const url = `/api/services/${A.service._id}`;

      expect((await http(B.slug).get(url)).status).toBe(404);
      expect((await http(B.slug, B.tokens.admin).put(url).send({ price: 1 })).status).toBe(404);
      expect((await http(B.slug, B.tokens.admin).delete(url)).status).toBe(404);

      const unchanged = await Service.findById(A.service._id);
      expect(unchanged.price).toBe(15);
      expect(unchanged.active).toBe(true);
    });

    it("no se puede crear un servicio en otra peluquería indicando su id", async () => {
      const res = await http(B.slug, B.tokens.admin)
        .post("/api/services")
        .send({ name: "Intruso", durationMinutes: 30, price: 10, salon: String(A.salon._id) });

      expect(res.status).toBe(201);
      expect(String(res.body.salon)).toBe(String(B.salon._id));
      expect(await Service.countDocuments({ salon: A.salon._id, name: "Intruso" })).toBe(0);
    });
  });

  describe("estilistas", () => {
    it("el admin de B no puede acceder a un estilista de A", async () => {
      const id = A.stylist._id;

      expect((await http(B.slug).get(`/api/stylists/${id}`)).status).toBe(404);

      const availability = await http(B.slug)
        .get(`/api/stylists/${id}/availability`)
        .query({ date: futureDate(B.salon), serviceId: String(B.service._id) });
      expect(availability.status).toBe(404);

      const update = await http(B.slug, B.tokens.admin)
        .put(`/api/stylists/${id}`)
        .send({ active: false });
      expect(update.status).toBe(404);
      expect((await Stylist.findById(id)).active).toBe(true);
    });

    it("no se pueden asignar servicios de A a un estilista de B", async () => {
      const res = await http(B.slug, B.tokens.admin)
        .put(`/api/stylists/${B.stylist._id}`)
        .send({ services: [String(A.service._id)] });
      expect(res.status).toBe(400);
    });

    it("el admin de B no puede convertir en estilista a un usuario de A", async () => {
      const res = await http(B.slug, B.tokens.admin)
        .post("/api/stylists")
        .send({ userId: String(A.client._id), services: [] });

      expect(res.status).toBe(404);
      expect((await User.findById(A.client._id)).role).toBe("client");
    });
  });

  describe("citas", () => {
    it("no se puede reservar con el estilista o el servicio de otra peluquería", async () => {
      const start = futureSlot(B.salon);

      const withStylistA = await http(B.slug, B.tokens.client)
        .post("/api/appointments")
        .send({ stylistId: String(A.stylist._id), serviceId: String(B.service._id), start });
      expect(withStylistA.status).toBe(404);

      const withServiceA = await http(B.slug, B.tokens.client)
        .post("/api/appointments")
        .send({ stylistId: String(B.stylist._id), serviceId: String(A.service._id), start });
      expect(withServiceA.status).toBe(404);

      expect(await Appointment.countDocuments()).toBe(0);
    });

    it("nadie de B puede cancelar, mover ni cerrar una cita de A", async () => {
      const { _id } = await bookInA();

      for (const token of [B.tokens.client, B.tokens.stylist, B.tokens.admin]) {
        const cancel = await http(B.slug, token).patch(`/api/appointments/${_id}/cancel`);
        expect(cancel.status).toBe(404);

        const move = await http(B.slug, token)
          .patch(`/api/appointments/${_id}/reschedule`)
          .send({ start: futureSlot(B.salon, 4) });
        expect(move.status).toBe(404);
      }

      const close = await http(B.slug, B.tokens.admin)
        .patch(`/api/appointments/${_id}/status`)
        .send({ status: "completed" });
      expect(close.status).toBe(404);

      expect((await Appointment.findById(_id)).status).toBe("confirmed");
    });

    it("el admin de B no puede ver la agenda de un estilista de A", async () => {
      await bookInA();

      const res = await http(B.slug, B.tokens.admin)
        .get("/api/appointments/agenda")
        .query({ date: futureDate(B.salon), stylistId: String(A.stylist._id) });

      expect(res.status).toBe(404);
    });
  });
});