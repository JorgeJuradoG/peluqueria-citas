import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import BrandIcon from "./BrandIcon";
import { HERO_STYLES } from "../lib/theme";
import { termsFor } from "../lib/terms";

// Decoración de fondo de la portada
export function Decor({ kind, hero }) {
  if (kind === "none") return null;
  if (kind === "dots") {
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />
    );
  }
  return (
    <>
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl ${hero.glowA}`}
      />
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full blur-3xl ${hero.glowB}`}
      />
    </>
  );
}

export default function SalonHero({ salon, user }) {
  const b = salon.branding;
  const hero = HERO_STYLES[b.hero] ?? HERO_STYLES.dark;
  const title = salon.heroTitle || "Tu próxima cita, a un par de clics";
  const tagline =
    salon.tagline ||
    `Elige servicio, ${termsFor(salon.staffTerm).one} y hueco. Los horarios se actualizan en tiempo real, sin llamadas ni esperas.`;

  return (
    <section
      className={`${hero.keep ? "keep-palette " : ""}relative overflow-hidden rounded-3xl px-6 py-16 text-center sm:py-24 ${hero.container}`}
    >
      <Decor kind={b.decor} hero={hero} />

      <div className="relative animate-fade-up">
        <p
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-1 text-xs uppercase tracking-[0.25em] ${hero.badge}`}
        >
          <BrandIcon name={b.icon} className="h-3.5 w-3.5" aria-hidden="true" />
          {salon.name}
        </p>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold leading-tight sm:text-6xl">{title}</h1>
        <p className={`mx-auto mt-5 max-w-xl text-lg ${hero.muted}`}>{tagline}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to={user ? "/reservar" : "/login"}
            className={`inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium transition active:scale-[0.98] ${hero.primary}`}
          >
            {user ? "Reservar ahora" : "Entrar para reservar"}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <a
            href="#servicios"
            className={`inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium transition ${hero.secondary}`}
          >
            Ver servicios
          </a>
        </div>
      </div>
    </section>
  );
}