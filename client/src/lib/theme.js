const CREAM = "#faf7f2"; // fondo claro
const INK = "#1c1917"; // texto oscuro

export const DEFAULT_BRANDING = {
  accent: "#b08d57",
  font: "classic",
  radius: "soft",
  icon: "scissors",
  hero: "dark",
  decor: "glow",
  cards: "shadow",
};

// Todas cumplen el contraste mínimo; un color propio se ajusta solo
export const PALETTES = [
  { name: "Dorado", hex: "#b08d57" },
  { name: "Terracota", hex: "#d0735a" },
  { name: "Ámbar", hex: "#e0a030" },
  { name: "Salvia", hex: "#7a9a7e" },
  { name: "Turquesa", hex: "#3aa6a0" },
  { name: "Azul", hex: "#5b8fd1" },
  { name: "Violeta", hex: "#9b7fd4" },
  { name: "Rosa", hex: "#d4708f" },
];

export const FONTS = {
  classic: { label: "Clásica", family: '"Playfair Display", Georgia, serif', query: null }, // ya carga en index.html
  modern: { label: "Moderna", family: '"Montserrat", system-ui, sans-serif', query: "Montserrat:wght@600;700" },
  warm: { label: "Cálida", family: '"Lora", Georgia, serif', query: "Lora:wght@600;700" },
  elegant: {
    label: "Elegante",
    family: '"Cormorant Garamond", Georgia, serif',
    query: "Cormorant+Garamond:wght@600;700",
  },
  bold: { label: "Atrevida", family: '"Space Grotesk", system-ui, sans-serif', query: "Space+Grotesk:wght@600;700" },
};

export const RADII = {
  sharp: { label: "Rectas", md: "0.125rem", lg: "0.125rem", xl: "0.25rem", "2xl": "0.25rem", "3xl": "0.375rem" },
  soft: { label: "Suaves", md: "0.375rem", lg: "0.5rem", xl: "0.75rem", "2xl": "1rem", "3xl": "1.5rem" },
  round: { label: "Redondas", md: "0.625rem", lg: "0.875rem", xl: "1.25rem", "2xl": "1.75rem", "3xl": "2.25rem" },
};

export const HEROES = {
  dark: { label: "Oscura" },
  accent: { label: "Color" },
  light: { label: "Clara" },
};

export const DECORS = {
  glow: { label: "Brillos" },
  dots: { label: "Puntos" },
  none: { label: "Ninguna" },
};

export const CARDS = {
  shadow: { label: "Con sombra" },
  outline: { label: "Con borde" },
  flat: { label: "Planas" },
};

// Clases de cada estilo de portada. "keep" = conserva la paleta clara aunque la web esté en oscuro
export const HERO_STYLES = {
  dark: {
    keep: true,
    container: "bg-ink text-cream",
    muted: "text-cream/70",
    badge: "border-gold/40 text-gold",
    primary: "bg-gold text-[#1c1917] hover:bg-cream",
    secondary: "border border-cream/30 hover:border-gold hover:text-gold",
    glowA: "bg-gold/20",
    glowB: "bg-gold/10",
  },
  accent: {
    keep: true,
    container: "bg-gold text-ink",
    muted: "text-ink/80",
    badge: "border-ink/30 text-ink",
    primary: "bg-ink text-cream hover:bg-ink/85",
    secondary: "border border-ink/30 hover:border-ink",
    glowA: "bg-white/30",
    glowB: "bg-ink/10",
  },
  light: {
    keep: false, // sigue el modo claro/oscuro de la web
    container: "bg-sand text-ink",
    muted: "text-ink/70",
    badge: "border-gold-dark/40 text-gold-dark",
    primary: "bg-ink text-cream hover:bg-gold-dark",
    secondary: "border border-ink/20 hover:border-gold hover:text-gold-dark",
    glowA: "bg-gold/25",
    glowB: "bg-gold/10",
  },
};

// Estilos completos de partida
export const PRESETS = [
  {
    key: "classic",
    label: "Clásico",
    text: "Elegante y atemporal",
    branding: { accent: "#b08d57", font: "classic", radius: "soft", icon: "scissors", hero: "dark", decor: "glow", cards: "shadow" },
  },
  {
    key: "modern",
    label: "Moderno",
    text: "Limpio y actual",
    branding: { accent: "#5b8fd1", font: "modern", radius: "round", icon: "sparkles", hero: "light", decor: "dots", cards: "outline" },
  },
  {
    key: "barber",
    label: "Barbería",
    text: "Directo y con carácter",
    branding: { accent: "#d0735a", font: "bold", radius: "sharp", icon: "star", hero: "dark", decor: "none", cards: "flat" },
  },
  {
    key: "boutique",
    label: "Boutique",
    text: "Suave y cercano",
    branding: { accent: "#d4708f", font: "warm", radius: "round", icon: "flower", hero: "light", decor: "glow", cards: "shadow" },
  },
  {
    key: "luxury",
    label: "Lujo",
    text: "Sobrio y exclusivo",
    branding: { accent: "#e0a030", font: "elegant", radius: "sharp", icon: "crown", hero: "accent", decor: "none", cards: "outline" },
  },
];

export function resolveBranding(raw) {
  return { ...DEFAULT_BRANDING, ...(raw ?? {}) };
}

const safeAccent = (hex) => (/^#[0-9a-f]{6}$/i.test(hex) ? hex : DEFAULT_BRANDING.accent);

/* ---------- Matemática de color ---------- */
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex(rgb) {
  return "#" + rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
}

function luminance([r, g, b]) {
  const f = (c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function rgbToHsl([r, g, b]) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (d) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return [h, s, l];
}

function hslToRgb([h, s, l]) {
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue = (t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [hue(h + 1 / 3) * 255, hue(h) * 255, hue(h - 1 / 3) * 255];
}

// A partir del color elegido calcula las tres variantes que usa la web:
//  gold         -> fondos y detalles (siempre lo bastante claro para llevar texto oscuro)
//  goldDark     -> texto sobre fondo claro (contraste mínimo 4,5:1)
//  goldDarkMode -> texto sobre fondo oscuro
export function deriveColors(accentHex) {
  const [h, s, l0] = rgbToHsl(hexToRgb(safeAccent(accentHex)));
  const ink = hexToRgb(INK);
  const cream = hexToRgb(CREAM);

  let l = l0;
  while (contrast(hslToRgb([h, s, l]), ink) < 4.5 && l < 0.9) l += 0.02;
  l = Math.min(l, 0.78);

  let ld = l;
  while (contrast(hslToRgb([h, s, ld]), cream) < 4.5 && ld > 0.08) ld -= 0.02;

  return {
    gold: toHex(hslToRgb([h, s, l])),
    goldDark: toHex(hslToRgb([h, s, ld])),
    goldDarkMode: toHex(hslToRgb([h, s, Math.min(l + 0.08, 0.85)])),
  };
}

/* ---------- Aplicación del tema ---------- */
// Variables de la variante clara (también las usa la vista previa)
export function themeVars(raw) {
  const b = resolveBranding(raw);
  const { gold, goldDark } = deriveColors(b.accent);
  const font = FONTS[b.font] ?? FONTS.classic;
  const r = RADII[b.radius] ?? RADII.soft;
  return {
    "--color-gold": gold,
    "--color-gold-dark": goldDark,
    "--font-display": font.family,
    "--radius-md": r.md,
    "--radius-lg": r.lg,
    "--radius-xl": r.xl,
    "--radius-2xl": r["2xl"],
    "--radius-3xl": r["3xl"],
  };
}

const declarations = (vars) =>
  Object.entries(vars)
    .map(([k, v]) => `${k}:${v}`)
    .join(";");

// Solo se interpolan colores calculados y valores de listas cerradas: no hay entrada libre
export function themeCss(raw) {
  const b = resolveBranding(raw);
  const { gold, goldDark, goldDarkMode } = deriveColors(b.accent);
  return (
    `:root{${declarations(themeVars(b))}}` +
    `.dark{--color-gold:${gold};--color-gold-dark:${goldDarkMode}}` +
    `.keep-palette{--color-gold:${gold};--color-gold-dark:${goldDark}}`
  );
}

export function ensureFont(key) {
  const font = FONTS[key];
  if (!font?.query) return;
  const id = `font-${key}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${font.query}&display=swap`;
  document.head.appendChild(link);
}

// Icono de la pestaña: la inicial de la peluquería con el color de la marca
export function applyFavicon(name, accent) {
  const letter = (String(name ?? "").trim()[0] ?? "C").toUpperCase().replace(/[&<>"']/g, "C");
  const { gold } = deriveColors(accent);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">` +
    `<rect width="64" height="64" rx="14" fill="${gold}"/>` +
    `<text x="32" y="44" font-family="Georgia,serif" font-size="38" font-weight="700" ` +
    `text-anchor="middle" fill="${INK}">${letter}</text></svg>`;

  let link = document.querySelector('link[rel="icon"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.type = "image/svg+xml";
  link.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function applyTheme(raw, name) {
  const b = resolveBranding(raw);
  ensureFont(b.font);
  document.documentElement.dataset.cards = CARDS[b.cards] ? b.cards : "shadow";

  let el = document.getElementById("salon-theme");
  if (!el) {
    el = document.createElement("style");
    el.id = "salon-theme";
    document.head.appendChild(el);
  }
  el.textContent = themeCss(b);

  if (name) applyFavicon(name, b.accent);
}