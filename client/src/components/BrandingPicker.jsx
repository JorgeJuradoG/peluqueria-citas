import { useEffect } from "react";
import { Check, Scissors } from "lucide-react";
import BrandIcon, { BRAND_ICONS } from "./BrandIcon";
import { Decor } from "./SalonHero";
import {
  CARDS,
  DECORS,
  DEFAULT_BRANDING,
  FONTS,
  HERO_STYLES,
  HEROES,
  PALETTES,
  PRESETS,
  RADII,
  deriveColors,
  ensureFont,
  resolveBranding,
  themeVars,
} from "../lib/theme";

function Choice({ selected, onClick, label, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={label}
      className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm transition ${
        selected
          ? "border-gold bg-gold/10 font-medium ring-2 ring-gold/30"
          : "border-sand hover:border-gold"
      }`}
    >
      {children}
    </button>
  );
}

const sameBranding = (a, b) =>
  Object.keys(DEFAULT_BRANDING).every((k) => String(a[k]).toLowerCase() === String(b[k]).toLowerCase());

const HERO_SWATCH = { dark: "#1c1917", light: "#ece5d8" };

export default function BrandingPicker({ value, onChange }) {
  const b = resolveBranding(value);
  const set = (patch) => onChange({ ...b, ...patch });

  // Carga las tipografías para poder enseñar cómo se ve cada una
  useEffect(() => {
    Object.keys(FONTS).forEach(ensureFont);
  }, []);

  const accent = b.accent.toLowerCase();
  const used = deriveColors(accent).gold;
  const adjusted = used !== accent && !PALETTES.some((p) => p.hex === accent);

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="label">Empieza con un estilo</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PRESETS.map((p) => {
            const selected = sameBranding(b, p.branding);
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => onChange({ ...p.branding })}
                aria-pressed={selected}
                className={`rounded-xl border p-3 text-left transition ${
                  selected
                    ? "border-gold bg-gold/10 ring-2 ring-gold/30"
                    : "border-sand hover:border-gold"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    className="h-4 w-4 shrink-0 rounded-full ring-1 ring-ink/20"
                    style={{ backgroundColor: p.branding.accent }}
                    aria-hidden="true"
                  />
                  <span
                    className="text-lg font-bold leading-none"
                    style={{ fontFamily: FONTS[p.branding.font].family }}
                  >
                    {p.label}
                  </span>
                </span>
                <span className="mt-1 block text-xs text-ink/70">{p.text}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-ink/60">Después puedes ajustar cada detalle.</p>
      </fieldset>

      <fieldset>
        <legend className="label">Color principal</legend>
        <div className="flex flex-wrap items-center gap-3">
          {PALETTES.map((p) => {
            const selected = accent === p.hex;
            return (
              <button
                key={p.hex}
                type="button"
                onClick={() => set({ accent: p.hex })}
                aria-pressed={selected}
                aria-label={p.name}
                title={p.name}
                style={{ backgroundColor: p.hex }}
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 border-surface shadow transition hover:scale-110 ${
                  selected ? "ring-2 ring-ink" : "ring-1 ring-ink/20"
                }`}
              >
                {selected && <Check className="h-4 w-4 text-[#1c1917]" aria-hidden="true" />}
              </button>
            );
          })}

          <label className="flex cursor-pointer items-center gap-2 rounded-full border border-sand py-1 pl-1 pr-3 text-sm transition hover:border-gold">
            <input
              type="color"
              value={b.accent}
              onChange={(e) => set({ accent: e.target.value })}
              className="h-8 w-8 cursor-pointer rounded-full border-0 bg-transparent p-0"
            />
            Otro color
          </label>
        </div>
        {adjusted && (
          <p className="mt-2 flex items-center gap-2 text-xs text-ink/70">
            <span
              className="h-3.5 w-3.5 rounded-full ring-1 ring-ink/20"
              style={{ backgroundColor: used }}
              aria-hidden="true"
            />
            Hemos ajustado el tono a {used} para que se lea bien.
          </p>
        )}
      </fieldset>

      <fieldset>
        <legend className="label">Tipografía de los títulos</legend>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {Object.entries(FONTS).map(([key, f]) => (
            <Choice key={key} selected={b.font === key} onClick={() => set({ font: key })} label={f.label}>
              <span className="flex flex-col items-center">
                <span style={{ fontFamily: f.family }} className="text-2xl font-bold leading-none">
                  Aa
                </span>
                <span className="mt-1 text-xs">{f.label}</span>
              </span>
            </Choice>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="label">Esquinas</legend>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(RADII).map(([key, r]) => (
            <Choice key={key} selected={b.radius === key} onClick={() => set({ radius: key })} label={r.label}>
              <span className="flex flex-col items-center">
                <span
                  className="block h-7 w-12 border-2 border-ink/50"
                  style={{ borderRadius: r.xl }}
                  aria-hidden="true"
                />
                <span className="mt-1 text-xs">{r.label}</span>
              </span>
            </Choice>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="label">Icono de marca</legend>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {Object.entries(BRAND_ICONS).map(([key, { label }]) => (
            <Choice key={key} selected={b.icon === key} onClick={() => set({ icon: key })} label={label}>
              <BrandIcon name={key} className="h-5 w-5 text-gold-dark" aria-hidden="true" />
            </Choice>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="label">Portada</legend>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(HEROES).map(([key, h]) => (
            <Choice key={key} selected={b.hero === key} onClick={() => set({ hero: key })} label={h.label}>
              <span className="flex flex-col items-center">
                <span
                  className="block h-7 w-12 rounded-md ring-1 ring-ink/20"
                  style={{ backgroundColor: HERO_SWATCH[key] ?? used }}
                  aria-hidden="true"
                />
                <span className="mt-1 text-xs">{h.label}</span>
              </span>
            </Choice>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-6 sm:grid-cols-2">
        <fieldset>
          <legend className="label">Decoración de la portada</legend>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(DECORS).map(([key, d]) => (
              <Choice key={key} selected={b.decor === key} onClick={() => set({ decor: key })} label={d.label}>
                <span className="text-xs">{d.label}</span>
              </Choice>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="label">Tarjetas</legend>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(CARDS).map(([key, c]) => (
              <Choice key={key} selected={b.cards === key} onClick={() => set({ cards: key })} label={c.label}>
                <span className="text-xs">{c.label}</span>
              </Choice>
            ))}
          </div>
        </fieldset>
      </div>
    </div>
  );
}

// Vista previa con la paleta clara y las variables de la marca aplicadas solo aquí dentro
export function BrandingPreview({ branding, name, tagline, heroTitle }) {
  const b = resolveBranding(branding);
  const hero = HERO_STYLES[b.hero] ?? HERO_STYLES.dark;
  const title = name?.trim() || "Tu peluquería";

  return (
    <div
      className="keep-palette overflow-hidden rounded-2xl border border-sand bg-cream text-ink shadow-sm"
      style={themeVars(b)}
      data-cards={b.cards}
      aria-hidden="true"
    >
      <div className="flex items-center justify-between gap-2 border-b border-sand px-4 py-3">
        <span className="flex min-w-0 items-center gap-2 font-display text-lg font-bold">
          <BrandIcon name={b.icon} className="h-4 w-4 shrink-0 text-gold" />
          <span className="truncate">
            {title}
            <span className="text-gold">.</span>
          </span>
        </span>
        <span className="rounded-lg bg-gold/15 px-2.5 py-1 text-xs font-medium text-gold-dark">
          Reservar
        </span>
      </div>

      <div className="space-y-3 p-4">
        <div className={`relative overflow-hidden rounded-xl px-4 py-6 text-center ${hero.container}`}>
          <Decor kind={b.decor} hero={hero} />
          <div className="relative">
            <p
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-[10px] uppercase tracking-widest ${hero.badge}`}
            >
              <BrandIcon name={b.icon} className="h-3 w-3" />
              <span className="max-w-40 truncate">{title}</span>
            </p>
            <p className="mt-3 font-display text-xl font-bold leading-snug">
              {heroTitle?.trim() || "Tu próxima cita, a un par de clics"}
            </p>
            {tagline?.trim() && <p className={`mt-2 text-xs ${hero.muted}`}>{tagline}</p>}
            <span
              className={`mt-4 inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium ${hero.primary}`}
            >
              Reservar ahora
            </span>
          </div>
        </div>

        <div className="card" style={{ padding: "0.75rem" }}>
          <div className="flex items-start justify-between">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sand text-gold-dark">
              <Scissors className="h-4 w-4" />
            </span>
            <span className="font-display text-lg text-gold-dark">15 €</span>
          </div>
          <p className="mt-2 font-semibold">Corte de pelo</p>
          <p className="text-xs text-ink/70">30 minutos</p>
        </div>

        <div className="flex gap-2">
          <span className="btn-primary">Principal</span>
          <span className="btn-outline">Secundario</span>
        </div>
      </div>
    </div>
  );
}