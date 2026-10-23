import { DEFAULT_BRANDING } from "../utils/branding.js";
import { deriveColors } from "../utils/colors.js";

// Los correos no cargan fuentes web: se usa la familia más parecida
const FONT_STACKS = {
  classic: "Georgia,'Times New Roman',serif",
  elegant: "Georgia,'Times New Roman',serif",
  warm: "Georgia,'Times New Roman',serif",
  modern: "Arial,Helvetica,sans-serif",
  bold: "Arial,Helvetica,sans-serif",
};

// [esquinas de la tarjeta, esquinas del botón] en píxeles
const RADII = { sharp: [2, 2], soft: [12, 8], round: [20, 999] };

export const mapUrl = (address) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

// Todo lo que cambia entre peluquerías, ya resuelto para poner en línea en el HTML
export function emailBrand(salon) {
  const raw = typeof salon.toObject === "function" ? salon.toObject() : salon;
  const b = { ...DEFAULT_BRANDING, ...(raw.branding ?? {}) };
  const { gold, goldDark } = deriveColors(b.accent);
  const [cardRadius, buttonRadius] = RADII[b.radius] ?? RADII.soft;

  return {
    gold,
    goldDark,
    headingFont: FONT_STACKS[b.font] ?? FONT_STACKS.classic,
    cardRadius,
    buttonRadius,
    name: raw.name,
    address: raw.address ?? "",
    phone: raw.phone ?? "",
  };
}