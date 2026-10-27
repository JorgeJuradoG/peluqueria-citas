import { useState } from "react";
import {
  CalendarDays,
  CalendarPlus,
  Check,
  Mail,
  TrendingUp,
} from "lucide-react";
import Avatar from "../Avatar";
import BrandIcon from "../BrandIcon";
import CountUp from "../CountUp";
import StatusBadge from "../StatusBadge";
import BrowserFrame from "./BrowserFrame";

/* ---------- 1. Lo que ve el cliente ---------- */
function ClientMock() {
  return (
    <div className="space-y-4 p-5 text-sm" aria-hidden="true">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white">
          <Check className="h-3 w-3" />
        </span>
        <span className="font-medium">¡Cita reservada!</span>
      </div>

      <div className="animate-pop rounded-xl border border-sand bg-sand/40 p-4">
        <p className="font-display text-lg font-semibold">Jueves 12 de noviembre, 11:30</p>
        <p className="mt-2 flex items-center gap-2 text-ink/70">
          <Avatar name="Marta" size="sm" />
          Corte de pelo con Marta · 15 €
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="btn-primary">Añadir al calendario</span>
        <span className="btn-outline">Reprogramar</span>
      </div>

      <div className="rounded-xl border border-sand p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium">Viernes 20 de noviembre, 17:00</p>
          <StatusBadge status="confirmed" />
        </div>
        <p className="mt-1 text-xs text-ink/70">Arreglo de barba con Luis</p>
      </div>
    </div>
  );
}

/* ---------- 2. La agenda semanal ---------- */
const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie"];
const HOURS = [9, 10, 11, 12, 13, 14];
const TONE = {
  done: "bg-stone-500 text-white",
  confirmed: "bg-ink text-cream",
  pending: "bg-amber-700 text-white",
};
// d = día, s = hora de inicio (en horas desde las 9:00), l = duración en horas
const EVENTS = [
  { d: 0, s: 1, l: 1, t: "done", label: "Ana · Corte" },
  { d: 0, s: 3.5, l: 1, t: "confirmed", label: "Pablo · Tinte" },
  { d: 1, s: 0, l: 0.5, t: "done", label: "Sofía" },
  { d: 1, s: 2, l: 1, t: "confirmed", label: "Carlos · Barba" },
  { d: 1, s: 4, l: 0.5, t: "pending", label: "Lucía" },
  { d: 2, s: 1.5, l: 0.5, t: "confirmed", label: "Ana" },
  { d: 2, s: 3, l: 1.5, t: "confirmed", label: "Elena · Color" },
  { d: 3, s: 0.5, l: 1, t: "done", label: "Pablo · Tinte" },
  { d: 3, s: 2.5, l: 0.5, t: "pending", label: "Sofía" },
  { d: 4, s: 1, l: 0.5, t: "confirmed", label: "Carlos" },
  { d: 4, s: 2, l: 1, t: "confirmed", label: "Lucía · Peinado" },
];

function AgendaMock() {
  return (
    <div className="overflow-x-auto p-5" aria-hidden="true">
      <div className="grid min-w-[28rem] grid-cols-[2.5rem_repeat(5,minmax(0,1fr))] gap-x-1 text-[11px]">
        <div />
        {DAYS.map((d) => (
          <div key={d} className="pb-2 text-center font-medium text-ink/70">
            {d}
          </div>
        ))}

        <div className="relative h-52">
          {HOURS.map((h, i) => (
            <span
              key={h}
              className="absolute left-0 -translate-y-1/2 text-ink/60"
              style={{ top: `${(i / HOURS.length) * 100}%` }}
            >
              {h}:00
            </span>
          ))}
        </div>

        {DAYS.map((d, di) => (
          <div key={d} className="relative h-52 rounded-md border border-sand bg-surface">
            {HOURS.slice(1).map((h, i) => (
              <span
                key={h}
                className="absolute inset-x-0 border-t border-sand/70"
                style={{ top: `${((i + 1) / HOURS.length) * 100}%` }}
              />
            ))}
            {EVENTS.filter((e) => e.d === di).map((e, i) => (
              <span
                key={`${e.s}-${e.label}`}
                style={{
                  top: `${(e.s / HOURS.length) * 100}%`,
                  height: `calc(${(e.l / HOURS.length) * 100}% - 2px)`,
                  animationDelay: `${(di * 3 + i) * 60}ms`,
                }}
                className={`absolute inset-x-0.5 animate-pop overflow-hidden rounded px-1 py-0.5 font-medium leading-tight ${TONE[e.t]}`}
              >
                {e.label}
              </span>
            ))}
          </div>
        ))}
      </div>

      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink/70">
        <li className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-stone-500" /> Completada
        </li>
        <li className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-ink" /> Confirmada
        </li>
        <li className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-amber-700" /> Pendiente
        </li>
      </ul>
    </div>
  );
}

/* ---------- 3. Estadísticas ---------- */
const BARS = [4, 6, 3, 7, 5, 8, 6, 9, 7, 5, 8, 10, 6, 7];

function StatsMock() {
  const kpis = [
    { label: "Citas", value: 48, delta: "+12%" },
    {
      label: "Ingresos",
      value: 1240,
      format: (n) => `${Math.round(n)} €`,
      delta: "+8%",
    },
    {
      label: "Ocupación",
      value: 72,
      format: (n) => `${Math.round(n)}%`,
      delta: "+5%",
    },
  ];

  return (
    <div className="space-y-4 p-5" aria-hidden="true">
      <div className="grid grid-cols-3 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="min-w-0 rounded-xl border border-sand p-3">
            <p className="truncate text-xs text-ink/70">{k.label}</p>
            <p className="mt-1 font-display text-2xl font-semibold leading-none">
              <CountUp value={k.value} format={k.format} />
            </p>
            <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
              <TrendingUp className="h-3 w-3" />
              {k.delta}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-sand p-4">
        <p className="text-xs font-medium text-ink/70">Citas por día</p>
        <div className="mt-3 flex h-28 items-end gap-1 border-b border-sand">
          {BARS.map((v, i) => (
            <div
              key={i}
              style={{ height: `${v * 10}%`, animationDelay: `${i * 40}ms` }}
              className="flex-1 origin-bottom animate-grow-up rounded-t bg-gold"
            />
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-sand p-4">
        <p className="text-xs font-medium text-ink/70">Servicios más pedidos</p>
        {[
          ["Corte de pelo", 90],
          ["Tinte", 55],
          ["Arreglo de barba", 35],
        ].map(([name, pct], i) => (
          <div key={name} className="mt-3">
            <p className="text-xs font-medium">{name}</p>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-sand">
              <div
                style={{ width: `${pct}%`, animationDelay: `${i * 120}ms` }}
                className="h-full origin-left animate-grow-x rounded-full bg-gold"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- 4. El correo de confirmación ---------- */
function EmailMock() {
  return (
    <div className="keep-palette bg-sand/40 p-5" aria-hidden="true">
      <p className="mb-3 text-center text-[11px] text-ink/60">
        De: Peluquería Lola · Para: Ana · Cita confirmada
      </p>
      <div className="mx-auto max-w-sm animate-pop rounded-xl border border-sand border-t-[6px] border-t-gold bg-white p-5 text-ink">
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-gold-dark">
          <BrandIcon name="scissors" className="h-3 w-3" />
          Peluquería Lola
        </p>
        <p className="mt-2 font-display text-xl font-bold">Tu cita está confirmada</p>
        <p className="mt-3 text-sm">Hola Ana, te esperamos:</p>
        <dl className="mt-2 space-y-1.5 text-sm">
          {[
            ["Cuándo", "jueves 12 de noviembre a las 11:30"],
            ["Servicio", "Corte de pelo (30 min)"],
            ["Con", "Marta"],
            ["Dónde", "Calle Mayor 12, Madrid"],
          ].map(([k, v]) => (
            <div key={k} className="flex gap-3">
              <dt className="w-16 shrink-0 text-ink/60">{k}</dt>
              <dd className="min-w-0 font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        <span className="mt-4 inline-block rounded-lg bg-gold px-4 py-2 text-sm font-bold text-[#17191c]">
          Ver o cambiar mi cita
        </span>
      </div>
    </div>
  );
}

/* ---------- El recorrido ---------- */
const TABS = [
  {
    key: "clientes",
    icon: CalendarPlus,
    title: "Tus clientes, autónomos",
    text: "Reservan, cambian o cancelan sus citas solos, y las añaden a su calendario.",
    url: "/mis-citas",
    Mock: ClientMock,
  },
  {
    key: "agenda",
    icon: CalendarDays,
    title: "Una agenda por estilista",
    text: "La semana de cada estilista, con las citas por estado. Se actualiza sola.",
    url: "/agenda",
    Mock: AgendaMock,
  },
  {
    key: "numeros",
    icon: TrendingUp,
    title: "Tu negocio, con números",
    text: "Citas, ingresos, servicios más pedidos y ocupación del equipo.",
    url: "/admin/estadisticas",
    Mock: StatsMock,
  },
  {
    key: "avisos",
    icon: Mail,
    title: "Avisos que trabajan por ti",
    text: "Correos con tu marca: confirmación, cambios y recordatorio el día anterior.",
    url: "Bandeja de entrada",
    Mock: EmailMock,
  },
];

export default function ProductTour() {
  const [key, setKey] = useState(TABS[0].key);
  const tab = TABS.find((t) => t.key === key);
  const Mock = tab.Mock;
  const isUrl = tab.url.startsWith("/");

  return (
    <div className="mt-12 grid grid-cols-1 items-start gap-8 lg:grid-cols-[20rem_minmax(0,1fr)]">
      <div
        role="group"
        aria-label="Qué incluye"
        className="-mx-1 flex min-w-0 gap-2 overflow-x-auto px-1 pb-2 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0"
      >
        {TABS.map(({ key: k, icon: Icon, title, text }) => (
          <button
            key={k}
            onClick={() => setKey(k)}
            aria-pressed={key === k}
            className={`flex shrink-0 items-start gap-3 rounded-xl border p-3 text-left transition lg:p-4 ${
              key === k
                ? "border-gold bg-gold/10 ring-2 ring-gold/30"
                : "border-sand bg-surface hover:border-gold"
            }`}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink text-gold">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-semibold lg:text-base">{title}</span>
              <span className="mt-1 hidden text-sm text-ink/70 lg:block">{text}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="min-w-0">
        <BrowserFrame
          url={isUrl ? `${window.location.host}/s/peluqueria-lola${tab.url}` : tab.url}
        >
          <div key={key} className="animate-fade-in">
            <Mock />
          </div>
        </BrowserFrame>
        <p className="mt-3 text-center text-xs text-ink/60">
          Ilustración con datos de ejemplo.
        </p>
      </div>
    </div>
  );
}