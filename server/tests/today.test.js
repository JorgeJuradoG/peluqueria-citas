import { DateTime } from "luxon";
import { beforeEach, describe, expect, it } from "vitest";
import Appointment from "../src/models/Appointment.js";
import Stylist from "../src/models/Stylist.js";
import { createSalonFixture, createUser, http, loginAs } from "./helpers.js";

describe("Panel «Hoy» del equipo", () => {
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

  async function appt(F, { offset = 0, hour, status = "confirmed", stylist = F.stylist }) {
    const start = at(F, offset, hour).toJSDate();
    return Appointment.create({
      salon: F.salon._id,
      client: F.client._id,
      stylist: stylist._id,
      service: F.service._id,
      start,
      end: new Date(start.getTime() + 30 * 60000),
      status,
      reminderSentAt: new Date(),
    });
  }

  const today = (F, token) => http(F.slug, token).get("/api/appointments/today");

  it("solo lo ve el equipo", async () => {
    expect((await today(A, A.tokens.client)).status).toBe(403);
    expect((await today(A, undefined)).status).toBe(401);
    expect((await today(A, A.tokens.admin)).status).toBe(200);
    expect((await today(A, A.tokens.stylist)).status).toBe(200);
  });

  it("resume las citas de hoy, sin las canceladas ni las de otros días", async () => {
    await appt(A, { hour: 9, status: "completed" });
    await appt(A, { hour: 11 });
    await appt(A, { hour: 12, status: "cancelled" });
    await appt(A, { offset: 1, hour: 10 });
    await appt(A, { offset: -1, hour: 10, status: "completed" });

    const res = await today(A, A.tokens.admin);
    expect(res.body.date).toBe(at(A, 0, 0).toISODate());
    expect(res.body.appointments).toHaveLength(2);
    expect(res.body.summary).toMatchObject({
      total: 2,
      completed: 1,
      pending: 1,
      revenue: 15,
      expected: 15,
    });
  });

  it("devuelve la siguiente cita abierta, aunque sea de otro día", async () => {
    await appt(A, { offset: 2, hour: 10 });
    await appt(A, { offset: 1, hour: 10 });

    const res = await today(A, A.tokens.admin);
    expect(res.body.appointments).toHaveLength(0);
    expect(new Date(res.body.next.start).getTime()).toBe(at(A, 1, 10).toMillis());
  });

  it("el estilista solo ve sus citas; el admin, las de todo el equipo", async () => {
    const otherUser = await createUser({
      salon: A.salon,
      name: "Otro",
      email: "otro@salon-a.test",
      role: "stylist",
    });
    const other = await Stylist.create({
      salon: A.salon._id,
      user: otherUser._id,
      services: [A.service._id],
      workingHours: [{ dayOfWeek: 1, start: "09:00", end: "20:00" }],
    });

    await appt(A, { hour: 10 });
    await appt(A, { hour: 11, stylist: other });

    const mine = await today(A, A.tokens.stylist);
    expect(mine.body.appointments).toHaveLength(1);
    expect(String(mine.body.stylistId)).toBe(String(A.stylist._id));

    const otherToken = await loginAs(A.slug, otherUser.email);
    expect((await today(A, otherToken)).body.appointments).toHaveLength(1);

    const all = await today(A, A.tokens.admin);
    expect(all.body.appointments).toHaveLength(2);
    expect(all.body.stylistId).toBeNull();
  });

  it("un usuario del equipo sin perfil de estilista recibe 404", async () => {
    await Stylist.deleteOne({ _id: A.stylist._id });
    expect((await today(A, A.tokens.stylist)).status).toBe(404);
  });

  it("una peluquería no ve las citas de otra", async () => {
    await appt(A, { hour: 10 });

    const res = await today(B, B.tokens.admin);
    expect(res.body.appointments).toHaveLength(0);
    expect(res.body.next).toBeNull();
    expect((await today(B, A.tokens.admin)).status).toBe(403);
  });
});