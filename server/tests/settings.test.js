import { beforeEach, describe, expect, it } from "vitest";
import Salon from "../src/models/Salon.js";
import { createSalonFixture, http } from "./helpers.js";

const valid = (over = {}) => ({
  name: "Nuevo nombre",
  branding: { accent: "#5b8fd1", font: "modern", radius: "round", icon: "gem" },
  tagline: "Eslogan nuevo",
  heroTitle: "Título nuevo",
  address: "Calle Mayor 12",
  phone: "+34 600 123 456",
  social: { instagram: "@mi_pelu", website: "mipelu.com" },
  sections: { howItWorks: false, perks: true },
  ...over,
});

describe("Ajustes de la peluquería (Apariencia)", () => {
  let A;
  let B;

  beforeEach(async () => {
    A = await createSalonFixture("salon-a");
    B = await createSalonFixture("salon-b");
  });

  const put = (F, token, body) => http(F.slug, token).put("/api/salon-settings").send(body);

  it("el admin edita su peluquería y los cambios se ven en la web pública", async () => {
    const res = await put(A, A.tokens.admin, valid());
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Nuevo nombre");
    expect(res.body.branding).toMatchObject({ accent: "#5b8fd1", font: "modern", icon: "gem" });
    expect(res.body.social.instagram).toBe("mi_pelu");
    expect(res.body.social.website).toBe("https://mipelu.com");

    const pub = await http(null).get(`/api/salons/${A.slug}`);
    expect(pub.body.branding.font).toBe("modern");
    expect(pub.body.address).toBe("Calle Mayor 12");
  });

  it("solo el administrador puede editar", async () => {
    expect((await put(A, A.tokens.client, valid())).status).toBe(403);
    expect((await put(A, A.tokens.stylist, valid())).status).toBe(403);
    expect((await put(A, undefined, valid())).status).toBe(401);
    expect((await Salon.findById(A.salon._id)).name).toBe(A.salon.name);
  });

  it("el admin de B no puede editar A", async () => {
    const res = await put(A, B.tokens.admin, valid());
    expect(res.status).toBe(403);
    expect((await Salon.findById(A.salon._id)).name).toBe(A.salon.name);
  });

  it("editar B no toca A", async () => {
    expect((await put(B, B.tokens.admin, valid({ name: "Solo B" }))).status).toBe(200);
    expect((await Salon.findById(A.salon._id)).name).toBe(A.salon.name);
    expect((await Salon.findById(B.salon._id)).name).toBe("Solo B");
  });

  it("no se pueden cambiar la dirección web, la zona horaria ni el estado", async () => {
    const res = await put(A, A.tokens.admin, {
      ...valid(),
      slug: "secuestrada",
      timezone: "Asia/Tokyo",
      active: false,
    });
    expect(res.status).toBe(200);

    const saved = await Salon.findById(A.salon._id);
    expect(saved.slug).toBe("salon-a");
    expect(saved.timezone).toBe("Europe/Madrid");
    expect(saved.active).toBe(true);
  });

  it.each([
    ["color", { branding: { accent: "rojo" } }, "Color no válido"],
    ["tipografía", { branding: { font: "comic" } }, "Tipografía no válida"],
    ["nombre corto", { name: "A" }, "El nombre debe tener entre 2 y 80 caracteres"],
    ["teléfono", { phone: "abc" }, "Teléfono no válido"],
    ["web http", { social: { website: "http://example.com" } }, "Web no válida (usa una dirección https)"],
    ["web javascript", { social: { website: "javascript:alert(1)" } }, "Web no válida (usa una dirección https)"],
  ])("rechaza %s y no guarda nada", async (_, over, message) => {
    const res = await put(A, A.tokens.admin, valid(over));
    expect(res.status).toBe(400);
    expect(res.body.message).toBe(message);
    expect((await Salon.findById(A.salon._id)).name).toBe(A.salon.name);
  });
});