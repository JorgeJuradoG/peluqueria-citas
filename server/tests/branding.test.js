import { describe, expect, it } from "vitest";
import { DEFAULT_BRANDING, parseBranding, parseProfile } from "../src/utils/branding.js";
import { deriveColors } from "../src/utils/colors.js";

// Contraste WCAG entre dos colores hexadecimales
function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
    .map((c) => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    })
    .reduce((acc, v, i) => acc + v * [0.2126, 0.7152, 0.0722][i], 0);
}
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe("parseBranding", () => {
  it("rellena los valores por defecto", () => {
    expect(parseBranding(undefined).value).toEqual(DEFAULT_BRANDING);
    expect(parseBranding(null).value).toEqual(DEFAULT_BRANDING);
    expect(parseBranding({}).value).toEqual(DEFAULT_BRANDING);
  });

  it("acepta una marca completa y pasa el color a minúsculas", () => {
    const { value, error } = parseBranding({
      accent: "#5B8FD1",
      font: "elegant",
      radius: "sharp",
      icon: "crown",
      hero: "accent",
      decor: "none",
      cards: "flat",
    });
    expect(error).toBeUndefined();
    expect(value.accent).toBe("#5b8fd1");
    expect(value.font).toBe("elegant");
  });

  it.each([
    [{ accent: "rojo" }, "Color no válido"],
    [{ accent: "#fff" }, "Color no válido"],
    [{ font: "comic" }, "Tipografía no válida"],
    [{ radius: "x" }, "Estilo de esquinas no válido"],
    [{ icon: "x" }, "Icono no válido"],
  ])("rechaza %j", (input, message) => {
    expect(parseBranding(input).error).toBe(message);
  });
});

describe("parseProfile", () => {
  it("todo es opcional", () => {
    const { value, error } = parseProfile({});
    expect(error).toBeUndefined();
    expect(value.sections).toEqual({ howItWorks: true, perks: true });
  });

  it("solo acepta enlaces https (nunca javascript: ni http:)", () => {
    for (const website of ["javascript:alert(1)", "http://example.com"]) {
      expect(parseProfile({ social: { website } }).error).toBe(
        "Web no válida (usa una dirección https)"
      );
    }
  });

  it("normaliza Instagram y WhatsApp", () => {
    const { value } = parseProfile({
      social: { instagram: "@mi.pelu", whatsapp: "+34 600 123 456" },
    });
    expect(value.social.instagram).toBe("mi.pelu");
    expect(value.social.whatsapp).toBe("34600123456");
  });

  it("rechaza un teléfono inválido", () => {
    expect(parseProfile({ phone: "abc" }).error).toBe("Teléfono no válido");
  });
});

describe("deriveColors", () => {
  const accents = ["#b08d57", "#d0735a", "#5b8fd1", "#000000", "#ffffff", "#ffff00", "#001a4d"];

  it.each(accents)("con %s, los textos se leen sobre el color", (accent) => {
    const { gold, goldDark } = deriveColors(accent);
    expect(contrast(gold, "#1c1917")).toBeGreaterThanOrEqual(4.5);
    expect(contrast(goldDark, "#faf7f2")).toBeGreaterThanOrEqual(4.5);
  });

  it("un color inválido vuelve al de por defecto", () => {
    expect(deriveColors("rojo")).toEqual(deriveColors(DEFAULT_BRANDING.accent));
  });
});