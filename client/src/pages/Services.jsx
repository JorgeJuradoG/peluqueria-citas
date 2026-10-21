import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarCheck,
  CalendarPlus,
  Clock,
  Mail,
  Scissors,
  UserRound,
  Zap,
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useSalon } from "../context/SalonContext";
import { ServiceCardSkeleton } from "../components/Skeleton";
import Reveal from "../components/Reveal";

const STEPS = [
  { icon: Scissors, title: "Elige tu servicio", text: "Corte, barba, color... con su duración y su precio a la vista." },
  { icon: UserRound, title: "Elige profesional", text: "Reserva con quien prefieras entre los que ofrecen ese servicio." },
  { icon: CalendarCheck, title: "Confirma tu hueco", text: "Ves solo los huecos libres, en tiempo real, y reservas con un clic." },
];

const PERKS = [
  { icon: Zap, title: "Tiempo real", text: "Si alguien reserva antes que tú, el hueco desaparece al instante." },
  { icon: Mail, title: "Avisos por correo", text: "Confirmación al reservar y recordatorio un día antes." },
  { icon: CalendarPlus, title: "A tu calendario", text: "Añade la cita a Google, Apple u Outlook con un botón." },
];

export default function Services() {
  const { user } = useAuth();
  const salon = useSalon();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/services")
      .then((res) => setServices(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-20">
      {/* Portada */}
      <section className="keep- palette relative overflow-hidden rounded-3xl bg-ink px-6 py-16 text-center text-cream sm:py-24">
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
            <Scissors className="h-3.5 w-3.5" aria-hidden="true" />
            {salon.name}
          </p>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold leading-tight sm:text-6xl">
            Tu próxima cita, a un par de clics
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-cream/70">
            Elige servicio, profesional y hueco. Los horarios se actualizan en tiempo real,
            sin llamadas ni esperas.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to={user ? "/reservar" : "/login"}
              className="inline-flex items-center gap-2 rounded-lg bg-gold px-6 py-3 font-medium text-ink transition hover:bg-cream active:scale-[0.98]"
            >
              {user ? "Reservar ahora" : "Entrar para reservar"}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <a
              href="#servicios"
              className="inline-flex items-center gap-2 rounded-lg border border-cream/30 px-6 py-3 font-medium transition hover:border-gold hover:text-gold"
            >
              Ver servicios
            </a>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section>
        <Reveal>
          <h2 className="text-center text-3xl font-bold">Cómo funciona</h2>
          <p className="mx-auto mt-2 max-w-md text-center text-ink/70">
            Reservar es cuestión de un minuto.
          </p>
        </Reveal>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <Reveal key={title} delay={i * 100}>
              <li className="card h-full text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gold/15 text-gold-dark">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <p className="mt-1 text-xs font-medium uppercase tracking-widest text-ink/40">
                  Paso {i + 1}
                </p>
                <h3 className="mt-2 text-xl font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-ink/70">{text}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* Servicios */}
      <section id="servicios" className="scroll-mt-24">
        <Reveal>
          <h2 className="text-3xl font-bold">Nuestros servicios</h2>
        </Reveal>

        {!loading && services.length === 0 && (
          <div className="card mt-6 text-center text-ink/70">
            Todavía no hay servicios disponibles.
          </div>
        )}

        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading && [1, 2, 3].map((n) => <ServiceCardSkeleton key={n} />)}
          {services.map((s, i) => (
            <Reveal key={s._id} delay={(i % 3) * 80}>
              <li className="card group h-full transition hover:-translate-y-1 hover:border-gold hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-sand text-gold-dark transition group-hover:bg-gold group-hover:text-white">
                    <Scissors className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <p className="font-display text-2xl text-gold-dark">{s.price} €</p>
                </div>
                <h3 className="mt-4 text-xl font-semibold">{s.name}</h3>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-ink/70">
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  {s.durationMinutes} minutos
                </p>
              </li>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* Ventajas */}
      <section>
        <ul className="grid gap-6 md:grid-cols-3">
          {PERKS.map(({ icon: Icon, title, text }, i) => (
            <Reveal key={title} delay={i * 100}>
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

      {/* Llamada final */}
      <Reveal>
        <section className="rounded-3xl bg-sand px-6 py-12 text-center">
          <h2 className="text-3xl font-bold">¿Listo para tu cita?</h2>
          <p className="mx-auto mt-2 max-w-md text-ink/70">
            Elige tu hueco ahora y recibe la confirmación en tu correo.
          </p>
          <Link
            to={user ? "/reservar" : "/login"}
            className="btn-primary mt-6 px-6 py-3 text-base"
          >
            {user ? "Reservar ahora" : "Empezar"}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </section>
      </Reveal>
    </div>
  );
}