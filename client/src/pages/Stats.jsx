import { useEffect, useState } from "react";
import {
  Ban,
  CalendarCheck,
  CalendarClock,
  Euro,
  Minus,
  Scissors,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import api from "../services/api";
import Avatar from "../components/Avatar";
import CountUp from "../components/CountUp";
import { Skeleton } from "../components/Skeleton";
import { ErrorAlert } from "../components/FormField";
import useTerms from "../hooks/useTerms";

const PERIODS = [
  { key: "7d", label: "7 días" },
  { key: "30d", label: "30 días" },
  { key: "90d", label: "90 días" },
];

const money = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const fmtDay = (iso) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

function Delta({ current, previous }) {
  if (!previous) {
    return <span className="text-ink/70">Sin datos del periodo anterior</span>;
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-ink/70">
        <Minus className="h-3.5 w-3.5" aria-hidden="true" />
        Igual que el periodo anterior
      </span>
    );
  }
  const up = pct > 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-1 font-medium ${up ? "text-emerald-700" : "text-red-700"}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {up ? "+" : ""}
      {pct}% <span className="font-normal text-ink/70">vs. periodo anterior</span>
    </span>
  );
}

function Kpi({ icon: Icon, label, value, format, children }) {
  return (
    <div className="card">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold-dark">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className="text-sm text-ink/70">{label}</p>
      </div>
      <p className="mt-3 font-display text-4xl font-semibold leading-none">
        <CountUp value={value} format={format} />
      </p>
      <div className="mt-2 min-h-5 text-xs">{children}</div>
    </div>
  );
}

function DayChart({ days }) {
  const totals = days.map((d) => d.completed + d.upcoming);
  const max = Math.max(1, ...totals);
  const all = totals.reduce((a, b) => a + b, 0);
  const step = days.length > 31 ? 10 : days.length > 14 ? 5 : 1;

  return (
    <div>
      <div
        role="img"
        aria-label={`Gráfica de citas por día: ${all} citas en ${days.length} días`}
        className={`flex h-48 items-end border-b border-sand ${days.length > 31 ? "gap-[2px]" : "gap-1"}`}
      >
        {days.map((d, i) => (
          <div
            key={d.date}
            title={`${fmtDay(d.date)}: ${plural(totals[i], "cita", "citas")}`}
            className="flex h-full min-w-0 flex-1 flex-col justify-end"
          >
            <div
              className="flex origin-bottom animate-grow-up flex-col justify-end overflow-hidden rounded-t"
              style={{
                height: `${(totals[i] / max) * 100}%`,
                animationDelay: `${Math.min(i * 15, 600)}ms`,
              }}
            >
              <div className="bg-gold" style={{ flexGrow: d.upcoming }} />
              <div className="bg-ink" style={{ flexGrow: d.completed }} />
            </div>
          </div>
        ))}
      </div>

      <div className={`mt-2 flex text-[10px] text-ink/70 ${days.length > 31 ? "gap-[2px]" : "gap-1"}`} aria-hidden="true">
        {days.map((d, i) => (
          <span key={d.date} className="min-w-0 flex-1 whitespace-nowrap text-center">
            {i % step === 0 ? fmtDay(d.date) : ""}
          </span>
        ))}
      </div>

      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink/70">
        <li className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-ink" aria-hidden="true" /> Completadas
        </li>
        <li className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-gold" aria-hidden="true" /> Pendientes
        </li>
      </ul>

      {/* Los mismos datos, para lectores de pantalla */}
      <table className="sr-only">
        <caption>Citas por día</caption>
        <thead>
          <tr>
            <th>Día</th>
            <th>Completadas</th>
            <th>Pendientes</th>
          </tr>
        </thead>
        <tbody>
          {days.map((d) => (
            <tr key={d.date}>
              <td>{fmtDay(d.date)}</td>
              <td>{d.completed}</td>
              <td>{d.upcoming}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Stats() {
  const terms = useTerms();
  const [period, setPeriod] = useState("30d");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    setData(null);
    setError("");
    api
      .get("/stats", { params: { period } })
      .then((res) => !ignore && setData(res.data))
      .catch(
        (err) =>
          !ignore &&
          setError(err.response?.data?.message || "No se pudieron cargar las estadísticas")
      );
    return () => {
      ignore = true;
    };
  }, [period]);

  const tab = ({ key, label }) => (
    <button
      key={key}
      onClick={() => setPeriod(key)}
      aria-pressed={period === key}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
        period === key ? "bg-ink text-cream shadow-sm" : "text-ink/70 hover:text-ink"
      }`}
    >
      {label}
    </button>
  );

  const booked = data ? data.current.completed + data.current.upcoming : 0;
  const prevBooked = data ? data.previous.completed + data.previous.upcoming : 0;
  const cancelRate =
    data && data.current.total ? Math.round((data.current.cancelled / data.current.total) * 100) : 0;
  const maxService = data ? Math.max(1, ...data.services.map((s) => s.count)) : 1;
  const empty = data && data.current.total === 0 && data.next7.count === 0;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-4xl font-bold">Estadísticas</h1>
          <p className="mt-1 text-ink/70">
            {data
              ? `Del ${fmtDay(data.from)} al ${fmtDay(data.to)}, comparado con el periodo anterior.`
              : "Cómo va tu peluquería."}
          </p>
        </div>
        <div role="group" aria-label="Periodo" className="inline-flex rounded-lg border border-sand bg-surface p-1">
          {PERIODS.map(tab)}
        </div>
      </div>

      {error && (
        <div className="mt-6">
          <ErrorAlert>{error}</ErrorAlert>
        </div>
      )}

      {!data && !error && (
        <div className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((n) => (
              <Skeleton key={n} className="h-32 w-full" />
            ))}
          </div>
          <Skeleton className="h-72 w-full" />
        </div>
      )}

      {empty && (
        <div className="card mt-6 flex flex-col items-center py-12 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-sand text-ink/40">
            <CalendarCheck className="h-8 w-8" aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-2xl font-bold">Aún no hay citas en este periodo</h2>
          <p className="mt-1 max-w-sm text-sm text-ink/70">
            Cuando tus clientes empiecen a reservar, aquí verás cómo evoluciona tu negocio.
          </p>
        </div>
      )}

      {data && !empty && (
        <div className="mt-6 animate-fade-in space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi icon={CalendarCheck} label="Citas" value={booked}>
              <Delta current={booked} previous={prevBooked} />
            </Kpi>
            <Kpi
              icon={Euro}
              label="Ingresos (citas completadas)"
              value={data.current.revenue}
              format={(n) => money.format(n)}
            >
              <Delta current={data.current.revenue} previous={data.previous.revenue} />
            </Kpi>
            <Kpi icon={Users} label="Clientes distintos" value={data.current.clients}>
              <Delta current={data.current.clients} previous={data.previous.clients} />
            </Kpi>
            <Kpi
              icon={Ban}
              label="Cancelaciones"
              value={cancelRate}
              format={(n) => `${Math.round(n)}%`}
            >
              <span className="text-ink/70">
                {data.current.cancelled} de {plural(data.current.total, "cita", "citas")}
              </span>
            </Kpi>
          </div>

          <div className="card flex flex-wrap items-center gap-4 border-gold/50 bg-gold/10">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold text-[#17191c]">
              <CalendarClock className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-semibold">Próximos 7 días</p>
              <p className="text-sm text-ink/70">
                {data.next7.count === 0
                  ? "No hay citas previstas."
                  : `${plural(data.next7.count, "cita prevista", "citas previstas")} · ${money.format(data.next7.revenue)} en servicios`}
              </p>
            </div>
          </div>

          <section className="card">
            <h2 className="text-xl font-semibold">Citas por día</h2>
            <p className="mt-1 text-sm text-ink/70">Sin contar las canceladas.</p>
            <div className="mt-5">
              <DayChart days={data.days} />
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="card">
              <h2 className="flex items-center gap-2 text-xl font-semibold">
                <Scissors className="h-5 w-5 text-gold-dark" aria-hidden="true" />
                Servicios más pedidos
              </h2>
              {data.services.length === 0 ? (
                <p className="mt-4 text-sm text-ink/70">Todavía no hay datos.</p>
              ) : (
                <ul className="mt-5 space-y-4">
                  {data.services.map((s, i) => (
                    <li key={s.id}>
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="font-medium">{s.name}</span>
                        <span className="text-ink/70">
                          {plural(s.count, "cita", "citas")} · {money.format(s.revenue)}
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-sand">
                        <div
                          className="h-full origin-left animate-grow-x rounded-full bg-gold"
                          style={{
                            width: `${(s.count / maxService) * 100}%`,
                            animationDelay: `${i * 100}ms`,
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="card">
              <h2 className="flex items-center gap-2 text-xl font-semibold">
                <Users className="h-5 w-5 text-gold-dark" aria-hidden="true" />
                Ocupación del equipo
              </h2>
              {data.stylists.length === 0 ? (
                <p className="mt-4 text-sm text-ink/70">Todavía no hay {terms.many}.</p>
              ) : (
                <ul className="mt-5 space-y-4">
                  {data.stylists.map((s, i) => (
                    <li key={s.id}>
                      <div className="flex items-center gap-3">
                        <Avatar name={s.name} size="sm" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-3 text-sm">
                            <span className="truncate font-medium">{s.name}</span>
                            <span className="font-medium">
                              {s.occupancy === null ? "—" : `${s.occupancy}%`}
                            </span>
                          </div>
                          <div
                            className="mt-1.5 h-2 overflow-hidden rounded-full bg-sand"
                            role="progressbar"
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={s.occupancy ?? 0}
                            aria-label={`Ocupación de ${s.name}`}
                          >
                            <div
                              className="h-full origin-left animate-grow-x rounded-full bg-gold"
                              style={{
                                width: `${s.occupancy ?? 0}%`,
                                animationDelay: `${i * 100}ms`,
                              }}
                            />
                          </div>
                          <p className="mt-1 text-xs text-ink/70">
                            {s.occupancy === null
                              ? "Sin horario en este periodo"
                              : `${plural(s.count, "cita", "citas")} · ${(s.minutes / 60)
                                  .toFixed(1)
                                  .replace(".", ",")} h reservadas`}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-5 text-xs text-ink/60">
                Ocupación = horas reservadas ÷ horas de trabajo del {terms.one} en el periodo, según
                su horario y sus días libres.
              </p>
            </section>
          </div>

          <p className="text-xs text-ink/60">
            Los ingresos se calculan con el precio actual de cada servicio, solo con las citas
            marcadas como completadas.
          </p>
        </div>
      )}
    </div>
  );
}