import { beforeEach, describe, expect, it, vi } from "vitest";
import AuthToken from "../src/models/AuthToken.js";
import User from "../src/models/User.js";
import { outbox } from "../src/services/mailer.js";
import { createSalonFixture, http, loginAs } from "./helpers.js";

const PASSWORD = "Secreto123";

// Los correos se envían sin esperar a la respuesta, así que hay que esperarlos
async function lastMailTo(email) {
  await vi.waitFor(() => expect(outbox.some((m) => m.to === email)).toBe(true));
  return outbox.filter((m) => m.to === email).at(-1);
}

const tokenOf = (mail) => mail.text.match(/token=([a-f0-9]{64})/)[1];

// Mongoose ignora los cambios en createdAt: se envejece por la colección
const ageTokens = (userId, ms) =>
  AuthToken.collection.updateMany(
    { user: userId },
    { $set: { createdAt: new Date(Date.now() - ms) } }
  );

describe("Confirmación del correo del dueño", () => {
  let owner; // { slug, email, token, user }

  async function createOwner(slug = "lola", email = "lola@dueña.com") {
    
    const res = await http(null)
      .post("/api/salons")
      .send({
        salonName: "Peluquería Lola",
        slug,
        adminName: "Lola Pérez",
        email,
        password: PASSWORD,
      });
    expect(res.status).toBe(201);
    const user = await User.findById(res.body.user.id);
    return { slug, email, token: res.body.token, user, body: res.body };
  }

  beforeEach(async () => {
    outbox.length = 0;
    owner = await createOwner();
  });

  it("el dueño nuevo empieza sin confirmar y recibe el correo con el enlace", async () => {
    expect(owner.body.user.emailVerified).toBe(false);
    expect(owner.user.emailVerified).toBe(false);

    const mail = await lastMailTo(owner.email);
    expect(mail.subject).toMatch(/Confirma tu correo/);
    expect(mail.text).toContain(`/s/${owner.slug}/confirmar-correo?token=`);
    expect(tokenOf(mail)).toHaveLength(64);
  });

  it("el enlace confirma el correo y solo sirve una vez", async () => {
    const token = tokenOf(await lastMailTo(owner.email));

    const first = await http(owner.slug).post("/api/auth/confirm-email").send({ token });
    expect(first.status).toBe(200);
    expect((await User.findById(owner.user._id)).emailVerified).toBe(true);

    const me = await http(owner.slug, owner.token).get("/api/auth/me");
    expect(me.body.emailVerified).toBe(true);

    const second = await http(owner.slug).post("/api/auth/confirm-email").send({ token });
    expect(second.status).toBe(400);
  });

  it("no se guarda el enlace en claro en la base de datos", async () => {
    const token = tokenOf(await lastMailTo(owner.email));
    expect(await AuthToken.countDocuments({ tokenHash: token })).toBe(0);
    expect(await AuthToken.countDocuments({ user: owner.user._id, type: "verify" })).toBe(1);
  });

  it("rechaza un token inventado o vacío", async () => {
    for (const token of ["", "abc", "a".repeat(64)]) {
      const res = await http(owner.slug).post("/api/auth/confirm-email").send({ token });
      expect(res.status).toBe(400);
    }
    expect((await User.findById(owner.user._id)).emailVerified).toBe(false);
  });

  it("un enlace caducado no sirve", async () => {
    const token = tokenOf(await lastMailTo(owner.email));
    await AuthToken.collection.updateMany(
      { user: owner.user._id },
      { $set: { expiresAt: new Date(Date.now() - 1000) } }
    );

    const res = await http(owner.slug).post("/api/auth/confirm-email").send({ token });
    expect(res.status).toBe(400);
    expect((await User.findById(owner.user._id)).emailVerified).toBe(false);
  });

  it("un enlace de una peluquería no sirve en otra", async () => {
    const other = await createOwner("otra", "otra@dueña.com");
    const token = tokenOf(await lastMailTo(owner.email));

    const res = await http(other.slug).post("/api/auth/confirm-email").send({ token });
    expect(res.status).toBe(400);
    expect((await User.findById(owner.user._id)).emailVerified).toBe(false);
  });

  describe("reenviar", () => {
    it("exige haber iniciado sesión", async () => {
      const res = await http(owner.slug).post("/api/auth/send-verification");
      expect(res.status).toBe(401);
    });

    it("tiene un descanso de un minuto", async () => {
      // El alta ya envió un correo hace un instante
      const res = await http(owner.slug, owner.token).post("/api/auth/send-verification");
      expect(res.status).toBe(429);
    });

    it("pasado el descanso envía un enlace nuevo y anula el anterior", async () => {
      const first = tokenOf(await lastMailTo(owner.email));
      await ageTokens(owner.user._id, 2 * 60 * 1000);
      outbox.length = 0;

      const res = await http(owner.slug, owner.token).post("/api/auth/send-verification");
      expect(res.status).toBe(200);

      const second = tokenOf(await lastMailTo(owner.email));
      expect(second).not.toBe(first);

      const old = await http(owner.slug).post("/api/auth/confirm-email").send({ token: first });
      expect(old.status).toBe(400);
      const fresh = await http(owner.slug).post("/api/auth/confirm-email").send({ token: second });
      expect(fresh.status).toBe(200);
    });

    it("si ya está confirmado no envía nada", async () => {
      const token = tokenOf(await lastMailTo(owner.email));
      await http(owner.slug).post("/api/auth/confirm-email").send({ token });
      outbox.length = 0;

      const res = await http(owner.slug, owner.token).post("/api/auth/send-verification");
      expect(res.status).toBe(200);
      expect(res.body.emailVerified).toBe(true);
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(outbox).toHaveLength(0);
    });
  });

  describe("separación con las demás cuentas y enlaces", () => {
    it("un enlace de confirmación no sirve para restablecer la contraseña", async () => {
      const token = tokenOf(await lastMailTo(owner.email));

      const info = await http(owner.slug).post("/api/auth/token-info").send({ token });
      expect(info.status).toBe(400);

      const reset = await http(owner.slug)
        .post("/api/auth/reset-password")
        .send({ token, password: "Otra12345" });
      expect(reset.status).toBe(400);
      await loginAs(owner.slug, owner.email, PASSWORD); // la contraseña no cambió
    });

    it("pedir un enlace para restablecer la contraseña no anula el de confirmación", async () => {
      const verify = tokenOf(await lastMailTo(owner.email));
      await ageTokens(owner.user._id, 2 * 60 * 1000);
      outbox.length = 0;

      await http(owner.slug).post("/api/auth/forgot-password").send({ email: owner.email });
      await lastMailTo(owner.email);

      const res = await http(owner.slug).post("/api/auth/confirm-email").send({ token: verify });
      expect(res.status).toBe(200);
    });

    it("restablecer la contraseña por correo también confirma el correo", async () => {
      await ageTokens(owner.user._id, 2 * 60 * 1000);
      outbox.length = 0;
      await http(owner.slug).post("/api/auth/forgot-password").send({ email: owner.email });
      const reset = tokenOf(await lastMailTo(owner.email));

      const res = await http(owner.slug)
        .post("/api/auth/reset-password")
        .send({ token: reset, password: "Otra12345" });
      expect(res.status).toBe(200);
      expect((await User.findById(owner.user._id)).emailVerified).toBe(true);
    });

    it("las cuentas que no son de un dueño nuevo cuentan como confirmadas", async () => {
      const A = await createSalonFixture("salon-a");
      for (const token of Object.values(A.tokens)) {
        const me = await http(A.slug, token).get("/api/auth/me");
        expect(me.body.emailVerified).toBe(true);
      }
    });

    it("una cuenta sin el campo (anterior a esta función) cuenta como confirmada", async () => {
      await User.collection.updateOne(
        { _id: owner.user._id },
        { $unset: { emailVerified: "" } }
      );
      const me = await http(owner.slug, owner.token).get("/api/auth/me");
      expect(me.body.emailVerified).toBe(true);
    });
  });
});