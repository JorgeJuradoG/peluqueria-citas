import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  Link2,
  MailWarning,
  PartyPopper,
  Scissors,
  Users,
  X,
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useSalon } from "../context/SalonContext";
import { useToast } from "../context/UIContext";
import useTerms from "../hooks/useTerms";
import { Skeleton } from "../components/Skeleton";

function Stat({ icon: Icon, label, value, to, tone = "gold" }) {
  const tones = {
    gold: "bg-gold/15 text-gold-dark",
    ink: "bg-ink text-gold",
    amber: "bg-amber-100 text-amber-700",
  };
  return (
    <Link
      to={to}
      className="card group flex items-center gap-4 transition hover:-translate-y-0.5 hover:border-gold hover:shadow-md"
    >
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-3xl font-semibold leading-none">{value}</p>
        <p className="mt-1 text-sm text-ink/70">{label}</p>
      </div>
      <ArrowRight
        className="h-4 w-4 text-ink/30 transition group-hover:translate-x-0.5 group-hover:text-gold-dark"
        aria-hidden="true"
      />
    </Link>
  );
}

function Step({ number, done, current, icon: Icon, title, text, to, action }) {
  return (
    <li
      className={`card flex flex-wrap items-center gap-4 transition ${done ? "opacity-70" : ""} ${
        current ? "border-gold ring-2 ring-gold/30" : ""
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display ${
          done ? "bg-emerald-600 text-white" : "bg-ink text-cream"
        }`}
      >
        {done ? <Check className="h-5 w-5" aria-hidden="true" /> : number}
      </span>
      <div className="min-w-0 flex-1 basis-48">
        <p className={`flex items-center gap-2 font-medium ${done ? "line-through" : ""}`}>
          <Icon className="h-4 w-4 text-gold-dark" aria-hidden="true" />
          {title}
        </p>
        <p className="mt-0.5 text-sm text-ink/70">{text}</p>
      </div>
      {to && (
        <Link to={to} className={done ? "btn-outline" : "btn-primary"}>
          {done ? "Ver" : action}
        </Link>
      )}
    </li>
  );
}

export default function AdminHome() {
  const { user } = useAuth();
  const salon = useSalon();
  const toast = useToast();
  const terms = useTerms();
  const [params, setParams] = useSearchParams();
  const welcome = params.get("bienvenida") === "1";

  const nextText = [
    "crea tu primer servicio.",
    `añade a tu equipo (${terms.many}).`,
    "comparte tu enlace con tus clientes.",
  ];

  const sharedKey = `shared:${salon.slug}`;
  const [counts, setCounts] = useState(null);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(() => {
    try {
      return localStorage.getItem(sharedKey) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    Promise.all([api.get("/services"), api.get("/stylists/manage/all")]).then(([sv, st]) =>
      setCounts({
        services: sv.data.length,
        stylists: st.data.filter((s) => s.active).length,
        pending: st.data.filter((s) => s.user?.pendingInvite).length,
      })
    );
  }, []);

  const link = `${window.location.origin}/s/${salon.slug}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Enlace copiado");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(`No se pudo copiar. Tu enlace es: ${link}`);
    }
    try {
      localStorage.setItem(sharedKey, "1");
    } catch {
      /* sin almacenamiento: no pasa nada */
    }
    setShared(true);
  }

  function dismissWelcome() {
    setParams({}, { replace: true });
  }

  if (!counts) {
    return (
      <div>
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="mt-3 h-5 w-2/3" />
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <div className="mt-6 space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  const steps = [counts.services > 0, counts.stylists > 0, shared];
  const doneCount = steps.filter(Boolean).length;
  const allDone = doneCount === steps.length;
  const firstPending = steps.findIndex((s) => !s); // -1 si está todo hecho

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-4xl font-bold">Hola, {user.name}</h1>
      <p className="mt-1 text-ink/70">
        {allDone
          ? `${salon.name} está lista para recibir reservas.`
          : `Vamos a dejar lista ${salon.name} en tres pasos.`}
      </p>

      {welcome && (
        <section className="card mt-6 animate-pop border-gold bg-gold/10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold text-[#17191c]">
                <PartyPopper className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-2xl font-bold">¡{salon.name} ya está en marcha!</h2>
                <p className="mt-1 text-sm text-ink/70">
                  Tu web ya es pública. Este es el enlace que tus clientes usarán para reservar:
                </p>
              </div>
            </div>
            <button
              onClick={dismissWelcome}
              aria-label="Cerrar"
              className="rounded-lg p-1.5 text-ink/60 transition hover:bg-sand/60 hover:text-ink"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg bg-surface p-3">
            <code className="min-w-0 flex-1 break-all text-sm">{link}</code>
            <button onClick={copyLink} className="btn-primary">
              {copied ? (
                <Check className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Copy className="h-4 w-4" aria-hidden="true" />
              )}
              {copied ? "Copiado" : "Copiar"}
            </button>
            <a href={link} target="_blank" rel="noopener noreferrer" className="btn-outline">
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              Ver mi web
            </a>
          </div>

          {firstPending >= 0 && (
            <p className="mt-3 text-sm text-ink/70">
              Tu siguiente paso: <b className="text-ink">{nextText[firstPending]}</b>
            </p>
          )}
        </section>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat icon={Scissors} label="Servicios" value={counts.services} to="/admin/servicios" />
        <Stat
          icon={Users}
          label={`${terms.Many} activos`}
          value={counts.stylists}
          to="/admin/estilistas"
          tone="ink"
        />
        {counts.pending > 0 ? (
          <Stat
            icon={MailWarning}
            label="Invitaciones pendientes"
            value={counts.pending}
            to="/admin/estilistas"
            tone="amber"
          />
        ) : (
          <Stat icon={Check} label="Invitaciones pendientes" value={0} to="/admin/estilistas" />
        )}
      </div>

      {!allDone && (
        <div className="mt-8">
          <div className="flex items-center justify-between text-sm text-ink/70">
            <span>Progreso</span>
            <span>{doneCount} de {steps.length}</span>
          </div>
          <div
            className="mt-2 h-2 overflow-hidden rounded-full bg-sand"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={steps.length}
            aria-valuenow={doneCount}
          >
            <div
              className="h-full rounded-full bg-gold transition-all duration-500"
              style={{ width: `${(doneCount / steps.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      <ul className="mt-6 space-y-3">
        <Step
          number={1}
          done={steps[0]}
          current={firstPending === 0}
          icon={Scissors}
          title="Crea tu primer servicio"
          text="Por ejemplo «Corte de pelo», con su duración y su precio."
          to="/admin/servicios"
          action="Crear servicio"
        />
        <Step
          number={2}
          done={steps[1]}
          current={firstPending === 1}
          icon={Users}
          title="Añade a tu equipo"
          text={`Crea la cuenta de cada ${terms.one} y elige qué servicios ofrece.`}
          to="/admin/estilistas"
          action={`Añadir ${terms.one}`}
        />
        <li
          className={`card transition ${steps[2] ? "opacity-70" : ""} ${
            firstPending === 2 ? "border-gold ring-2 ring-gold/30" : ""
          }`}
        >
          <div className="flex flex-wrap items-center gap-4">
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display ${
                steps[2] ? "bg-emerald-600 text-white" : "bg-ink text-cream"
              }`}
            >
              {steps[2] ? <Check className="h-5 w-5" aria-hidden="true" /> : 3}
            </span>
            <div className="min-w-0 flex-1 basis-48">
              <p className={`flex items-center gap-2 font-medium ${steps[2] ? "line-through" : ""}`}>
                <Link2 className="h-4 w-4 text-gold-dark" aria-hidden="true" />
                Comparte tu enlace con los clientes
              </p>
              <p className="mt-0.5 text-sm text-ink/70">
                Pégalo en tu Instagram, WhatsApp o en la puerta del local.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg bg-sand/50 p-3">
            <code className="min-w-0 flex-1 break-all text-sm">{link}</code>
            <button onClick={copyLink} className="btn-primary">
              {copied ? (
                <Check className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Copy className="h-4 w-4" aria-hidden="true" />
              )}
              {copied ? "Copiado" : "Copiar enlace"}
            </button>
          </div>
        </li>
      </ul>

      {allDone && (
        <div className="card mt-6 animate-fade-up">
          <h2 className="text-xl font-semibold">¿Y ahora qué?</h2>
          <p className="mt-1 text-sm text-ink/70">
            Revisa las reservas que vayan entrando y ajusta horarios o días libres cuando haga
            falta.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to="/agenda" className="btn-primary">Ver la agenda</Link>
            <Link to="/admin/estilistas" className="btn-outline">Horarios del equipo</Link>
          </div>
        </div>
      )}
    </div>
  );
}