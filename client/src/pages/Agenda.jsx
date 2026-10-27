import { useEffect, useRef, useState } from "react";
import {
  Ban,
  CalendarCheck,
  CalendarDays,
  CalendarX,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Euro,
  Hourglass,
  List,
  Mail,
  Scissors,
  StickyNote,
  Timer,
  Users,
  X,
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useConfirm, useToast } from "../context/UIContext";
import { useSalon } from "../context/SalonContext";
import { todayISO } from "../lib/dates";
import useStylistSocket from "../hooks/useStylistSocket";
import useTerms from "../hooks/useTerms";
import StatusBadge from "../components/StatusBadge";
import Modal from "../components/Modal";

const OPEN = ["pending", "confirmed"];
const PX_PER_HOUR = 96; // alto de una hora en la parrilla
const RAIL = 56; // ancho de la columna de horas

// Bloques de color sólido: tapan por completo las líneas de la rejilla
const BLOCK = {
  confirmed:
    "border-gold-dark bg-gold text-[#17191c] hover:brightness-95",
  pending:
    "border-amber-600 bg-amber-400 text-[#17191c] hover:brightness-95",
  completed:
    "border-stone-400 bg-sand text-ink/70 hover:brightness-95",
};
const STATUS_LABELS = {
  confirmed: "Confirmada",
  pending: "Pendiente",
  completed: "Completada",
};

// Líneas de la rejilla: una por hora y otra, más suave, por media hora
const GRID_LINES = {
  backgroundImage: [
    "linear-gradient(to bottom, color-mix(in srgb, currentColor 14%, transparent) 0 1px, transparent 1px)",
    "linear-gradient(to bottom, color-mix(in srgb, currentColor 6%, transparent) 0 1px, transparent 1px)",
  ].join(","),
  backgroundSize: `100% ${PX_PER_HOUR}px, 100% ${PX_PER_HOUR}px`,
  backgroundPosition: `0 0, 0 ${PX_PER_HOUR / 2}px`,
};

/* ───────────── utilidades ───────────── */

const euros = (n) =>
  `${(Math.round(n * 100) / 100).toLocaleString("es-ES", { maximumFractionDigits: 2 })} €`;

function addDays(iso, n) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// Lunes de la semana a la que pertenece una fecha AAAA-MM-DD
function mondayOf(iso) {
  const dow = (new Date(`${iso}T00:00:00Z`).getUTCDay() + 6) % 7;
  return addDays(iso, -dow);
}

function longDate(iso) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

function weekdayShort(iso) {
  return new Date(`${iso}T00:00:00Z`)
    .toLocaleDateString("es-ES", { weekday: "short", timeZone: "UTC" })
    .replace(".", "");
}

function rangeLabel(days) {
  const f = (iso, withYear) =>
    new Date(`${iso}T00:00:00Z`).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      ...(withYear ? { year: "numeric" } : {}),
      timeZone: "UTC",
    });
  return `${f(days[0])} – ${f(days[days.length - 1], true)}`;
}

// Minutos desde medianoche, en la zona horaria de la peluquería
function minutesOfDay(date, tz) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(date));
  const get = (type) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return get("hour") * 60 + get("minute");
}

// Fecha AAAA-MM-DD de un instante, en la zona horaria de la peluquería
function dayOf(date, tz) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date(date));
}

const hm = (min) =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

function fmtDuration(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
}

function useClock(ms = 30000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

/* ───────────── piezas pequeñas ───────────── */

function Initials({ name = "", size = "md" }) {
  const text =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "?";
  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
  };
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full bg-gold/20 font-semibold text-ink ${sizes[size]}`}
    >
      {text}
    </span>
  );
}

function Legend() {
  return (
    <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink/70">
      {Object.entries(STATUS_LABELS).map(([status, label]) => (
        <li key={status} className="flex items-center gap-2">
          <span className={`h-3.5 w-5 rounded-sm border-l-4 ${BLOCK[status]}`} />
          {label}
        </li>
      ))}
    </ul>
  );
}

function EmptyState({ icon: Icon, title, text }) {
  return (
    <div className="card mt-6 flex flex-col items-center py-10 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-sand text-ink/40">
        <Icon className="h-7 w-7" aria-hidden="true" />
      </span>
      <p className="mt-3 text-lg font-semibold">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-ink/70">{text}</p>}
    </div>
  );
}

function DetailRow({ icon: Icon, children }) {
  return (
    <li className="flex items-start gap-3 text-sm">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-ink/40" aria-hidden="true" />
      <span className="min-w-0 break-words">{children}</span>
    </li>
  );
}

function Tile({ icon: Icon, label, value, hint, tone, progress }) {
  const tones = {
    ink: "bg-ink text-cream",
    green: "bg-emerald-500/15 text-emerald-600",
    amber: "bg-amber-500/15 text-amber-600",
    gold: "bg-gold/20 text-gold-dark",
  };
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-ink/60">{label}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tones[tone]}`}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-2 font-display text-3xl font-semibold leading-none">{value}</p>
      {progress != null ? (
        <div
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-sand"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-gold transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : null}
      {hint && <p className="mt-2 truncate text-xs text-ink/60">{hint}</p>}
    </div>
  );
}

function Summary({ appointments }) {
  const done = appointments.filter((a) => a.status === "completed");
  const open = appointments.filter((a) => OPEN.includes(a.status));
  const sum = (list) => list.reduce((t, a) => t + (a.service?.price ?? 0), 0);
  const minutes = appointments.reduce((t, a) => t + (a.service?.durationMinutes ?? 0), 0);
  const pct = appointments.length ? (done.length / appointments.length) * 100 : 0;

  return (
    <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Tile
        icon={CalendarCheck}
        label="Citas"
        tone="ink"
        value={appointments.length}
        progress={pct}
        hint={`${done.length} completadas`}
      />
      <Tile icon={Hourglass} label="Por atender" tone="amber" value={open.length} />
      <Tile icon={Timer} label="Tiempo reservado" tone="gold" value={fmtDuration(minutes)} />
      <Tile
        icon={Euro}
        label="Ingresos"
        tone="green"
        value={euros(sum(done))}
        hint={open.length > 0 ? `+${euros(sum(open))} previstos` : undefined}
      />
    </div>
  );
}

/* ───────────── tarjeta «Ahora / Siguiente» ───────────── */

function FocusCard({ appointments, now, timezone, onOpen, onComplete }) {
  const current = appointments.find(
    (a) => OPEN.includes(a.status) && new Date(a.start) <= now && new Date(a.end) > now
  );
  const next = appointments.find((a) => OPEN.includes(a.status) && new Date(a.start) > now);
  const focus = current ?? next;

  let label = "";
  let line = "";
  let progress = null;

  if (current) {
    label = "En curso";
    const left = Math.max(1, Math.ceil((new Date(current.end) - now) / 60000));
    line = `Termina en ${fmtDuration(left)}`;
    const total = new Date(current.end) - new Date(current.start);
    progress = Math.min(100, Math.max(0, ((now - new Date(current.start)) / total) * 100));
  } else if (next) {
    label = "Siguiente cita";
    const until = Math.max(1, Math.ceil((new Date(next.start) - now) / 60000));
    line = `Empieza en ${fmtDuration(until)}`;
  }

  return (
    <div
      className="relative mt-6 overflow-hidden rounded-2xl p-5 shadow-sm sm:p-6"
      style={{ background: "linear-gradient(135deg,#17191c 0%,#24272c 100%)", color: "#ffffff" }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-gold/25 blur-3xl"
      />

      {focus ? (
        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold">
              <span className="relative flex h-2 w-2">
                {current && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-75" />
                )}
                <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
              </span>
              {label}
            </p>
            <p className="mt-2 truncate font-display text-3xl font-semibold leading-tight">
              {focus.client?.name}
            </p>
            <p className="mt-1 text-sm opacity-80">
              {focus.service?.name} · {focus.service?.durationMinutes} min ·{" "}
              {hm(minutesOfDay(focus.start, timezone))} – {hm(minutesOfDay(focus.end, timezone))}
            </p>
            <p className="mt-1 text-sm font-medium text-gold">{line}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onOpen(focus)}
              className="rounded-lg border border-white/25 px-4 py-2 text-sm font-medium transition hover:bg-white/10"
            >
              Detalles
            </button>
            {current && (
              <button
                onClick={() => onComplete(current)}
                className="flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-[#17191c] transition hover:brightness-110"
              >
                <CheckCheck className="h-4 w-4" aria-hidden="true" />
                Completar
              </button>
            )}
          </div>

          {progress != null && (
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-gold transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-wider text-gold">Hoy</p>
          <p className="mt-2 font-display text-2xl font-semibold">
            {appointments.length ? "Jornada terminada" : "Agenda libre"}
          </p>
          <p className="mt-1 text-sm opacity-80">
            {appointments.length
              ? "No quedan más citas por atender hoy."
              : "Todavía no hay citas para hoy."}
          </p>
        </div>
      )}
    </div>
  );
}

/* ───────────── parrilla horaria (1 día o 7) ───────────── */

function TimeGrid({ days, appointments, timezone, now, today, onOpen, onPickDay }) {
  const multi = days.length > 1;

  const items = appointments
    .map((a) => {
      const s = minutesOfDay(a.start, timezone);
      let e = minutesOfDay(a.end, timezone);
      if (e <= s) e = s + 30;
      return { a, s, e, day: dayOf(a.start, timezone) };
    })
    .filter((i) => days.includes(i.day));

  const startH = Math.max(0, Math.min(8, ...items.map((i) => Math.floor(i.s / 60))));
  const endH = Math.min(24, Math.max(20, ...items.map((i) => Math.ceil(i.e / 60))));
  const hours = Array.from({ length: endH - startH + 1 }, (_, i) => startH + i);
  const height = (endH - startH) * PX_PER_HOUR;
  const toPx = (min) => ((min - startH * 60) / 60) * PX_PER_HOUR;

  const nowMin = minutesOfDay(now, timezone);
  const todayInRange = days.includes(today);
  const showNow = todayInRange && nowMin >= startH * 60 && nowMin <= endH * 60;
  const currentHour = todayInRange ? Math.floor(nowMin / 60) : null;
  const pastPx = todayInRange
    ? Math.min(height, Math.max(0, toPx(Math.min(nowMin, endH * 60))))
    : 0;

  const template = `${RAIL}px repeat(${days.length}, minmax(0, 1fr))`;

  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-sand bg-surface shadow-sm">
      <div className="overflow-x-auto">
        <div style={{ minWidth: multi ? 780 : undefined }}>
          {/* Cabecera de días (solo en semana) */}
          {multi && (
            <div
              className="grid border-b border-sand bg-sand/30"
              style={{ gridTemplateColumns: template }}
            >
              <div />
              {days.map((d) => {
                const count = items.filter((i) => i.day === d).length;
                const isT = d === today;
                return (
                  <button
                    key={d}
                    onClick={() => onPickDay(d)}
                    aria-label={`Ver el ${longDate(d)}`}
                    className={`border-l border-sand px-2 py-3 text-center transition hover:bg-gold/10 ${
                      isT ? "bg-gold/10" : ""
                    }`}
                  >
                    <p
                      className={`text-[11px] font-semibold uppercase tracking-wider ${
                        isT ? "text-gold-dark" : "text-ink/60"
                      }`}
                    >
                      {weekdayShort(d)}
                    </p>
                    <p
                      className={`mx-auto mt-1 flex h-9 w-9 items-center justify-center rounded-full font-display text-lg font-semibold ${
                        isT ? "bg-gold text-[#17191c]" : ""
                      }`}
                    >
                      {Number(d.slice(8))}
                    </p>
                    <p className="mt-1 text-[11px] text-ink/50">
                      {count === 0 ? "Libre" : `${count} ${count === 1 ? "cita" : "citas"}`}
                    </p>
                  </button>
                );
              })}
            </div>
          )}

          {/* Cuerpo */}
          <div className="grid py-3" style={{ gridTemplateColumns: template }}>
            {/* Eje de horas */}
            <div className="relative" style={{ height }}>
              {hours.map((h) => (
                <span key={h}>
                  <span
                    className={`absolute right-2 -translate-y-1/2 text-[13px] font-semibold tabular-nums ${
                      h === currentHour ? "text-gold-dark" : "text-ink/60"
                    }`}
                    style={{ top: (h - startH) * PX_PER_HOUR }}
                  >
                    {hm(h * 60)}
                  </span>
                  {h < endH && (
                    <span
                      className="absolute right-2 -translate-y-1/2 text-[10px] tabular-nums text-ink/35"
                      style={{ top: (h - startH) * PX_PER_HOUR + PX_PER_HOUR / 2 }}
                    >
                      :30
                    </span>
                  )}
                </span>
              ))}

              {showNow && (
                <span
                  aria-hidden="true"
                  className="absolute right-1 z-20 -translate-y-1/2 rounded bg-gold px-1.5 py-0.5 text-[11px] font-bold leading-none tabular-nums text-[#17191c]"
                  style={{ top: toPx(nowMin) }}
                >
                  {hm(nowMin)}
                </span>
              )}
            </div>

            {/* Columnas */}
            {days.map((d) => {
              const isT = d === today;
              const dayItems = items.filter((i) => i.day === d);
              return (
                <div
                  key={d}
                  className={`relative border-l border-sand ${isT ? "bg-gold/[0.06]" : ""}`}
                  style={{ height, ...GRID_LINES }}
                >
                  {isT && pastPx > 0 && (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 top-0 bg-ink/[0.04]"
                      style={{ height: pastPx }}
                    />
                  )}

                  {dayItems.map(({ a, s, e }) => {
                    const h = Math.max(((e - s) / 60) * PX_PER_HOUR, 34) - 3;
                    const tier = h < 40 ? 1 : h < 64 ? 2 : 3; // 1 · 2 · 3 líneas
                    return (
                      <button
                        key={a._id}
                        onClick={() => onOpen(a)}
                        title={`${hm(s)} – ${hm(e)} · ${a.client?.name} · ${a.service?.name}`}
                        aria-label={`${hm(s)} ${a.client?.name}, ${a.service?.name}, ${
                          STATUS_LABELS[a.status] ?? a.status
                        }`}
                        className={`absolute overflow-hidden rounded-lg border-l-4 text-left shadow-sm transition hover:z-10 hover:shadow-md focus-visible:outline-2 focus-visible:outline-gold ${
                          multi ? "inset-x-0.5 px-2" : "inset-x-1.5 px-3"
                        } ${BLOCK[a.status] ?? BLOCK.completed} ${
                          tier === 1
                            ? "flex items-center gap-2 py-1"
                            : "flex flex-col justify-center py-1.5"
                        }`}
                        style={{ top: toPx(s) + 1, height: h }}
                      >
                        {tier === 1 && (
                          <>
                            <span className="shrink-0 text-xs tabular-nums opacity-70">
                              {hm(s)}
                            </span>
                            <span className="truncate text-sm font-semibold">
                              {a.client?.name}
                            </span>
                            {!multi && (
                              <span className="hidden truncate text-xs opacity-70 sm:inline">
                                · {a.service?.name}
                              </span>
                            )}
                          </>
                        )}
                        {tier === 2 && (
                          <>
                            <span className="block truncate font-semibold leading-tight">
                              {a.client?.name}
                            </span>
                            <span className="block truncate text-xs leading-tight tabular-nums opacity-70">
                              {hm(s)} – {hm(e)}
                              {!multi && ` · ${a.service?.name}`}
                            </span>
                          </>
                        )}
                        {tier === 3 && (
                          <>
                            <span className="block text-xs tabular-nums opacity-70">
                              {hm(s)} – {hm(e)}
                            </span>
                            <span className="block truncate font-semibold">{a.client?.name}</span>
                            <span className="block truncate text-xs opacity-70">
                              {a.service?.name}
                              {!multi && ` · ${a.service?.price} €`}
                            </span>
                          </>
                        )}
                      </button>
                    );
                  })}

                  {/* Línea de «ahora» */}
                  {isT && showNow && (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 z-20 flex items-center"
                      style={{ top: toPx(nowMin) }}
                    >
                      <span className="-ml-1 h-2.5 w-2.5 rounded-full bg-gold" />
                      <span className="h-0.5 flex-1 bg-gold" />
                    </div>
                  )}

                  {/* Día sin citas (solo en la vista de un día) */}
                  {!multi && dayItems.length === 0 && (
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                      <CalendarX className="h-8 w-8 text-ink/30" aria-hidden="true" />
                      <p className="mt-2 font-semibold">No hay citas este día</p>
                      <p className="text-sm text-ink/60">
                        Cuando alguien reserve, aparecerá aquí al instante.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────── página ───────────── */

export default function Agenda() {
  const { user } = useAuth();
  const confirm = useConfirm();
  const toast = useToast();
  const terms = useTerms();
  const { timezone } = useSalon();
  const now = useClock();
  const isAdmin = user.role === "admin";
  const today = todayISO(timezone);

  // En el móvil se abre el día: una semana entera no cabe
  const [view, setView] = useState(() =>
    typeof window !== "undefined" && window.innerWidth < 768 ? "day" : "week"
  );
  const [date, setDate] = useState(today);
  const [stylists, setStylists] = useState([]);
  const [selectedStylist, setSelectedStylist] = useState("");
  const [stylistId, setStylistId] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const lastRequest = useRef(0);

  const weekStart = mondayOf(date);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const step = view === "day" ? 1 : 7;

  useEffect(() => {
    if (isAdmin) api.get("/stylists").then((res) => setStylists(res.data));
  }, [isAdmin]);

  async function load() {
    const req = ++lastRequest.current;
    if (isAdmin && !selectedStylist) {
      setStylistId("");
      setAppointments([]);
      return;
    }
    const params = { stylistId: isAdmin ? selectedStylist : undefined };
    if (view === "week") {
      params.from = weekStart;
      params.to = addDays(weekStart, 7); // fin exclusivo: el lunes siguiente
    } else {
      params.date = date;
    }
    try {
      setError("");
      const { data } = await api.get("/appointments/agenda", { params });
      // Si mientras tanto se pidió otro día o semana, esta respuesta ya no vale
      if (req !== lastRequest.current) return;
      setStylistId(data.stylistId);
      setAppointments(data.appointments);
    } catch (err) {
      if (req !== lastRequest.current) return;
      setError(err.response?.data?.message || "Error al cargar la agenda");
    } finally {
      if (req === lastRequest.current) setLoaded(true);
    }
  }

  const rangeKey = view === "day" ? date : weekStart;
  useEffect(() => {
    load();
  }, [view, rangeKey, selectedStylist]);

  useStylistSocket(stylistId, load);

  // Flechas del teclado para moverse entre días o semanas
  useEffect(() => {
    if (selected) return;
    const onKey = (e) => {
      if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
      if (e.key === "ArrowLeft") setDate((d) => addDays(d, -step));
      if (e.key === "ArrowRight") setDate((d) => addDays(d, step));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, step]);

  async function changeStatus(appointment, status) {
    if (status === "cancelled") {
      const ok = await confirm({
        title: "Cancelar cita",
        message: `Se cancelará la cita de ${appointment.client?.name}.`,
        confirmText: "Cancelar cita",
        danger: true,
      });
      if (!ok) return;
    }
    try {
      await api.patch(`/appointments/${appointment._id}/status`, { status });
      toast.success(status === "completed" ? "Cita completada" : "Cita cancelada");
      setSelected(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "No se pudo actualizar");
    }
  }

  const needsStylist = isAdmin && !selectedStylist;
  const isToday = date === today;
  const weekHasToday = weekDays.includes(today);
  const onCurrent = view === "day" ? isToday : weekHasToday;
  const ownerName = isAdmin
    ? stylists.find((s) => s._id === selectedStylist)?.user?.name
    : user.name;

  const visible =
    view === "day"
      ? appointments.filter((a) => dayOf(a.start, timezone) === date)
      : appointments.filter((a) => weekDays.includes(dayOf(a.start, timezone)));

  const tab = (value, label, Icon) => (
    <button
      onClick={() => setView(value)}
      aria-pressed={view === value}
      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
        view === value ? "bg-ink text-cream shadow-sm" : "text-ink/70 hover:text-ink"
      }`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  );

  return (
    <div className="mx-auto max-w-6xl">
      {/* Cabecera */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          {ownerName ? (
            <Initials name={ownerName} size="lg" />
          ) : (
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sand text-ink/40">
              <Users className="h-5 w-5" aria-hidden="true" />
            </span>
          )}
          <div className="min-w-0">
            <h1 className="text-4xl font-bold leading-tight">Agenda</h1>
            <p className="truncate text-sm text-ink/70">
              {ownerName
                ? `${ownerName} · ${terms.One}`
                : `Elige un ${terms.one} para ver su agenda`}
            </p>
          </div>
        </div>

        <div
          role="group"
          aria-label="Vista"
          className="inline-flex rounded-lg border border-sand bg-surface p-1"
        >
          {tab("day", "Día", List)}
          {tab("week", "Semana", CalendarDays)}
        </div>
      </div>

      {/* Barra de herramientas */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {isAdmin && (
          <select
            className="input min-w-52 max-w-xs"
            value={selectedStylist}
            onChange={(e) => setSelectedStylist(e.target.value)}
            aria-label={terms.One}
          >
            <option value="">Elige un {terms.one}</option>
            {stylists.map((s) => (
              <option key={s._id} value={s._id}>
                {s.user.name}
              </option>
            ))}
          </select>
        )}

        {!needsStylist && (
          <div className="flex flex-1 flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDate(addDays(date, -step))}
                className="btn-outline px-2.5"
                aria-label={view === "day" ? "Día anterior" : "Semana anterior"}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                onClick={() => setDate(addDays(date, step))}
                className="btn-outline px-2.5"
                aria-label={view === "day" ? "Día siguiente" : "Semana siguiente"}
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                onClick={() => setDate(today)}
                disabled={onCurrent}
                className="btn-outline disabled:opacity-50"
              >
                Hoy
              </button>
            </div>

            <h2 className="text-lg font-semibold capitalize-first sm:text-xl">
              {view === "day" ? longDate(date) : rangeLabel(weekDays)}
              {onCurrent && (
                <span className="ml-2 rounded-full bg-gold px-2 py-0.5 align-middle font-sans text-xs font-semibold normal-case tracking-normal text-[#17191c]">
                  {view === "day" ? "Hoy" : "Esta semana"}
                </span>
              )}
            </h2>

            <input
              type="date"
              className="input max-w-40"
              value={date}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              aria-label="Fecha"
            />
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {needsStylist && (
        <EmptyState
          icon={Users}
          title={`Elige un ${terms.one}`}
          text="Selecciona a quién quieres ver para cargar su agenda."
        />
      )}

      {!needsStylist && !error && !loaded && (
        <div className="mt-6 h-64 animate-pulse rounded-2xl bg-sand/60" aria-hidden="true" />
      )}

      {!needsStylist && !error && loaded && (
        <>
          {view === "day" && isToday && (
            <FocusCard
              appointments={visible}
              now={now}
              timezone={timezone}
              onOpen={setSelected}
              onComplete={(a) => changeStatus(a, "completed")}
            />
          )}

          <Summary appointments={visible} />

          <section
            className="animate-fade-in mt-6"
            aria-label={view === "day" ? `Citas del ${longDate(date)}` : "Citas de la semana"}
          >
            <Legend />
            <TimeGrid
              days={view === "day" ? [date] : weekDays}
              appointments={visible}
              timezone={timezone}
              now={now}
              today={today}
              onOpen={setSelected}
              onPickDay={(d) => {
                setDate(d);
                setView("day");
              }}
            />
          </section>
        </>
      )}

      {/* Detalle */}
      {selected && (
        <Modal onClose={() => setSelected(null)} labelledBy="detalle-titulo">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Initials name={selected.client?.name} size="lg" />
              <div className="min-w-0">
                <h2 id="detalle-titulo" className="truncate text-2xl font-bold">
                  {selected.client?.name}
                </h2>
                <div className="mt-1">
                  <StatusBadge status={selected.status} />
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelected(null)}
              aria-label="Cerrar"
              className="rounded-lg p-1.5 text-ink/70 transition hover:bg-sand/60 hover:text-ink"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-5 flex items-center justify-between rounded-xl bg-ink px-4 py-3 text-cream">
            <div>
              <p className="text-xs uppercase tracking-wide opacity-70">Horario</p>
              <p className="font-display text-xl font-semibold tabular-nums">
                {hm(minutesOfDay(selected.start, timezone))} –{" "}
                {hm(minutesOfDay(selected.end, timezone))}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide opacity-70">Importe</p>
              <p className="font-display text-xl font-semibold">{selected.service?.price} €</p>
            </div>
          </div>

          <ul className="mt-4 space-y-3 rounded-xl bg-sand/40 p-4">
            <DetailRow icon={Scissors}>
              <b>{selected.service?.name}</b> · {selected.service?.durationMinutes} min
            </DetailRow>
            <DetailRow icon={Clock}>
              <span className="inline-block capitalize-first">{longDate(dayOf(selected.start, timezone))}</span>
            </DetailRow>
            {selected.client?.email && (
              <DetailRow icon={Mail}>
                <a href={`mailto:${selected.client.email}`} className="underline">
                  {selected.client.email}
                </a>
              </DetailRow>
            )}
            {selected.notes && <DetailRow icon={StickyNote}>{selected.notes}</DetailRow>}
          </ul>

          {OPEN.includes(selected.status) && (
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button onClick={() => changeStatus(selected, "cancelled")} className="btn-danger">
                <Ban className="h-4 w-4" aria-hidden="true" />
                Cancelar cita
              </button>
              <button onClick={() => changeStatus(selected, "completed")} className="btn-primary">
                <CheckCheck className="h-4 w-4" aria-hidden="true" />
                Marcar completada
              </button>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}