const CREAM = "#faf7f2";
const INK = "#1c1917";
const DEFAULT_ACCENT = "#b08d57";

const safeAccent = (hex) => (/^#[0-9a-f]{6}$/i.test(String(hex)) ? hex : DEFAULT_ACCENT);

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

// gold     -> fondos y botones (siempre lo bastante claro para llevar texto oscuro)
// goldDark -> texto sobre fondo claro (contraste mínimo 4,5:1)
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
  };
}