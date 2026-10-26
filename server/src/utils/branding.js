export const FONTS = ["classic", "modern", "warm", "elegant", "bold"];
export const RADII = ["sharp", "soft", "round"];
export const ICONS = ["scissors", "sparkles", "crown", "flower", "gem", "star"];
export const HEROES = ["dark", "accent", "light"];
export const DECORS = ["glow", "dots", "none"];
export const CARDS = ["shadow", "outline", "flat"];

// Cómo llama cada peluquería a su equipo en toda la web
export const STAFF_TERMS = ["estilista", "barbero", "profesional"];
export const DEFAULT_STAFF_TERM = "estilista";

export const DEFAULT_BRANDING = {
  accent: "#b08d57",
  font: "classic",
  radius: "soft",
  icon: "scissors",
  hero: "dark",
  decor: "glow",
  cards: "shadow",
};

const CHOICES = {
  font: [FONTS, "Tipografía no válida"],
  radius: [RADII, "Estilo de esquinas no válido"],
  icon: [ICONS, "Icono no válido"],
  hero: [HEROES, "Estilo de portada no válido"],
  decor: [DECORS, "Decoración no válida"],
  cards: [CARDS, "Estilo de tarjetas no válido"],
};

const HEX_RE = /^#[0-9a-f]{6}$/i;
const PHONE_RE = /^\+?[\d\s-]{9,15}$/;
const INSTAGRAM_RE = /^[a-z0-9._]{1,30}$/i;

// Devuelve { value } o { error }. Lo que no venga se rellena con los valores por defecto
export function parseBranding(input) {
  const raw = input && typeof input === "object" ? input : {};
  const value = { ...DEFAULT_BRANDING };

  if (raw.accent !== undefined) {
    if (!HEX_RE.test(String(raw.accent))) return { error: "Color no válido" };
    value.accent = String(raw.accent).toLowerCase();
  }
  for (const [key, [list, message]] of Object.entries(CHOICES)) {
    if (raw[key] === undefined) continue;
    if (!list.includes(raw[key])) return { error: message };
    value[key] = raw[key];
  }
  return { value };
}

// Contenido de la peluquería (todo opcional)
export function parseProfile(body) {
  const text = (v) => String(v ?? "").trim();

  const tagline = text(body.tagline);
  const heroTitle = text(body.heroTitle);
  const about = text(body.about);
  const hours = text(body.hours);
  const address = text(body.address);
  const phone = text(body.phone);

  if (heroTitle.length > 80) return { error: "El título de portada admite hasta 80 caracteres" };
  if (tagline.length > 120) return { error: "El eslogan admite hasta 120 caracteres" };
  if (about.length > 600) return { error: "«Sobre nosotros» admite hasta 600 caracteres" };
  if (hours.length > 200) return { error: "El horario admite hasta 200 caracteres" };
  if (address.length > 160) return { error: "La dirección admite hasta 160 caracteres" };
  if (phone && !PHONE_RE.test(phone)) return { error: "Teléfono no válido" };

  // Término del equipo: solo valores de la lista (así nunca llega texto libre a los correos)
  const staffTerm = text(body.staffTerm) || DEFAULT_STAFF_TERM;
  if (!STAFF_TERMS.includes(staffTerm)) return { error: "Término del equipo no válido" };

  const social = body.social && typeof body.social === "object" ? body.social : {};

  // Instagram: vale "@usuario", "usuario" o la URL completa
  const instagram = text(social.instagram)
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .split(/[/?#]/)[0];
  if (instagram && !INSTAGRAM_RE.test(instagram)) return { error: "Usuario de Instagram no válido" };

  // WhatsApp: solo dígitos, con prefijo de país
  const whatsapp = text(social.whatsapp).replace(/\D/g, "");
  if (whatsapp && (whatsapp.length < 9 || whatsapp.length > 15)) {
    return { error: "Número de WhatsApp no válido (incluye el prefijo del país)" };
  }

  // Web: solo https, para que nunca se guarde un enlace "javascript:"
  let website = text(social.website);
  if (website) {
    if (!/^[a-z][a-z0-9+.-]*:/i.test(website)) website = `https://${website}`;
    try {
      const url = new URL(website);
      if (url.protocol !== "https:" || !url.hostname.includes(".")) throw new Error();
      website = url.toString().replace(/\/$/, "");
    } catch {
      return { error: "Web no válida (usa una dirección https)" };
    }
    if (website.length > 200) return { error: "La web admite hasta 200 caracteres" };
  }

  const sections = body.sections && typeof body.sections === "object" ? body.sections : {};

  return {
    value: {
      tagline,
      heroTitle,
      about,
      hours,
      address,
      phone,
      staffTerm,
      social: { instagram, whatsapp, website },
      sections: {
        howItWorks: sections.howItWorks !== false,
        perks: sections.perks !== false,
      },
    },
  };
}