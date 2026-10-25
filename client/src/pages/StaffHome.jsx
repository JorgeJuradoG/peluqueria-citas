import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, CalendarDays, Clock, Euro, Hourglass, Users } from "lucide-react";
import api from "../services/api";
import Avatar from "../components/Avatar";
import StatusBadge from "../components/StatusBadge";
import CountUp from "../components/CountUp";
import { Skeleton } from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";
import { useSalon } from "../context/SalonContext";
import useNow from "../hooks/useNow";
import { formatDateTime, formatTime } from "../lib/dates";
import { countdown, greeting } from "../lib/time";

const money = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });

function Kpi({ icon: Icon, label, value, format }) {
  return (
    <div className="card flex items-center gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold-dark">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div>
        <p className="font-display text-2xl font-semibold leading-none">
          <CountUp value={value} format={format} />
        </p>
        <p className="mt-1 text-xs text-ink/70">{label}</p>
      </div>
    </div>
  );
}

export default function StaffHome() {
  const { user } = useAuth();
  const salon = useSalon();
  const now = useNow();
  const [data, setData] = useState(null);

  useEffect(() => {
    const load = () =>
      api
        .get("/appointments/today")
        .then((res) => setData(res.data))
        .catch(() => setData({ appointments: [], next: null, summary: {} }));
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, []);

  const isAdmin = user.role === "admin";
  const s = data?.summary ?? {};
  const next = data?.next;
  const inProgress = next && new Date(next.start) <= now;

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-4xl font-bold">
        {greeting(now, salon.timezone)}, {user.name.split(" ")[0]}
      </h1>
      <p className="mt-1 text-ink/70">
        {isAdmin ? "Así va hoy todo el equipo." : "Esta es tu jornada de hoy."}
      </p>

      {!data && <Skeleton className="mt-6 h-64 w-full" />}

      {data && (
        <div className="mt-6 animate-fade-in space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi icon={CalendarCheck} label="Citas hoy" value={s.total ?? 0} />
            <Kpi icon={Hourglass} label="Pendientes" value={s.pending ?? 0} />
            <Kpi icon={Users} label="Completadas" value={s.completed ?? 0} />
            <Kpi icon={Euro} label="Previsto hoy" value={(s.revenue ?? 0) + (s.expected ?? 0)} format={(n) => money.format(n)} />
          </div>

          <section className="card border-gold bg-gold/10">
            <p className="text-xs font-semibold uppercase tracking-widest text-gold-dark">
              {inProgress ? "En curso" : "Siguiente cita"}
            </p>
            {next ? (
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <Avatar name={next.client?.name} size="lg" />
                <div className="min-w-0 flex-1 basis-48">
                  <p className="font-display text-2xl font-semibold">{next.client?.name}</p>
                  <p className="text-sm text-ink/70">
                    {next.service?.name} · {next.stylist?.user?.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="inline-flex items-center gap-1.5 rounded-full bg-gold px-3 py-1 text-xs font-semibold text-[#1c1917]">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    {countdown(next.start, now)}
                  </p>
                  <p className="mt-1 text-xs capitalize text-ink/70">
                    {formatDateTime(next.start, salon.timezone)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-ink/70">No hay citas pendientes.</p>
            )}
          </section>

          <section className="card">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">Agenda de hoy</h2>
              <Link to="/agenda" className="btn-outline">
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                Ver semana
              </Link>
            </div>
            {data.appointments.length === 0 ? (
              <p className="mt-4 text-sm text-ink/70">Hoy no hay citas.</p>
            ) : (
              <ul className="mt-4 divide-y divide-sand">
                {data.appointments.map((a) => (
                  <li key={a._id} className="flex flex-wrap items-center gap-3 py-3">
                    <span className="w-24 shrink-0 font-display text-lg">
                      {formatTime(a.start, salon.timezone)}
                    </span>
                    <Avatar name={a.client?.name} size="sm" />
                    <div className="min-w-0 flex-1 basis-40">
                      <p className="truncate font-medium">{a.client?.name}</p>
                      <p className="truncate text-xs text-ink/70">
                        {a.service?.name}
                        {isAdmin && ` · ${a.stylist?.user?.name}`}
                      </p>
                    </div>
                    <StatusBadge status={a.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}