import { beforeEach, describe, expect, it } from "vitest";
import User from "../src/models/User.js";
import AuthToken from "../src/models/AuthToken.js";
import { outbox } from "../src/services/mailer.js";
import { createSalonFixture, createUser, http, loginAs, PASSWORD } from "./helpers.js";

// El correo se envía sin esperar a la respuesta, así que hay que esperarlo
async function mailArrived(email) {
  for (let i = 0; i < 50 && !outbox.some((m) => m.to === email); i++) {
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}
describe("Autenticación", () => {
  let A;
  let B;

  beforeEach(async () => {
    outbox.length = 0;
    A = await createSalonFixture("salon-a");
    B = await createSalonFixture("salon-b");
  });

  describe("registro", () => {
    const body = (over = {}) => ({
      name: "Laura",
      email: "laura@test.com",
      password: "Password1",
      ...over,
    });

    it("siempre crea un cliente, aunque se intente elegir el rol", async () => {
      const res = await http(A.slug)
        .post("/api/auth/register")
        .send(body({ role: "admin" }));

      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe("client");
      expect((await User.findOne({ email: "laura@test.com" })).role).toBe("client");
    });

    it("la respuesta no incluye la contraseña ni su hash", async () => {
      const res = await http(A.slug).post("/api/auth/register").send(body());
      expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|Password1|\$2[aby]\$/);
    });

    it("guarda el email en minúsculas", async () => {
      await http(A.slug).post("/api/auth/register").send(body({ email: "LAURA@Test.com" }));
      expect(await User.findOne({ email: "laura@test.com" })).toBeTruthy();
    });

    it.each([
      ["nombre corto", { name: "A" }],
      ["email inválido", { email: "no-es-un-email" }],
      ["teléfono inválido", { phone: "abc" }],
      ["contraseña corta", { password: "Ab1" }],
      ["contraseña sin número", { password: "SoloLetrasAqui" }],
      ["contraseña sin letras", { password: "12345678" }],
    ])("rechaza: %s", async (_, over) => {
      const res = await http(A.slug).post("/api/auth/register").send(body(over));
      expect(res.status).toBe(400);
      expect(await User.countDocuments({ email: "laura@test.com" })).toBe(0);
    });
  });

  describe("inicio de sesión", () => {
    it("entra con las credenciales correctas, sin distinguir mayúsculas en el email", async () => {
      const res = await http(A.slug)
        .post("/api/auth/login")
        .send({ email: A.client.email.toUpperCase(), password: PASSWORD });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeTruthy();
      expect(res.body.user.email).toBe(A.client.email);
    });

    it("da el mismo error con una contraseña incorrecta que con un email inexistente", async () => {
      const wrongPassword = await http(A.slug)
        .post("/api/auth/login")
        .send({ email: A.client.email, password: "Incorrecta1" });
      const unknownEmail = await http(A.slug)
        .post("/api/auth/login")
        .send({ email: "nadie@test.com", password: PASSWORD });

      expect(wrongPassword.status).toBe(401);
      expect(unknownEmail.status).toBe(401);
      expect(wrongPassword.body).toEqual(unknownEmail.body);
    });

    it("una cuenta de A no puede entrar por la web de B", async () => {
      const res = await http(B.slug)
        .post("/api/auth/login")
        .send({ email: A.client.email, password: PASSWORD });
      expect(res.status).toBe(401);
    });
  });

  describe("tokens y roles", () => {
    it("sin token, con basura o con un token manipulado se responde 401", async () => {
      expect((await http(A.slug).get("/api/auth/me")).status).toBe(401);
      expect((await http(A.slug, "esto-no-es-un-token").get("/api/auth/me")).status).toBe(401);

      const tampered = A.tokens.client.slice(0, -3) + "abc";
      expect((await http(A.slug, tampered).get("/api/auth/me")).status).toBe(401);
    });

    it("cada rol solo accede a lo suyo", async () => {
      const newService = { name: "Tinte", durationMinutes: 60, price: 35 };

      // Crear servicios: solo admin
      expect((await http(A.slug, A.tokens.client).post("/api/services").send(newService)).status).toBe(403);
      expect((await http(A.slug, A.tokens.stylist).post("/api/services").send(newService)).status).toBe(403);
      expect((await http(A.slug, A.tokens.admin).post("/api/services").send(newService)).status).toBe(201);

      // Agenda: staff
      const agenda = (token) =>
        http(A.slug, token).get("/api/appointments/agenda").query({ date: "2030-01-01", stylistId: String(A.stylist._id) });
      expect((await agenda(A.tokens.client)).status).toBe(403);
      expect((await agenda(A.tokens.admin)).status).toBe(200);

      // Todos los estilistas (incluidos los desactivados): solo admin
      expect((await http(A.slug, A.tokens.stylist).get("/api/stylists/manage/all")).status).toBe(403);
      expect((await http(A.slug, A.tokens.admin).get("/api/stylists/manage/all")).status).toBe(200);
    });

    it("el rol se lee de la base de datos: cambiarlo surte efecto sin volver a entrar", async () => {
      const token = A.tokens.client;
      const newService = { name: "Tinte", durationMinutes: 60, price: 35 };
      expect((await http(A.slug, token).post("/api/services").send(newService)).status).toBe(403);

      await User.updateOne({ _id: A.client._id }, { role: "admin" });
      expect((await http(A.slug, token).post("/api/services").send(newService)).status).toBe(201);

      await User.updateOne({ _id: A.client._id }, { role: "client" });
      expect((await http(A.slug, token).post("/api/services").send(newService)).status).toBe(403);
    });

    it("un usuario borrado pierde el acceso al instante", async () => {
      await User.deleteOne({ _id: A.client._id });
      expect((await http(A.slug, A.tokens.client).get("/api/auth/me")).status).toBe(401);
    });
  });

  describe("perfil", () => {
    it("el usuario edita su nombre y teléfono, pero no su rol ni su email", async () => {
      const res = await http(A.slug, A.tokens.client)
        .put("/api/auth/me")
        .send({ name: "Nuevo Nombre", phone: "+34 600 123 456", role: "admin", email: "otro@test.com" });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Nuevo Nombre");

      const saved = await User.findById(A.client._id);
      expect(saved.name).toBe("Nuevo Nombre");
      expect(saved.phone).toBe("+34 600 123 456");
      expect(saved.role).toBe("client");
      expect(saved.email).toBe(A.client.email);
    });

    it("rechaza un nombre o un teléfono inválidos", async () => {
      expect((await http(A.slug, A.tokens.client).put("/api/auth/me").send({ name: "A" })).status).toBe(400);
      expect((await http(A.slug, A.tokens.client).put("/api/auth/me").send({ phone: "abc" })).status).toBe(400);
    });
  });

  describe("cambio de contraseña", () => {
    const change = (token, body) => http(A.slug, token).put("/api/auth/password").send(body);

    it("cierra las demás sesiones, pero deja abierta la actual con un token nuevo", async () => {
      const otherDevice = await loginAs(A.slug, A.client.email);

      const res = await change(A.tokens.client, { currentPassword: PASSWORD, newPassword: "NuevaClave1" });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeTruthy();

      // Las sesiones anteriores quedan invalidadas
      expect((await http(A.slug, A.tokens.client).get("/api/auth/me")).status).toBe(401);
      expect((await http(A.slug, otherDevice).get("/api/auth/me")).status).toBe(401);
      // La sesión nueva funciona
      expect((await http(A.slug, res.body.token).get("/api/auth/me")).status).toBe(200);

      // La contraseña antigua ya no entra; la nueva, sí
      await expect(loginAs(A.slug, A.client.email, PASSWORD)).rejects.toThrow();
      await loginAs(A.slug, A.client.email, "NuevaClave1");
    });

    it("rechaza una contraseña actual incorrecta (con 400, no 401, para no cerrar la sesión)", async () => {
      const res = await change(A.tokens.client, { currentPassword: "Incorrecta1", newPassword: "NuevaClave1" });
      expect(res.status).toBe(400);
      expect((await http(A.slug, A.tokens.client).get("/api/auth/me")).status).toBe(200);
    });

    it("rechaza una contraseña nueva débil o igual a la actual", async () => {
      expect((await change(A.tokens.client, { currentPassword: PASSWORD, newPassword: "corta" })).status).toBe(400);
      expect((await change(A.tokens.client, { currentPassword: PASSWORD, newPassword: PASSWORD })).status).toBe(400);
    });
  });

  describe("recuperar contraseña", () => {
    async function requestLink(F, email) {
      await http(F.slug).post("/api/auth/forgot-password").send({ email });
      const mail = outbox.filter((m) => m.to === email).at(-1);
      return mail?.text.match(/token=([a-f0-9]{64})/)?.[1];
    }

    // El correo se envía sin esperar a la respuesta
    const mailArrived = async (email) => {
      for (let i = 0; i < 50 && !outbox.some((m) => m.to === email); i++) {
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
    };

    it("el enlace funciona una sola vez y cierra las sesiones abiertas", async () => {
      await http(A.slug).post("/api/auth/forgot-password").send({ email: A.client.email });
      await mailArrived(A.client.email);
      const token = outbox.at(-1).text.match(/token=([a-f0-9]{64})/)[1];

      const info = await http(A.slug).post("/api/auth/token-info").send({ token });
      expect(info.status).toBe(200);
      expect(info.body).toMatchObject({ type: "reset", email: A.client.email });

      const reset = await http(A.slug).post("/api/auth/reset-password").send({ token, password: "NuevaClave1" });
      expect(reset.status).toBe(200);
      expect(reset.body.token).toBeTruthy(); // ya queda con sesión

      expect((await http(A.slug, A.tokens.client).get("/api/auth/me")).status).toBe(401);
      await loginAs(A.slug, A.client.email, "NuevaClave1");

      const reuse = await http(A.slug).post("/api/auth/reset-password").send({ token, password: "OtraClave2" });
      expect(reuse.status).toBe(400);
      expect((await http(A.slug).post("/api/auth/token-info").send({ token })).status).toBe(400);
    });

    it("una contraseña débil no gasta el enlace", async () => {
      await http(A.slug).post("/api/auth/forgot-password").send({ email: A.client.email });
      await mailArrived(A.client.email);
      const token = outbox.at(-1).text.match(/token=([a-f0-9]{64})/)[1];

      const weak = await http(A.slug).post("/api/auth/reset-password").send({ token, password: "corta" });
      expect(weak.status).toBe(400);

      const ok = await http(A.slug).post("/api/auth/reset-password").send({ token, password: "NuevaClave1" });
      expect(ok.status).toBe(200);
    });

    it("un enlace nuevo anula el anterior", async () => {
      await http(A.slug).post("/api/auth/forgot-password").send({ email: A.client.email });
      await mailArrived(A.client.email);
      const first = outbox.at(-1).text.match(/token=([a-f0-9]{64})/)[1];

      // Simula que ha pasado más de un minuto desde la primera petición
            // Directo al driver: Mongoose no deja modificar createdAt
      await AuthToken.collection.updateMany(
        {},
        { $set: { createdAt: new Date(Date.now() - 2 * 60 * 1000) } }
      );
      outbox.length = 0;

      await http(A.slug).post("/api/auth/forgot-password").send({ email: A.client.email });
      await mailArrived(A.client.email);
      const second = outbox.at(-1).text.match(/token=([a-f0-9]{64})/)[1];

      expect(second).not.toBe(first);
      expect((await http(A.slug).post("/api/auth/reset-password").send({ token: first, password: "NuevaClave1" })).status).toBe(400);
      expect((await http(A.slug).post("/api/auth/reset-password").send({ token: second, password: "NuevaClave1" })).status).toBe(200);
    });

    it("no se envía otro correo a la misma cuenta antes de un minuto", async () => {
      await http(A.slug).post("/api/auth/forgot-password").send({ email: A.client.email });
      await mailArrived(A.client.email);
      await http(A.slug).post("/api/auth/forgot-password").send({ email: A.client.email });
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(outbox.filter((m) => m.to === A.client.email)).toHaveLength(1);
    });

    it("un enlace caducado no sirve", async () => {
      await http(A.slug).post("/api/auth/forgot-password").send({ email: A.client.email });
      await mailArrived(A.client.email);
      const token = outbox.at(-1).text.match(/token=([a-f0-9]{64})/)[1];

      await AuthToken.updateMany({}, { expiresAt: new Date(Date.now() - 1000) });

      expect((await http(A.slug).post("/api/auth/token-info").send({ token })).status).toBe(400);
      expect((await http(A.slug).post("/api/auth/reset-password").send({ token, password: "NuevaClave1" })).status).toBe(400);
    });

    it("un enlace de A no sirve en la web de B", async () => {
      await http(A.slug).post("/api/auth/forgot-password").send({ email: A.client.email });
      await mailArrived(A.client.email);
      const token = outbox.at(-1).text.match(/token=([a-f0-9]{64})/)[1];

      const res = await http(B.slug).post("/api/auth/reset-password").send({ token, password: "NuevaClave1" });
      expect(res.status).toBe(400);
      await loginAs(A.slug, A.client.email); // la contraseña de A no ha cambiado
    });

    it("no se guarda el enlace en claro en la base de datos", async () => {
      await http(A.slug).post("/api/auth/forgot-password").send({ email: A.client.email });
      await mailArrived(A.client.email);
      const token = outbox.at(-1).text.match(/token=([a-f0-9]{64})/)[1];

      const stored = await AuthToken.findOne().lean();
      expect(stored.tokenHash).not.toBe(token);
      expect(JSON.stringify(stored)).not.toContain(token);
    });

    it("un token inventado o vacío se rechaza", async () => {
      expect((await http(A.slug).post("/api/auth/token-info").send({ token: "inventado" })).status).toBe(400);
      expect((await http(A.slug).post("/api/auth/token-info").send({})).status).toBe(400);
      expect((await http(A.slug).post("/api/auth/reset-password").send({ password: "NuevaClave1" })).status).toBe(400);
    });
  });

  describe("invitar a un estilista", () => {
    const invite = (body) => http(A.slug, A.tokens.admin).post("/api/stylists").send(body);

    it("crea la cuenta pendiente y se activa con el enlace del correo", async () => {
      const res = await invite({ name: "Lucía", email: "lucia@test.com", services: [String(A.service._id)] });
      expect(res.status).toBe(201);
      expect(res.body.accountCreated).toBe(true);

      const user = await User.findOne({ email: "lucia@test.com" });
      expect(user.role).toBe("stylist");
      expect(user.pendingInvite).toBe(true);

      // Con la contraseña aleatoria que nadie conoce no se puede entrar
      await expect(loginAs(A.slug, "lucia@test.com", "cualquiera1")).rejects.toThrow();

      await mailArrived("lucia@test.com");
      const token = outbox.find((m) => m.to === "lucia@test.com").text.match(/token=([a-f0-9]{64})/)[1];

      const info = await http(A.slug).post("/api/auth/token-info").send({ token });
      expect(info.body.type).toBe("invite");

      const activate = await http(A.slug).post("/api/auth/reset-password").send({ token, password: "MiClave123" });
      expect(activate.status).toBe(200);
      expect(activate.body.user.role).toBe("stylist");
      expect((await User.findById(user._id)).pendingInvite).toBe(false);
      await loginAs(A.slug, "lucia@test.com", "MiClave123");
    });

    it("se puede reenviar mientras esté pendiente, pero no cuando ya activó la cuenta", async () => {
      const created = await invite({ name: "Lucía", email: "lucia@test.com", services: [String(A.service._id)] });
      const stylistId = created.body.stylist._id;

      const resend = await http(A.slug, A.tokens.admin).post(`/api/stylists/${stylistId}/invite`);
      expect(resend.status).toBe(200);

      await mailArrived("lucia@test.com");
      const token = outbox.filter((m) => m.to === "lucia@test.com").at(-1).text.match(/token=([a-f0-9]{64})/)[1];
      await http(A.slug).post("/api/auth/reset-password").send({ token, password: "MiClave123" });

      const again = await http(A.slug, A.tokens.admin).post(`/api/stylists/${stylistId}/invite`);
      expect(again.status).toBe(409);
    });

    it("solo el administrador invita", async () => {
      const body = { name: "Lucía", email: "lucia@test.com", services: [] };
      expect((await http(A.slug, A.tokens.client).post("/api/stylists").send(body)).status).toBe(403);
      expect((await http(A.slug, A.tokens.stylist).post("/api/stylists").send(body)).status).toBe(403);
      expect(await User.countDocuments({ email: "lucia@test.com" })).toBe(0);
    });

    it("promociona a un cliente existente sin cambiarle la contraseña ni enviarle invitación", async () => {
      const res = await invite({ name: A.client.name, email: A.client.email, services: [String(A.service._id)] });

      expect(res.status).toBe(201);
      expect(res.body.accountCreated).toBe(false);
      expect((await User.findById(A.client._id)).role).toBe("stylist");
      expect((await User.findById(A.client._id)).pendingInvite).toBeFalsy();
      await loginAs(A.slug, A.client.email); // conserva su contraseña
    });

    it("un administrador no puede ser estilista, y nadie lo es dos veces", async () => {
      const admin = await invite({ name: "Admin", email: A.admin.email, services: [] });
      expect(admin.status).toBe(409);

      const again = await invite({ name: "Estilista", email: A.stylistUser.email, services: [] });
      expect(again.status).toBe(409);
    });

    it("los datos públicos de los estilistas no incluyen su email", async () => {
      const res = await http(A.slug).get("/api/stylists");
      expect(res.status).toBe(200);
      expect(JSON.stringify(res.body)).not.toContain(A.stylistUser.email);

      const manage = await http(A.slug, A.tokens.admin).get("/api/stylists/manage/all");
      expect(JSON.stringify(manage.body)).toContain(A.stylistUser.email);
    });

    it("el mismo email puede ser estilista en dos peluquerías distintas", async () => {
      await createUser({ salon: B.salon, name: "Lucía", email: "lucia@test.com" });
      const res = await invite({ name: "Lucía", email: "lucia@test.com", services: [] });
      expect(res.status).toBe(201);
    });
  });
});