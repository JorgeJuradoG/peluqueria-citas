import { beforeEach, describe, expect, it } from "vitest";
import Appointment from "../src/models/Appointment.js";
import Salon from "../src/models/Salon.js";
import { canClientChange } from "../src/utils/cancellation.js";
import { createSalonFixture, futureSlot, http } from "./helpers.js";

describe("Política de cancelación", () => {
  let A;

  beforeEach(async () => {
    A = await createSalonFixture("salon-a");
  });

  const hoursAhead = (h) => new Date(Date.now() + h * 3600 * 1000);

  async function appt(hours) {
    const start = hoursAhead(hours);
    return Appointment.create({
      salon: A.salon._id,
      client: A.client._id,
      stylist: A.stylist._id,
      service: A.service._id,
      start,
      end: new Date(start.getTime() + 30 * 60000),
      status: "confirmed",
      reminderSentAt: new Date(),
    });
  }

  const setPolicy = (hours) =>
    Salon.updateOne({ _id: A.salon._id }, { cancellationHours: hours });

  const cancel = (token, id) =>
    http(A.slug, token).patch(`/api/appointments/${id}/cancel`);

  describe("regla", () => {
    it("0 horas significa sin límite", () => {
      expect(canClientChange(hoursAhead(1), 0)).toBe(true);
      expect(canClientChange(hoursAhead(1), undefined)).toBe(true);
    });

    it("exige la antelación indicada", () => {
      expect(canClientChange(hoursAhead(25), 24)).toBe(true);
      expect(canClientChange(hoursAhead(23), 24)).toBe(false);
    });
  });

  it("por defecto no hay límite: el cliente cancela cuando quiera", async () => {
    const a = await appt(1);
    expect((await cancel(A.tokens.client, a._id)).status).toBe(200);
  });

  it("con 24 h, el cliente no puede cancelar una cita que empieza dentro de 3 h", async () => {
    await setPolicy(24);
    const a = await appt(3);

    const res = await cancel(A.tokens.client, a._id);
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/24 horas/);
    expect((await Appointment.findById(a._id)).status).toBe("confirmed");
  });

  it("con 24 h, sí puede cancelar una cita que empieza dentro de 48 h", async () => {
    await setPolicy(24);
    const a = await appt(48);
    expect((await cancel(A.tokens.client, a._id)).status).toBe(200);
  });

  it("el mensaje incluye el teléfono de la peluquería si lo tiene", async () => {
    await Salon.updateOne({ _id: A.salon._id }, { cancellationHours: 24, phone: "+34 600 123 456" });
    const a = await appt(3);
    const res = await cancel(A.tokens.client, a._id);
    expect(res.body.message).toContain("+34 600 123 456");
  });

    it("el estilista y el administrador pueden cancelar siempre", async () => {
    await setPolicy(48);
    const first = await appt(1);
    const second = await appt(2);

    expect((await cancel(A.tokens.admin, first._id)).status).toBe(200);

    const viaStatus = await http(A.slug, A.tokens.stylist)
      .patch(`/api/appointments/${second._id}/status`)
      .send({ status: "cancelled" });
    expect(viaStatus.status).toBe(200);
  });

  it("el cliente tampoco puede mover una cita dentro del plazo", async () => {
    await setPolicy(24);
    const a = await appt(3);

    const res = await http(A.slug, A.tokens.client)
      .patch(`/api/appointments/${a._id}/reschedule`)
      .send({ start: futureSlot(A.salon, 5, 12) });
    expect(res.status).toBe(403);
    expect((await Appointment.findById(a._id)).start.getTime()).toBe(a.start.getTime());
  });

  it("fuera del plazo, el cliente sí puede moverla", async () => {
    await setPolicy(24);
    const a = await appt(72);

    const res = await http(A.slug, A.tokens.client)
      .patch(`/api/appointments/${a._id}/reschedule`)
      .send({ start: futureSlot(A.salon, 6, 12) });
    expect(res.status).toBe(200);
  });

  it("una cita completada o ya cancelada no se puede cancelar", async () => {
    const done = await appt(48);
    await Appointment.updateOne({ _id: done._id }, { status: "completed" });
    expect((await cancel(A.tokens.client, done._id)).status).toBe(409);
    expect((await cancel(A.tokens.admin, done._id)).status).toBe(409);
    expect((await Appointment.findById(done._id)).status).toBe("completed");

    const cancelled = await appt(48);
    expect((await cancel(A.tokens.client, cancelled._id)).status).toBe(200);
    expect((await cancel(A.tokens.client, cancelled._id)).status).toBe(409);
  });

  it("el cliente no puede cancelar una cita que ya ha empezado", async () => {
    const a = await appt(-1);
    expect((await cancel(A.tokens.client, a._id)).status).toBe(400);
    expect((await Appointment.findById(a._id)).status).toBe("confirmed");

    // El administrador sí (por ejemplo, si el cliente no se presentó)
    expect((await cancel(A.tokens.admin, a._id)).status).toBe(200);
  });

  describe("ajuste en Apariencia", () => {
    const put = (token, cancellationHours) =>
      http(A.slug, token).put("/api/salon-settings").send({ cancellationHours });

    it("el administrador lo cambia y se publica", async () => {
      const res = await put(A.tokens.admin, 24);
      expect(res.status).toBe(200);
      expect(res.body.cancellationHours).toBe(24);
      expect((await http(null).get(`/api/salons/${A.slug}`)).body.cancellationHours).toBe(24);
    });

    it("rechaza valores que no están en la lista", async () => {
      expect((await put(A.tokens.admin, 5)).status).toBe(400);
      expect((await put(A.tokens.admin, -1)).status).toBe(400);
      expect((await put(A.tokens.admin, "abc")).status).toBe(400);
    });

    it("el cliente no puede cambiarlo", async () => {
      expect((await put(A.tokens.client, 24)).status).toBe(403);
    });
  });
});