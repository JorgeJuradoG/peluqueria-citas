import { DateTime } from "luxon";
import { beforeEach, describe, expect, it } from "vitest";
import Appointment from "../src/models/Appointment.js";
import Service from "../src/models/Service.js";
import Stylist from "../src/models/Stylist.js";
import { createSalonFixture, http } from "./helpers.js";

describe("Estadísticas del administrador", () => {
  let A;
  let B;

  beforeEach(async () => {
    A = await createSalonFixture("salon-a");
    B = await createSalonFixture("salon-b");
  });

  const at = (F, offset, hour) =>
    DateTime.now()
      .setZone(F.salon.timezone)
      .plus({ days: offset })
      .set({ hour, minute: 0, second: 0, millisecond: 0 });

  async function appt(F, { offset, hour = 10, status = "completed", service = F.service }) {
    const start = at(F, offset, hour).toJSDate();
    return Appointment.create({
      salon: F.salon._id,
      client: F.client._id,
      stylist: F.stylist._id,
      service: service._id,
      start,
      end: new Date(start.getTime() + service.durationMinutes * 60000),
      status,
      reminderSentAt: new Date(),
    });
  }

  // Corte = 15 € / 30 min. Tinte = 35 € / 60 min
  async function seedA() {
    const tinte = await Service.create({
      salon: A.salon._id,
      name: "Tinte",
      durationMinutes: 60,
      price: 35,
    });
    await appt(A, { offset: -1, hour: 10 });
    await appt(A, { offset: -2, hour: 11 });
    await appt(A, { offset: -2, hour: 15, service: tinte });
    await appt(A, { offset: -3, hour: 10, status: "cancelled" });
    await appt(A, { offset: 2, hour: 10, status: "confirmed" });
    await appt(A, { offset: -10, hour: 10 }); // cae en el periodo anterior
  }

  const stats = (F, token, period) =>
    http(F.slug, token).get("/api/stats").query(period ? { period } : {});

  it("solo el administrador puede verlas", async () => {
    expect((await stats(A, A.tokens.client)).status).toBe(403);
    expect((await stats(A, A.tokens.stylist)).status).toBe(403);
    expect((await stats(A, undefined)).status).toBe(401);
    expect((await stats(A, A.tokens.admin)).status).toBe(200);
  });

  it("rechaza un periodo que no existe y usa 7 días por defecto", async () => {
    expect((await stats(A, A.tokens.admin, "1d")).status).toBe(400);
    expect((await stats(A, A.tokens.admin, "constructor")).status).toBe(400);

    const res = await stats(A, A.tokens.admin);
    expect(res.body.period).toBe("7d");
    expect(res.body.days).toHaveLength(7);
  });

  it("cuenta citas, ingresos, clientes y cancelaciones, y compara con el periodo anterior", async () => {
    await seedA();
    const res = await stats(A, A.tokens.admin, "7d");

    expect(res.body.current).toEqual({
      total: 4,
      cancelled: 1,
      completed: 3,
      upcoming: 0,
      revenue: 65, // 15 + 15 + 35
      expected: 0,
      clients: 1,
    });
    expect(res.body.previous).toMatchObject({ total: 1, completed: 1, revenue: 15 });
    // La cita confirmada de dentro de 2 días cae fuera del periodo, pero dentro de los próximos 7 días
    expect(res.body.next7).toEqual({ count: 1, revenue: 15 });
  });

  it("reparte las citas por día, sin contar las canceladas", async () => {
    await seedA();
    const res = await stats(A, A.tokens.admin, "7d");

    const byDate = Object.fromEntries(res.body.days.map((d) => [d.date, d]));
    expect(res.body.days.at(-1).date).toBe(at(A, 0, 0).toISODate());
    expect(byDate[at(A, -1, 0).toISODate()]).toMatchObject({ completed: 1, upcoming: 0 });
    expect(byDate[at(A, -2, 0).toISODate()]).toMatchObject({ completed: 2, upcoming: 0 });
    expect(byDate[at(A, -3, 0).toISODate()]).toMatchObject({ completed: 0, upcoming: 0 });
  });

  it("ordena los servicios más pedidos", async () => {
    await seedA();
    const res = await stats(A, A.tokens.admin, "7d");

    expect(res.body.services.map((s) => [s.name, s.count, s.revenue])).toEqual([
      ["Corte salon-a", 2, 30],
      ["Tinte", 1, 35],
    ]);
  });

  it("calcula la ocupación con las horas reservadas y las horas de trabajo", async () => {
    await seedA();
    const res = await stats(A, A.tokens.admin, "7d");

    // 7 días × 11 h (09:00-20:00) = 4620 min. Reservados: 30 + 30 + 60 = 120 min
    expect(res.body.stylists).toHaveLength(1);
    expect(res.body.stylists[0]).toMatchObject({
      count: 3,
      minutes: 120,
      available: 4620,
      occupancy: 3,
    });
  });

  it("los días libres restan horas de trabajo", async () => {
    await seedA();
    await Stylist.updateOne(
      { _id: A.stylist._id },
      { daysOff: [new Date(`${at(A, -4, 0).toISODate()}T00:00:00Z`)] }
    );

    const res = await stats(A, A.tokens.admin, "7d");
    expect(res.body.stylists[0].available).toBe(4620 - 660);
  });

  it("un periodo de 30 días incluye las citas más antiguas", async () => {
    await seedA();
    const res = await stats(A, A.tokens.admin, "30d");

    expect(res.body.days).toHaveLength(30);
    expect(res.body.current).toMatchObject({ total: 5, completed: 4, revenue: 80 });
    expect(res.body.previous.total).toBe(0);
  });

  it("una peluquería no ve las estadísticas de otra", async () => {
    await seedA();

    const res = await stats(B, B.tokens.admin, "30d");
    expect(res.status).toBe(200);
    expect(res.body.current.total).toBe(0);
    expect(res.body.services).toEqual([]);
    expect(res.body.next7).toEqual({ count: 0, revenue: 0 });
    expect(res.body.stylists.map((s) => s.id)).toEqual([String(B.stylist._id)]);

    // Y la sesión de una no sirve en la otra
    expect((await stats(B, A.tokens.admin)).status).toBe(403);
  });
});