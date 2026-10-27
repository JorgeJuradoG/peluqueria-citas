import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, CalendarPlus, Clock, Scissors, Trash2, UserRound } from "lucide-react";
import api from "../services/api";
import Avatar from "../components/Avatar";
import PolicyNotice from "../components/PolicyNotice";
import RescheduleModal from "../components/RescheduleModal";
import { Skeleton } from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";
import { useSalon } from "../context/SalonContext";
import { useConfirm, useToast } from "../context/UIContext";
import useNow from "../hooks/useNow";
import useTerms from "../hooks/useTerms";
import { formatDateTime } from "../lib/dates";
import { buildICS, downloadICS, eventFromAppointment } from "../lib/calendar";
import { countdown, greeting } from "../lib/time";
import { canChange } from "../lib/policy";

export default function ClientHome() {
  const { user } = useAuth();
  const salon = useSalon();
  const confirm = useConfirm();
  const toast = useToast();
  const terms = useTerms();
  const now = useNow();
  const [list, setList] = useState(null);
  const [rescheduling, setRescheduling] = useState(null);

  async function load() {
    try {
      const { data } = await api.get("/appointments/me");
      setList(Array.isArray(data) ? data : []);
    } catch {
      setList([]);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function cancel(a) {
    const ok = await confirm({
      title: "Cancelar cita",
      message: "El hueco quedará libre para otros clientes.",
      confirmText: "Cancelar cita",
      danger: true,
    });
    if (!ok) return;
    try {
      await api.patch(`/appointments/${a._id}/cancel`);
      toast.success("Cita cancelada");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "No se pudo cancelar");
    }
  }

  function addToCalendar(a) {
    downloadICS(
      "cita.ics",
      buildICS(
        eventFromAppointment({
          id: a._id,
          start: a.start,
          end: a.end,
          serviceName: a.service?.name,
          stylistName: a.stylist?.user?.name,
          salonName: salon.name,
          location: salon.address,
          phone: salon.phone,
        })
      )
    );
  }

  const upcoming = (list ?? [])
    .filter((a) => ["pending", "confirmed"].includes(a.status) && new Date(a.end) > now)
    .sort((x, y) => new Date(x.start) - new Date(y.start));
  const [next, ...others] = upcoming;

  // Dentro del plazo mínimo, el cliente ya no puede cancelar ni mover la cita
  const hours = salon.cancellationHours ?? 0;
  const locked = Boolean(next) && !canChange(next.start, hours, now);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-4xl font-bold">
        {greeting(now, salon.timezone)}, {user.name.split(" ")[0]}
      </h1>

      <PolicyNotice className="mt-4" />

      {list === null && <Skeleton className="mt-6 h-48 w-full" />}

      {list && !next && (
        <div className="card mt-6 flex flex-col items-center py-12 text-center">
          <h2 className="text-2xl font-bold">No tienes ninguna cita próxima</h2>
          <p className="mt-1 max-w-sm text-sm text-ink/70">
            Reserva en menos de un minuto: servicio, {terms.one} y hueco.
          </p>
          <Link to="/reservar" className="btn-primary mt-6">
            <CalendarPlus className="h-4 w-4" aria-hidden="true" />
            Reservar ahora
          </Link>
        </div>
      )}

      {next && (
        <section className="card mt-6 animate-pop border-gold bg-gold/10">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-gold px-3 py-1 text-xs font-semibold text-[#17191c]">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {countdown(next.start, now)}
          </p>
          <h2 className="mt-3 text-3xl font-bold capitalize">
            {formatDateTime(next.start, salon.timezone)}
          </h2>
          <p className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-ink/70">
            <span className="flex items-center gap-2">
              <Scissors className="h-4 w-4" aria-hidden="true" />
              {next.service?.name} · {next.service?.durationMinutes} min
            </span>
            <span className="flex items-center gap-2">
              <Avatar name={next.stylist?.user?.name} size="sm" />
              {next.stylist?.user?.name}
            </span>
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button onClick={() => addToCalendar(next)} className="btn-primary">
              <CalendarPlus className="h-4 w-4" aria-hidden="true" />
              Añadir al calendario
            </button>
            <button
              onClick={() => setRescheduling(next)}
              disabled={locked}
              className="btn-outline disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CalendarClock className="h-4 w-4" aria-hidden="true" />
              Reprogramar
            </button>
            <button
              onClick={() => cancel(next)}
              disabled={locked}
              className="btn-danger disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Cancelar
            </button>
          </div>
          {locked && (
            <p className="mt-3 text-sm text-amber-700">
              Ya no se puede cambiar online. Contacta con la peluquería.
            </p>
          )}
        </section>
      )}

      {others.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold">Después</h2>
          <ul className="mt-3 space-y-2">
            {others.slice(0, 3).map((a) => (
              <li key={a._id} className="card flex flex-wrap items-center justify-between gap-2 py-3">
                <span className="font-medium capitalize">{formatDateTime(a.start, salon.timezone)}</span>
                <span className="text-sm text-ink/70">
                  {a.service?.name} · {a.stylist?.user?.name}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/reservar" className="btn-outline">
          <CalendarPlus className="h-4 w-4" aria-hidden="true" />
          Nueva cita
        </Link>
        <Link to="/mis-citas" className="btn-outline">
          <UserRound className="h-4 w-4" aria-hidden="true" />
          Todas mis citas
        </Link>
      </div>

      {rescheduling && (
        <RescheduleModal
          appointment={rescheduling}
          onClose={() => setRescheduling(null)}
          onDone={() => {
            setRescheduling(null);
            load();
          }}
        />
      )}
    </div>
  );
}