import { beforeEach, describe, expect, it } from "vitest";
import { DateTime } from "luxon";
import Appointment from "../src/models/Appointment.js";
import Service from "../src/models/Service.js";
import Stylist from "../src/models/Stylist.js";
import {
  createSalonFixture,
  createUser,
  futureDate,
  futureSlot,
  http,
  loginAs,
} from "./helpers.js";

describe("Reservas", () => {
  let A;

  beforeEach(async () => {
    A = await createSalonFixture("salon-a");
  });

  // Reserva con el cliente de la peluquería (o con otro token)
  const post = (body, token = A.tokens.client) =>
    http(A.slug, token)
      .post("/api/appointments")
      .send({
        stylistId: String(A.stylist._id),
        serviceId: String(A.service._id),
        ...body,
      });

  const at = (hour, minute = 0, daysAhead = 3) => futureSlot(A.salon, daysAhead, hour, minute);

  async function otherClient(name) {
    const user = await createUser({ salon: A.salon, name, email: `${name}@${A.slug}.test` });
    return { user, token: await loginAs(A.slug, user.email) };
  }

  describe("crear una cita", () => {
    it("reserva un hueco libre: el servidor calcula el fin y toma el cliente de la sesión", async () => {
      const start = at(10);
      const res = await post({ start });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("confirmed");
      expect(String(res.body.client)).toBe(String(A.client._id));
      expect(new Date(res.body.end) - new Date(res.body.start)).toBe(30 * 60000); // 30 min
    });

    it("ignora un cliente o un fin enviados en la petición", async () => {
      const other = await otherClient("otra");
      const res = await post({
        start: at(10),
        client: String(other.user._id),
        end: at(18),
        status: "completed",
      });

      expect(res.status).toBe(201);
      expect(String(res.body.client)).toBe(String(A.client._id));
      expect(res.body.status).toBe("confirmed");
      expect(new Date(res.body.end) - new Date(res.body.start)).toBe(30 * 60000);
    });

        it("exige haber iniciado sesión", async () => {
      // Sin token: no se usa el helper post(), porque su valor por defecto sería el del cliente
      const res = await http(A.slug)
        .post("/api/appointments")
        .send({
          stylistId: String(A.stylist._id),
          serviceId: String(A.service._id),
          start: at(10),
        });

      expect(res.status).toBe(401);
      expect(await Appointment.countDocuments()).toBe(0);
    });
    it("rechaza el mismo hueco y los que se solapan, pero acepta los consecutivos", async () => {
      expect((await post({ start: at(10) })).status).toBe(201); // 10:00-10:30

      expect((await post({ start: at(10) })).status).toBe(409); // mismo hueco
      expect((await post({ start: at(10, 15) })).status).toBe(409); // empieza dentro
      expect((await post({ start: at(9, 45) })).status).toBe(409); // acaba dentro

      expect((await post({ start: at(10, 30) })).status).toBe(201); // empieza justo al acabar
      expect((await post({ start: at(9, 30) })).status).toBe(201); // acaba justo al empezar
    });

    it("rechaza fechas pasadas o mal escritas", async () => {
      expect((await post({ start: at(10, 0, -1) })).status).toBe(400);
      expect((await post({ start: "no-es-una-fecha" })).status).toBe(400);
      expect((await post({})).status).toBe(400);
    });

    it("solo acepta citas que caben dentro del horario del estilista", async () => {
      expect((await post({ start: at(8) })).status).toBe(400); // antes de abrir
      expect((await post({ start: at(19, 45) })).status).toBe(400); // acabaría a las 20:15
      expect((await post({ start: at(19, 30) })).status).toBe(201); // acaba justo a las 20:00
    });

    it("no se puede reservar en la pausa de comida ni en un día libre", async () => {
      // Horario partido: mañana 9-14 y tarde 16-20, todos los días
      await Stylist.updateOne(
        { _id: A.stylist._id },
        {
          workingHours: [0, 1, 2, 3, 4, 5, 6].flatMap((dayOfWeek) => [
            { dayOfWeek, start: "09:00", end: "14:00" },
            { dayOfWeek, start: "16:00", end: "20:00" },
          ]),
        }
      );
      expect((await post({ start: at(14, 30) })).status).toBe(400); // en la pausa
      expect((await post({ start: at(13, 45) })).status).toBe(400); // acabaría a las 14:15
      expect((await post({ start: at(16) })).status).toBe(201);

      // Día libre: se guarda como medianoche UTC de esa fecha
      const dayOff = new Date(`${futureDate(A.salon, 4)}T00:00:00Z`);
      await Stylist.updateOne({ _id: A.stylist._id }, { daysOff: [dayOff] });
      expect((await post({ start: at(10, 0, 4) })).status).toBe(400);
      expect((await post({ start: at(10, 0, 5) })).status).toBe(201); // otro día
    });

    it("solo con servicios que el estilista ofrece, activos y existentes", async () => {
      const notOffered = await Service.create({
        salon: A.salon._id,
        name: "Tinte",
        durationMinutes: 60,
        price: 35,
      });
      expect((await post({ start: at(10), serviceId: String(notOffered._id) })).status).toBe(400);

      await Service.updateOne({ _id: A.service._id }, { active: false });
      expect((await post({ start: at(10) })).status).toBe(404);
    });

    it("no se puede reservar con un estilista desactivado", async () => {
      await Stylist.updateOne({ _id: A.stylist._id }, { active: false });
      expect((await post({ start: at(10) })).status).toBe(404);
    });
  });

  describe("reservas simultáneas", () => {
    it("de cinco peticiones al mismo hueco, solo una se confirma", async () => {
      const start = at(11);
      const results = await Promise.all(Array.from({ length: 5 }, () => post({ start })));

      const created = results.filter((r) => r.status === 201);
      const rejected = results.filter((r) => r.status === 409);

      expect(created).toHaveLength(1);
      expect(rejected).toHaveLength(4);
      expect(await Appointment.countDocuments({ status: "confirmed" })).toBe(1);
    });

    it("las reservas de huecos distintos a la vez se confirman todas", async () => {
      const results = await Promise.all(
        [10, 11, 12, 13].map((hour) => post({ start: at(hour) }))
      );
      expect(results.every((r) => r.status === 201)).toBe(true);
      expect(await Appointment.countDocuments()).toBe(4);
    });
  });

  describe("huecos libres", () => {
    const availability = async (extra = {}) => {
      const res = await http(A.slug)
        .get(`/api/stylists/${A.stylist._id}/availability`)
        .query({ date: futureDate(A.salon, 3), serviceId: String(A.service._id), ...extra });
      expect(res.status).toBe(200);
      return res.body.slots.map((s) => s.start);
    };

    it("una cita ocupada quita los huecos que se solaparían con ella", async () => {
      const before = await availability();
      expect(before).toContain(at(10));

      expect((await post({ start: at(10) })).status).toBe(201); // 10:00-10:30
      const after = await availability();

      expect(after).not.toContain(at(9, 45)); // acabaría a las 10:15
      expect(after).not.toContain(at(10));
      expect(after).not.toContain(at(10, 15));
      expect(after).toContain(at(9, 30)); // acaba justo a las 10:00
      expect(after).toContain(at(10, 30)); // empieza justo a las 10:30
    });

    it("cancelar una cita libera su hueco", async () => {
      const appt = (await post({ start: at(10) })).body;
      expect(await availability()).not.toContain(at(10));

      await http(A.slug, A.tokens.client).patch(`/api/appointments/${appt._id}/cancel`);
      expect(await availability()).toContain(at(10));
    });

    it("con excludeAppointment, la cita se ve su propio hueco como libre", async () => {
      const appt = (await post({ start: at(10) })).body;
      expect(await availability()).not.toContain(at(10));
      expect(await availability({ excludeAppointment: appt._id })).toContain(at(10));
    });

    it("un día sin horario no tiene huecos", async () => {
      await Stylist.updateOne({ _id: A.stylist._id }, { workingHours: [] });
      expect(await availability()).toEqual([]);
    });
  });

  describe("cancelar", () => {
    it("el cliente cancela la suya, y el hueco se puede volver a reservar", async () => {
      const appt = (await post({ start: at(10) })).body;

      const cancel = await http(A.slug, A.tokens.client).patch(`/api/appointments/${appt._id}/cancel`);
      expect(cancel.status).toBe(200);
      expect(cancel.body.status).toBe("cancelled");

      expect((await post({ start: at(10) })).status).toBe(201);
    });

    it("otro cliente no puede cancelarla, pero el admin sí", async () => {
      const appt = (await post({ start: at(10) })).body;
      const other = await otherClient("otra");

      const denied = await http(A.slug, other.token).patch(`/api/appointments/${appt._id}/cancel`);
      expect(denied.status).toBe(403);
      expect((await Appointment.findById(appt._id)).status).toBe("confirmed");

      const byAdmin = await http(A.slug, A.tokens.admin).patch(`/api/appointments/${appt._id}/cancel`);
      expect(byAdmin.status).toBe(200);
    });

    it("«Mis citas» solo muestra las del propio cliente", async () => {
      await post({ start: at(10) });
      const other = await otherClient("otra");
      await post({ start: at(11) }, other.token);

      const mine = await http(A.slug, A.tokens.client).get("/api/appointments/me");
      expect(mine.body).toHaveLength(1);
      expect(String(mine.body[0].client)).toBe(String(A.client._id));
    });
  });

  describe("reprogramar", () => {
    it("mueve la cita, y puede solaparse con su propio hueco anterior", async () => {
      const appt = (await post({ start: at(10) })).body;

      const move = await http(A.slug, A.tokens.client)
        .patch(`/api/appointments/${appt._id}/reschedule`)
        .send({ start: at(10, 15) }); // se solapa solo con ella misma
      expect(move.status).toBe(200);
      expect(move.body.start).toBe(at(10, 15));
      expect(new Date(move.body.end) - new Date(move.body.start)).toBe(30 * 60000);
      expect(await Appointment.countDocuments()).toBe(1);
    });

    it("rechaza un hueco ocupado por otra cita, fuera del horario o en el pasado", async () => {
      const mine = (await post({ start: at(10) })).body;
      await post({ start: at(12) }, (await otherClient("otra")).token);

      const move = (start) =>
        http(A.slug, A.tokens.client).patch(`/api/appointments/${mine._id}/reschedule`).send({ start });

      expect((await move(at(12))).status).toBe(409); // ocupado
      expect((await move(at(8))).status).toBe(400); // fuera de horario
      expect((await move(at(10, 0, -1))).status).toBe(400); // pasado
      expect((await move("no-es-una-fecha")).status).toBe(400);

      expect((await Appointment.findById(mine._id)).start.toISOString()).toBe(at(10));
    });

    it("otro cliente no puede moverla, ni se puede mover una cancelada", async () => {
      const appt = (await post({ start: at(10) })).body;
      const other = await otherClient("otra");

      const denied = await http(A.slug, other.token)
        .patch(`/api/appointments/${appt._id}/reschedule`)
        .send({ start: at(15) });
      expect(denied.status).toBe(403);

      await http(A.slug, A.tokens.client).patch(`/api/appointments/${appt._id}/cancel`);
      const cancelled = await http(A.slug, A.tokens.client)
        .patch(`/api/appointments/${appt._id}/reschedule`)
        .send({ start: at(15) });
      expect(cancelled.status).toBe(409);
    });
  });

  describe("agenda y estados (estilista)", () => {
    it("el estilista ve su agenda, y el cliente no tiene acceso", async () => {
      await post({ start: at(10) });
      const query = { date: futureDate(A.salon, 3) };

      const stylist = await http(A.slug, A.tokens.stylist).get("/api/appointments/agenda").query(query);
      expect(stylist.status).toBe(200);
      expect(stylist.body.appointments).toHaveLength(1);
      expect(stylist.body.appointments[0].client.name).toBe("Cliente");

      expect((await http(A.slug, A.tokens.client).get("/api/appointments/agenda").query(query)).status).toBe(403);
      expect((await http(A.slug).get("/api/appointments/agenda").query(query)).status).toBe(401);
    });

    it("el rango semanal usa los días de la zona horaria de la peluquería", async () => {
      // Peluquería en Nueva York: la medianoche UTC cae a las 19:00/20:00 del día anterior
      const B = await createSalonFixture("salon-ny", { timezone: "America/New_York" });
      const day = futureDate(B.salon, 3);
      const start = DateTime.fromISO(`${day}T21:00`, { zone: "America/New_York" }).toJSDate();
      await Appointment.create({
        salon: B.salon._id,
        client: B.client._id,
        stylist: B.stylist._id,
        service: B.service._id,
        start,
        end: new Date(start.getTime() + 30 * 60000),
        status: "confirmed",
      });

      const next = DateTime.fromISO(day).plus({ days: 1 }).toISODate();
      const agenda = (from, to) =>
        http(B.slug, B.tokens.stylist).get("/api/appointments/agenda").query({ from, to });

      expect((await agenda(day, next)).body.appointments).toHaveLength(1);
      expect((await agenda(next, DateTime.fromISO(next).plus({ days: 1 }).toISODate())).body.appointments).toHaveLength(0);
    });

    it("el estilista cierra sus citas, pero no las de otro estilista", async () => {
      const appt = (await post({ start: at(10) })).body;

      const otherUser = await createUser({
        salon: A.salon,
        name: "Otro",
        email: `otro@${A.slug}.test`,
        role: "stylist",
      });
      await Stylist.create({
        salon: A.salon._id,
        user: otherUser._id,
        services: [A.service._id],
        workingHours: [{ dayOfWeek: 1, start: "09:00", end: "20:00" }],
      });
      const otherToken = await loginAs(A.slug, otherUser.email);

      const denied = await http(A.slug, otherToken)
        .patch(`/api/appointments/${appt._id}/status`)
        .send({ status: "completed" });
      expect(denied.status).toBe(403);

      const done = await http(A.slug, A.tokens.stylist)
        .patch(`/api/appointments/${appt._id}/status`)
        .send({ status: "completed" });
      expect(done.status).toBe(200);
      expect(done.body.status).toBe("completed");
    });

    it("una cita cerrada no se puede volver a cerrar ni cancelar, y solo se admiten dos estados", async () => {
      const appt = (await post({ start: at(10) })).body;
      const set = (status) =>
        http(A.slug, A.tokens.stylist).patch(`/api/appointments/${appt._id}/status`).send({ status });

      expect((await set("pending")).status).toBe(400); // estado no permitido
      expect((await set("completed")).status).toBe(200);
      expect((await set("cancelled")).status).toBe(409); // ya está cerrada
    });
  });
});