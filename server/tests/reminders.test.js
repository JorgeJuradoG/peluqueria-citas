import { beforeEach, describe, expect, it } from "vitest";
import Appointment from "../src/models/Appointment.js";
import { initialReminderSentAt } from "../src/utils/reminders.js";
import { createSalonFixture, futureSlot, http } from "./helpers.js";

describe("Recordatorios", () => {
  let A;

  beforeEach(async () => {
    A = await createSalonFixture("salon-a");
  });

  const hoursAhead = (h) => new Date(Date.now() + h * 3600 * 1000);

  it("solo quedan pendientes las citas que aún no están dentro de la ventana", () => {
    expect(initialReminderSentAt(hoursAhead(2))).toBeInstanceOf(Date);
    expect(initialReminderSentAt(hoursAhead(48))).toBeNull();
  });

  it("una reserva con días de antelación queda pendiente de recordatorio", async () => {
    const res = await http(A.slug, A.tokens.client)
      .post("/api/appointments")
      .send({
        stylistId: String(A.stylist._id),
        serviceId: String(A.service._id),
        start: futureSlot(A.salon, 3, 10),
      });
    expect(res.status).toBe(201);
    expect((await Appointment.findById(res.body._id)).reminderSentAt).toBeNull();
  });

  it("al reprogramar, la cita vuelve a tener recordatorio", async () => {
    const start = hoursAhead(5);
    const appt = await Appointment.create({
      salon: A.salon._id,
      client: A.client._id,
      stylist: A.stylist._id,
      service: A.service._id,
      start,
      end: new Date(start.getTime() + 30 * 60000),
      status: "confirmed",
      reminderSentAt: new Date(), // ya se envió para la hora antigua
    });

    const res = await http(A.slug, A.tokens.client)
      .patch(`/api/appointments/${appt._id}/reschedule`)
      .send({ start: futureSlot(A.salon, 4, 12) });
    expect(res.status).toBe(200);
    expect((await Appointment.findById(appt._id)).reminderSentAt).toBeNull();
  });
});
