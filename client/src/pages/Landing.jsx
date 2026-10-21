import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  Link2,
  Loader2,
  Mail,
  Scissors,
  ShieldCheck,
  Smartphone,
  Store,
  Users,
  Zap,
} from "lucide-react";
import api from "../services/api";
import Reveal from "../components/Reveal";
import ThemeToggle from "../components/ThemeToggle";
import { ErrorAlert } from "../components/FormField";

const DEMO_SLUG = "peluqueria-demo"; // la que crea el seed

const STEPS = [
  { icon: Store, title: "Crea tu peluquería", text: "Nombre, dirección web y tu cuenta de administrador. Dos minutos." },
  { icon: Users, title: "Añade servicios y equipo", text: "Duraciones, precios, horarios y días libres de cada estilista." },
  { icon: Link2, title: "Comparte tu enlace", text: "Tus clientes reservan solos, a cualquier hora, desde el móvil." },
];

const FEATURES = [
  { icon: Zap, title: "Reservas en tiempo real", text: "Si alguien reserva un hueco, desaparece al instante para los demás." },
  { icon: CalendarDays, title: "Agenda semanal", text: "Cada estilista ve su semana, y tú la de todo el equipo." },
  { icon: Mail, title: "Avisos por correo", text: "Confirmación, cambios, cancelaciones y recordatorio un día antes." },
  { icon: ShieldCheck, title: "Datos separados", text: "Cada peluquería tiene los suyos: nadie ve nada de otro negocio." },
  { icon: Users, title: "Todo el equipo", text: "Invita a tus estilistas por correo: ellos eligen su contraseña." },
  { icon: Smartphone, title: "Hecha para el móvil", text: "Rápida, con modo oscuro y pensada para usarse con una mano." },
];

export default function Landing() {
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  async function goToSalon(e) {
    e.preventDefault();
    setError("");
    if (slug.length < 3) return setError("La dirección tiene al menos 3 caracteres");

    setChecking(true);
    try {
      await api.get(`/salons/${slug}`);
      window.location.href = `/s/${slug}`;
    } catch (err) {
      setError(
        err.response?.status === 404
          ? "No existe ninguna peluquería con esa dirección"
          : "No se pudo conectar con el servidor"
      );
      setChecking(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-sand">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight">
            <Scissors className="h-5 w-5 text-gold" aria-hidden="true" />
            Citas<span className="text-gold">.</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/crear-peluqueria" className="btn-primary">
              <Store className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Crear mi peluquería</span>
              <span className="sm:hidden">Crear</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 space-y-20 px-4 py-10">
        {/* Portada */}
        <section className="keep-palette relative overflow-hidden rounded-3xl bg-ink px-6 py-16 text-center text-cream sm:py-24">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold/20 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-gold/10 blur-3xl"
          />
          <div className="relative animate-fade-up">
            <p className="inline-flex items-center gap-2 rounded-full border border-gold/40 px-4 py-1 text-xs uppercase tracking-[0.25em] text-gold">
              <Zap className="h-3.5 w-3.5" aria-hidden="true" />
              Gestión de citas en tiempo real
            </p>
            <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold leading-tight sm:text-6xl">
              Las reservas de tu peluquería, sin llamadas ni esperas
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-cream/70">
              Crea tu peluquería, da de alta a tu equipo y comparte un enlace. Tus clientes
              reservan solos y tu agenda se llena sola.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/crear-peluqueria"
                className="inline-flex items-center gap-2 rounded-lg bg-gold px-6 py-3 font-medium text-ink transition hover:bg-cream active:scale-[0.98]"
              >
                Crear mi peluquería
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <a
                href={`/s/${DEMO_SLUG}`}
                className="inline-flex items-center gap-2 rounded-lg border border-cream/30 px-6 py-3 font-medium transition hover:border-gold hover:text-gold"
              >
                Ver una demo
              </a>
            </div>
          </div>
        </section>

        {/* Cómo empezar */}
        <section>
          <Reveal>
            <h2 className="text-center text-3xl font-bold">Empieza en tres pasos</h2>
          </Reveal>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <Reveal key={title} delay={i * 100}>
                <li className="card h-full text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gold/15 text-gold-dark">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <p className="mt-1 text-xs font-medium uppercase tracking-widest text-ink/60">
                    Paso {i + 1}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold">{title}</h3>
                  <p className="mt-2 text-sm text-ink/70">{text}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </section>

        {/* Ventajas */}
        <section>
          <Reveal>
            <h2 className="text-center text-3xl font-bold">Todo lo que necesita tu peluquería</h2>
          </Reveal>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }, i) => (
              <Reveal key={title} delay={(i % 3) * 100}>
                <li className="flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ink text-gold">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <p className="mt-1 text-sm text-ink/70">{text}</p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ul>
        </section>

        {/* Entrar en una peluquería */}
        <Reveal>
          <form onSubmit={goToSalon} className="card mx-auto max-w-xl" noValidate>
            <h2 className="text-2xl font-bold">¿Ya tienes una peluquería?</h2>
            <p className="mt-1 text-sm text-ink/70">Escribe su dirección para entrar.</p>

            <label htmlFor="slug" className="label mt-4">
              Dirección de la peluquería
            </label>
            <div className="flex flex-wrap gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-1">
                <span className="text-sm text-ink/60">/s/</span>
                <input
                  id="slug"
                  className="input"
                  placeholder="peluqueria-lola"
                  value={slug}
                  onChange={(e) =>
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                  }
                  autoComplete="off"
                />
              </div>
              <button className="btn-primary" disabled={checking}>
                {checking ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                )}
                Entrar
              </button>
            </div>
            {error && (
              <div className="mt-3">
                <ErrorAlert>{error}</ErrorAlert>
              </div>
            )}
          </form>
        </Reveal>
      </main>

      <footer className="border-t border-sand">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-ink/70">
          <p className="flex items-center gap-2">
            <Scissors className="h-4 w-4 text-gold" aria-hidden="true" />
            Citas · © {new Date().getFullYear()}
          </p>
          <Link to="/crear-peluqueria" className="transition hover:text-gold-dark">
            Crear mi peluquería
          </Link>
        </div>
      </footer>
    </div>
  );
}