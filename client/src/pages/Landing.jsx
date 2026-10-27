import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  CalendarPlus,
  Check,
  ChevronDown,
  Loader2,
  Mail,
  Palette,
  Scissors,
  Users,
  Zap,
} from "lucide-react";
import api from "../services/api";
import PlatformLayout from "../components/platform/PlatformLayout";
import LiveSlots from "../components/platform/LiveSlots";
import ProductTour from "../components/platform/ProductTour";
import Reveal from "../components/Reveal";
import { BrandingPreview } from "../components/BrandingPicker";
import { ErrorAlert } from "../components/FormField";
import { FONTS, PRESETS, ensureFont } from "../lib/theme";
import { DEMO_SLUG, FAQ, PLANS, PRODUCT_NAME } from "../lib/brand";

const FEATURES = [
  {
    icon: Zap,
    title: "Reservas en tiempo real",
    text: "Cuando alguien reserva, el hueco desaparece al instante para los demás. Nada de dobles citas.",
  },
  {
    icon: CalendarDays,
    title: "Agenda para cada estilista",
    text: "Vista semanal y diaria con las citas por estado. Se actualiza sola, sin recargar.",
  },
  {
    icon: Mail,
    title: "Avisos por correo",
    text: "Confirmación al reservar, aviso si cambia o se cancela y recordatorio el día anterior.",
  },
  {
    icon: Palette,
    title: "Tu imagen, no la nuestra",
    text: "Color, tipografía, estilo, tu eslogan, tu horario y tus redes. Tu web se ve como tu negocio.",
  },
  {
    icon: Users,
    title: "Todo tu equipo",
    text: "Invita a cada estilista por correo. Cada uno tiene sus servicios, su horario y sus días libres.",
  },
  {
    icon: CalendarPlus,
    title: "Tus clientes, autónomos",
    text: "Reservan, cambian o cancelan sus citas solos, y las añaden a su calendario con un botón.",
  },
];

const STEPS = [
  {
    icon: Scissors,
    title: "Crea tu peluquería",
    text: "Nombre, dirección web, estilo y tu cuenta de administrador. Con vista previa en vivo.",
  },
  {
    icon: Users,
    title: "Añade servicios y equipo",
    text: "Duraciones, precios y horarios. Cada estilista recibe una invitación para activar su cuenta.",
  },
  {
    icon: CalendarCheck,
    title: "Comparte tu enlace",
    text: "Ponlo en Instagram, WhatsApp o en la puerta del local. Tus clientes reservan solos.",
  },
];

function SectionTitle({ id, kicker, title, text }) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      {kicker && (
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-dark">{kicker}</p>
      )}
      <h2 id={id} className="mt-2 text-3xl font-bold sm:text-4xl">{title}</h2>
      {text && <p className="mt-3 text-lg text-ink/70">{text}</p>}
    </Reveal>
  );
}

function BrandShowcase() {
  const [key, setKey] = useState(PRESETS[0].key);
  const preset = PRESETS.find((p) => p.key === key);

  useEffect(() => {
    Object.keys(FONTS).forEach(ensureFont);
  }, []);

  return (
    <div className="mt-12 grid grid-cols-1 items-center gap-8 lg:grid-cols-[1fr_24rem]">
      <div>
        <p className="label">Elige un estilo de partida</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => setKey(p.key)}
              aria-pressed={key === p.key}
              className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                key === p.key
                  ? "border-gold bg-gold/10 ring-2 ring-gold/30"
                  : "border-sand hover:border-gold"
              }`}
            >
              <span
                className="h-5 w-5 shrink-0 rounded-full ring-1 ring-ink/20"
                style={{ backgroundColor: p.branding.accent }}
                aria-hidden="true"
              />
              <span>
                <span
                  className="block text-xl font-bold leading-none"
                  style={{ fontFamily: FONTS[p.branding.font].family }}
                >
                  {p.label}
                </span>
                <span className="mt-1 block text-sm text-ink/70">{p.text}</span>
              </span>
            </button>
          ))}
        </div>
        <p className="mt-4 text-sm text-ink/70">
          Y después puedes ajustar cada detalle: color, tipografía, esquinas, portada, decoración y
          tarjetas.
        </p>
      </div>

      <div className="mx-auto w-full max-w-sm">
        <BrandingPreview
          branding={preset.branding}
          name="Tu peluquería"
          tagline="Aquí va tu eslogan"
        />
      </div>
    </div>
  );
}

function Pricing() {
  return (
    <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
      {PLANS.map((plan, i) => (
        <Reveal key={plan.key} delay={i * 100}>
          <div
            className={`card flex h-full flex-col ${
              plan.highlight ? "border-gold ring-2 ring-gold/30" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-2xl font-bold">{plan.name}</h3>
              {plan.soon && (
                <span className="rounded-full bg-sand px-2.5 py-0.5 text-xs font-medium text-ink/70">
                  Próximamente
                </span>
              )}
              {plan.highlight && (
                <span className="rounded-full bg-gold/20 px-2.5 py-0.5 text-xs font-medium text-gold-dark">
                  Disponible ya
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-ink/70">{plan.text}</p>
            <p className="mt-5">
              <span className="font-display text-5xl font-bold">{plan.price}</span>{" "}
              <span className="text-sm text-ink/70">{plan.period}</span>
            </p>
            <ul className="mt-6 flex-1 space-y-3 text-sm">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold-dark" aria-hidden="true" />
                  {f}
                </li>
              ))}
            </ul>
            {plan.to ? (
              <Link to={plan.to} className="btn-primary mt-8 py-3">
                {plan.cta}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            ) : (
              <button className="btn-outline mt-8 py-3" disabled>
                Próximamente
              </button>
            )}
          </div>
        </Reveal>
      ))}
    </div>
  );
}

function Faq() {
  return (
    <div className="mx-auto mt-10 max-w-3xl space-y-3">
      {FAQ.map(({ q, a }) => (
        <details key={q} className="card group p-0">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-medium [&::-webkit-details-marker]:hidden">
            {q}
            <ChevronDown
              className="h-5 w-5 shrink-0 text-ink/50 transition group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <p className="px-5 pb-5 text-ink/70">{a}</p>
        </details>
      ))}
    </div>
  );
}

function SalonAccess() {
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
    <form onSubmit={goToSalon} className="card mx-auto max-w-xl" noValidate>
      <h2 className="text-2xl font-bold">¿Ya tienes tu peluquería?</h2>
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
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
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
  );
}

export default function Landing() {
  useEffect(() => {
    document.title = `${PRODUCT_NAME} · Reservas online para peluquerías y barberías`;
  }, []);

  return (
    <PlatformLayout>
      {/* Portada */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-gold/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-32 top-1/2 h-80 w-80 rounded-full bg-gold/10 blur-3xl"
        />

        <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 py-16 lg:grid-cols-2 lg:py-24">
          <div className="min-w-0 animate-fade-up">
            <p className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark">
              <Zap className="h-3.5 w-3.5" aria-hidden="true" />
              Reservas en tiempo real
            </p>
            <h1 className="mt-6 text-4xl font-bold leading-[1.1] sm:text-6xl">
              Llena tu agenda <em>sin coger</em> el teléfono
            </h1>
            <p className="mt-6 max-w-xl text-lg text-ink/70">
              Tus clientes reservan solos desde el móvil, ven solo los huecos libres y reciben su
              recordatorio. Tú te dedicas a lo tuyo.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/crear-peluqueria" className="btn-primary px-6 py-3 text-base">
                Crear mi peluquería
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <a href={`/s/${DEMO_SLUG}`} className="btn-outline px-6 py-3 text-base">
                Ver demo en vivo
              </a>
            </div>

            <ul className="mt-8 space-y-2 text-sm text-ink/70">
              {[
                "Tus clientes no instalan nada",
                "Tu web con tu propia imagen",
                "Listo en unos minutos",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-gold-dark" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="min-w-0 animate-fade-up [animation-delay:150ms]">
            <LiveSlots />
          </div>
        </div>
      </section>

      {/* Producto por dentro */}
      <section id="producto" className="scroll-mt-24 bg-sand/40 px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <SectionTitle
            kicker="El producto"
            title="Mira cómo se ve por dentro"
            text="Lo que ven tus clientes, lo que ve tu equipo y lo que ves tú."
          />
          <ProductTour />
        </div>
      </section>

      {/* Funciones */}
      <section id="funciones" className="scroll-mt-24 px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <SectionTitle
            kicker="Funciones"
            title="Todo lo que necesita tu peluquería"
            text="Pensada para el día a día de un salón, sin complicaciones."
          />
          <ul className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }, i) => (
              <Reveal key={title} delay={(i % 3) * 100}>
                <li className="card h-full transition hover:-translate-y-1 hover:border-gold hover:shadow-md">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink text-gold">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-xl font-semibold">{title}</h3>
                  <p className="mt-2 text-sm text-ink/70">{text}</p>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="scroll-mt-24 bg-sand/40 px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <SectionTitle kicker="Cómo funciona" title="En marcha en tres pasos" />
          <ol className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
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
        </div>
      </section>

      {/* Tu marca */}
      <section id="marca" className="scroll-mt-24 px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <SectionTitle
            kicker="Tu marca"
            title="Que se vea como tu negocio"
            text="Cada peluquería tiene su propia imagen. Prueba los estilos y mira cómo queda."
          />
          <BrandShowcase />
        </div>
      </section>

      {/* Precios */}
      <section id="precios" className="scroll-mt-24 bg-sand/40 px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <SectionTitle
            kicker="Precios"
            title="Empieza gratis"
            text="Crea tu peluquería hoy. Los planes de pago llegarán más adelante."
          />
          <Pricing />
        </div>
      </section>

      {/* Preguntas */}
      <section id="preguntas" className="scroll-mt-24 px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <SectionTitle kicker="Preguntas frecuentes" title="Lo que suelen preguntar" />
          <Faq />
        </div>
      </section>

      {/* Llamada final */}
      <section className="px-4 pb-20">
        <div className="keep-palette relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-ink px-6 py-16 text-center text-cream">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold/20 blur-3xl"
          />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl font-bold sm:text-5xl">
              Tu próxima cita puede estar reservada esta noche
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-cream/70">
              Crea tu peluquería en unos minutos y comparte el enlace con tus clientes.
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
                Ver demo
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Acceso */}
      <section className="px-4 pb-20">
        <SalonAccess />
      </section>
    </PlatformLayout>
  );
}