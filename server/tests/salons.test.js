import { describe, expect, it } from "vitest";
import Salon from "../src/models/Salon.js";
import User from "../src/models/User.js";
import { DEFAULT_BRANDING } from "../src/utils/branding.js";
import { http } from "./helpers.js";

const payload = (over = {}) => ({
  salonName: "Peluquería Lola",
  slug: "lola",
  timezone: "Europe/Madrid",
  adminName: "Lola",
  email: "lola@test.com",
  password: "Password1",
  ...over,
});

describe("Alta de peluquerías", () => {
  it("crea la peluquería y un administrador con sesión válida", async () => {
    const res = await http(null).post("/api/salons").send(payload());
    expect(res.status).toBe(201);
    expect(res.body.salon).toEqual({ name: "Peluquería Lola", slug: "lola" });
    expect(res.body.user.role).toBe("admin");

    const me = await http("lola", res.body.token).get("/api/auth/me");
    expect(me.status).toBe(200);
    expect(me.body.email).toBe("lola@test.com");
  });

  it("rellena la marca y las secciones por defecto si no se envían", async () => {
    await http(null).post("/api/salons").send(payload());
    const salon = await Salon.findOne({ slug: "lola" }).lean();
    expect(salon.branding).toMatchObject(DEFAULT_BRANDING);
    expect(salon.sections).toMatchObject({ howItWorks: true, perks: true });
  });

  it("guarda la personalización y normaliza el contenido", async () => {
    const res = await http(null)
      .post("/api/salons")
      .send(
        payload({
          branding: { accent: "#5B8FD1", font: "elegant", icon: "crown" },
          tagline: "  Cortes con carácter ",
          social: { instagram: "https://instagram.com/lola_pelu/", website: "lola.com" },
          sections: { howItWorks: false },
        })
      );
    expect(res.status).toBe(201);

    const salon = await Salon.findOne({ slug: "lola" }).lean();
    expect(salon.branding).toMatchObject({ accent: "#5b8fd1", font: "elegant", icon: "crown" });
    expect(salon.tagline).toBe("Cortes con carácter");
    expect(salon.social.instagram).toBe("lola_pelu");
    expect(salon.social.website).toBe("https://lola.com");
    expect(salon.sections).toEqual({ howItWorks: false, perks: true });
  });

  it.each([
    ["marca inválida", { branding: { accent: "rojo" } }],
    ["web con http", { social: { website: "http://example.com" } }],
    ["teléfono inválido", { phone: "abc" }],
    ["dirección reservada: admin", { slug: "admin" }],
    ["dirección reservada: api", { slug: "api" }],
    ["dirección demasiado corta", { slug: "ab" }],
    ["dirección con espacios", { slug: "con espacios" }],
    ["nombre del negocio vacío", { salonName: " " }],
    ["zona horaria inexistente", { timezone: "Marte/Olimpo" }],
    ["email inválido", { email: "no-es-un-email" }],
    ["contraseña débil", { password: "corta" }],
  ])("rechaza: %s (y no crea nada)", async (_, over) => {
    const res = await http(null).post("/api/salons").send(payload(over));
    expect(res.status).toBe(400);
    expect(await Salon.countDocuments()).toBe(0);
    expect(await User.countDocuments()).toBe(0);
  });

  it("no permite repetir la dirección", async () => {
    expect((await http(null).post("/api/salons").send(payload())).status).toBe(201);

    const again = await http(null)
      .post("/api/salons")
      .send(payload({ email: "otra@test.com" }));
    expect(again.status).toBe(409);
    expect(await Salon.countDocuments()).toBe(1);
  });
});

describe("Datos públicos de una peluquería", () => {
  it("devuelve la marca y el contenido, sin datos internos", async () => {
    await http(null)
      .post("/api/salons")
      .send(payload({ tagline: "Hola", branding: { icon: "crown" } }));

    const res = await http(null).get("/api/salons/lola");
    expect(res.status).toBe(200);
    expect(res.body.tagline).toBe("Hola");
    expect(res.body.branding.icon).toBe("crown");
    for (const key of ["_id", "active", "createdAt", "updatedAt", "__v"]) {
      expect(res.body).not.toHaveProperty(key);
    }
  });

  it("una peluquería inexistente o desactivada da 404", async () => {
    expect((await http(null).get("/api/salons/no-existe")).status).toBe(404);

    await http(null).post("/api/salons").send(payload());
    await Salon.updateOne({ slug: "lola" }, { active: false });
    expect((await http(null).get("/api/salons/lola")).status).toBe(404);
    expect((await http("lola").get("/api/services")).status).toBe(404);
  });
});