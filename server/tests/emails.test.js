import { beforeEach, describe, expect, it, vi } from "vitest";
import Salon from "../src/models/Salon.js";
import { outbox } from "../src/services/mailer.js";
import { deriveColors } from "../src/utils/colors.js";
import { createSalonFixture, futureSlot, http, loginAs } from "./helpers.js";

async function book(F, daysAhead = 3) {
  const res = await http(F.slug, F.tokens.client)
    .post("/api/appointments")
    .send({
      stylistId: String(F.stylist._id),
      serviceId: String(F.service._id),
      start: futureSlot(F.salon, daysAhead),
    });
  expect(res.status).toBe(201);
  return res.body;
}

// Los correos se envían sin esperar a la respuesta, así que hay que esperarlos
async function mailTo(email) {
  await vi.waitFor(() => expect(outbox.some((m) => m.to === email)).toBe(true));
  return outbox.filter((m) => m.to === email).at(-1);
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 100));

describe("Correos con la marca de cada peluquería", () => {
  let A;
  let B;

  beforeEach(async () => {
    outbox.length = 0;
    A = await createSalonFixture("salon-a");
    B = await createSalonFixture("salon-b");
  });

  it("la confirmación usa el color, la dirección y el nombre de la peluquería", async () => {
    await Salon.updateOne(
      { _id: A.salon._id },
      { "branding.accent": "#d0735a", address: "Calle Mayor 12, Madrid", phone: "+34 600 123 456" }
    );
    await book(A);

    const mail = await mailTo(A.client.email);
    const { gold } = deriveColors("#d0735a");

    expect(mail.fromName).toBe(A.salon.name);
    expect(mail.subject).toContain(A.salon.name);
    expect(mail.html).toContain(`border-top:6px solid ${gold}`);
    expect(mail.html).toContain(`background:${gold}`);
    expect(mail.html).toContain("Dónde");
    expect(mail.html).toContain(encodeURIComponent("Calle Mayor 12, Madrid"));
    expect(mail.html).toContain("tel:+34600123456");
    expect(mail.text).toContain("Calle Mayor 12, Madrid");
  });

  it("sin dirección ni teléfono no aparecen la fila «Dónde» ni el pie", async () => {
    await book(A);
    const mail = await mailTo(A.client.email);

    expect(mail.html).not.toContain("Dónde");
    expect(mail.html).not.toContain("tel:");
    expect(mail.html).not.toContain("google.com/maps");
  });

  it("cada peluquería usa su propio color", async () => {
    await Salon.updateOne({ _id: A.salon._id }, { "branding.accent": "#d0735a" });
    await Salon.updateOne({ _id: B.salon._id }, { "branding.accent": "#5b8fd1" });

    await book(A);
    await book(B);

    const mailA = await mailTo(A.client.email);
    const mailB = await mailTo(B.client.email);
    const goldA = deriveColors("#d0735a").gold;
    const goldB = deriveColors("#5b8fd1").gold;

    expect(mailA.html).toContain(goldA);
    expect(mailA.html).not.toContain(goldB);
    expect(mailB.html).toContain(goldB);
    expect(mailB.html).not.toContain(goldA);
    expect(mailA.fromName).toBe(A.salon.name);
    expect(mailB.fromName).toBe(B.salon.name);
  });

  it("un color propio muy oscuro se ajusta para que el botón se lea", async () => {
    await Salon.updateOne({ _id: A.salon._id }, { "branding.accent": "#000000" });
    await book(A);

    const mail = await mailTo(A.client.email);
    const { gold } = deriveColors("#000000");
    expect(gold).not.toBe("#000000");
    expect(mail.html).toContain(`background:${gold}`);
  });

  it("escapa el HTML de los datos de la peluquería", async () => {
    await Salon.updateOne(
      { _id: A.salon._id },
      { name: "<img src=x onerror=alert(1)> & Co", address: "<script>alert(1)</script>" }
    );
    await book(A);

    const mail = await mailTo(A.client.email);
    expect(mail.html).not.toContain("<img src=x");
    expect(mail.html).not.toContain("<script>");
    expect(mail.html).toContain("&lt;script&gt;");
  });

  it("si cancela el cliente se avisa también al estilista; si cancela el estilista, solo al cliente", async () => {
    const first = await book(A, 3);
    await mailTo(A.client.email);
    outbox.length = 0;

    await http(A.slug, A.tokens.client).patch(`/api/appointments/${first._id}/cancel`);
    expect((await mailTo(A.client.email)).subject).toMatch(/Cita cancelada/);
    expect((await mailTo(A.stylistUser.email)).subject).toMatch(/cancelada por el cliente/);

    const second = await book(A, 4);
    await mailTo(A.client.email);
    outbox.length = 0;

    const res = await http(A.slug, A.tokens.stylist)
      .patch(`/api/appointments/${second._id}/status`)
      .send({ status: "cancelled" });
    expect(res.status).toBe(200);

    await mailTo(A.client.email);
    await settle();
    expect(outbox.some((m) => m.to === A.stylistUser.email)).toBe(false);
  });

  it("al reprogramar, el correo lleva la hora anterior y la nueva", async () => {
    const appt = await book(A, 3);
    await mailTo(A.client.email);
    outbox.length = 0;

    const res = await http(A.slug, A.tokens.client)
      .patch(`/api/appointments/${appt._id}/reschedule`)
      .send({ start: futureSlot(A.salon, 5, 12) });
    expect(res.status).toBe(200);

    const mail = await mailTo(A.client.email);
    expect(mail.subject).toMatch(/Cita cambiada/);
    expect(mail.html).toContain("line-through");
    expect(mail.text).toContain("Antes:");
    expect(mail.text).toContain("Ahora:");
  });

  describe("recuperación de contraseña", () => {
    it("lleva la marca y un enlace de un solo uso", async () => {
      await Salon.updateOne({ _id: A.salon._id }, { "branding.accent": "#d0735a" });

      const forgot = await http(A.slug).post("/api/auth/forgot-password").send({ email: A.client.email });
      expect(forgot.status).toBe(200);

      const mail = await mailTo(A.client.email);
      expect(mail.fromName).toBe(A.salon.name);
      expect(mail.html).toContain(`background:${deriveColors("#d0735a").gold}`);

      const token = mail.text.match(/token=([a-f0-9]{64})/)?.[1];
      expect(token).toBeTruthy();

      const reset = await http(A.slug)
        .post("/api/auth/reset-password")
        .send({ token, password: "NuevaClave1" });
      expect(reset.status).toBe(200);
      await loginAs(A.slug, A.client.email, "NuevaClave1"); // lanza si no funciona

      const reuse = await http(A.slug)
        .post("/api/auth/reset-password")
        .send({ token, password: "OtraClave2" });
      expect(reuse.status).toBe(400);
    });

    it("responde igual y no envía nada si el email no existe", async () => {
      const real = await http(A.slug).post("/api/auth/forgot-password").send({ email: A.client.email });
      const fake = await http(A.slug).post("/api/auth/forgot-password").send({ email: "nadie@test.com" });

      expect(fake.status).toBe(real.status);
      expect(fake.body).toEqual(real.body);

      await settle();
      expect(outbox.every((m) => m.to !== "nadie@test.com")).toBe(true);
    });

    it("no manda el correo de A a una cuenta que solo existe en B", async () => {
      await http(A.slug).post("/api/auth/forgot-password").send({ email: B.client.email });
      await settle();
      expect(outbox).toHaveLength(0);
    });
  });

  it("la invitación a un estilista lleva la marca y un enlace para activar la cuenta", async () => {
    await Salon.updateOne({ _id: A.salon._id }, { "branding.accent": "#5b8fd1" });

    const res = await http(A.slug, A.tokens.admin)
      .post("/api/stylists")
      .send({ name: "Lucía", email: "lucia@test.com", services: [String(A.service._id)] });
    expect(res.status).toBe(201);
    expect(res.body.accountCreated).toBe(true);
    expect(res.body.invitationSent).toBe(true);

    const mail = await mailTo("lucia@test.com");
    expect(mail.subject).toContain(A.salon.name);
    expect(mail.fromName).toBe(A.salon.name);
    expect(mail.html).toContain(`background:${deriveColors("#5b8fd1").gold}`);
    expect(mail.text).toMatch(/restablecer\?token=[a-f0-9]{64}/);
  });
});