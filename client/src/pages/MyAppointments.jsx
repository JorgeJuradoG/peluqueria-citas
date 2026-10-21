import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarCheck,
  CalendarClock,
  CalendarPlus,
  CalendarX,
  Clock,
  Scissors,
  Trash2,
  UserRound,
} from "lucide-react";
import api from "../services/api";
import StatusBadge from "../components/StatusBadge";
import RescheduleModal from "../components/RescheduleModal";
import { AppointmentSkeleton } from "../components/Skeleton";
import { useConfirm, useToast } from "../context/UIContext";
import { useSalon } from "../context/SalonContext";
import { formatDateTime } from "../lib/dates";
import { buildICS, downloadICS, eventFromAppointment } from "../lib/calendar";

function AppointmentCard({ a, upcoming, timezone, onCalendar, onReschedule, onCancel }) {
  return (
    <li
      className={`card flex flex-wrap items-center justify-between gap-4 transition ${
        upcoming ? "hover:border-gold" : "opacity-70"
      }`}
    >
      <div className="flex items-start gap-4">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            upcoming ? "bg-gold/15 text-gold-dark" : "bg-sand text-ink/50"
          }`}
        >
          <CalendarCheck className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="font-display text-lg font-semibold capitalize">
            {formatDateTime(a.start, timezone)}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink/60">
            <span className="flex items-center gap-1.5">
              <Scissors className="h-3.5 w-3.5" aria-hidden="true" />
              {a.service?.name}
            </span>
            <span className="flex items-center gap-1.5">
              <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
              {a.stylist?.user?.name}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {a.service?.durationMinutes} min · {a.service?.price} €
            </span>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={a.status} />
        {upcoming && (
          <>
            <button onClick={() => onCalendar(a)} className="btn-outline" title="Añadir al calendario">
              <CalendarPlus className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Calendario</span>
            </button>
            <button onClick={() => onReschedule(a)} className="btn-outline">
              <CalendarClock className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Reprogramar</span>
            </button>
            <button onClick={() => onCancel(a._id)} className="btn-danger">
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Cancelar</span>
            </button>
          </>
        )}
      </div>
    </li>
  );
}

export default function MyAppointments() {
  const confirm = useConfirm();
  const toast = useToast();
  const salon = useSalon();
  const { timezone } = salon;
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rescheduling, setRescheduling] = useState(null);

  async function load() {
    try {
      const { data } = await api.get("/appointments/me");
      setAppointments(data);
    } catch (err) {
      setError(err.response?.data?.message || "Error al cargar las citas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function cancel(id) {
    const ok = await confirm({
      title: "Cancelar cita",
      message: "El hueco quedará libre para otros clientes.",
      confirmText: "Cancelar cita",
      danger: true,
    });
    if (!ok) return;

    try {
      await api.patch(`/appointments/${id}/cancel`);
      toast.success("Cita cancelada");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "No se pudo cancelar");
    }
  }

  function addToCalendar(a) {
    const event = eventFromAppointment({
      id: a._id,
      start: a.start,
      end: a.end,
      serviceName: a.service?.name,
      stylistName: a.stylist?.user?.name,
      salonName: salon.name,
    });
    downloadICS("cita.ics", buildICS(event));
  }

  const now = new Date();
  const isUpcoming = (a) => ["pending", "confirmed"].includes(a.status) && new Date(a.end) > now;
  const upcoming = appointments
    .filter(isUpcoming)
    .sort((x, y) => new Date(x.start) - new Date(y.start));
  const past = appointments
    .filter((a) => !isUpcoming(a))
    .sort((x, y) => new Date(y.start) - new Date(x.start));

  const cardProps = {
    timezone,
    onCalendar: addToCalendar,
    onReschedule: setRescheduling,
    onCancel: cancel,
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-4xl font-bold">Mis citas</h1>
        <Link to="/reservar" className="btn-primary">
          <CalendarPlus className="h-4 w-4" aria-hidden="true" />
          Nueva cita
        </Link>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {loading && (
        <ul className="mt-6 space-y-3">
          {[1, 2, 3].map((n) => (
            <AppointmentSkeleton key={n} />
          ))}
        </ul>
      )}

      {!loading && appointments.length === 0 && (
        <div className="card mt-8 flex flex-col items-center py-12 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-sand text-ink/40">
            <CalendarX className="h-8 w-8" aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-2xl font-bold">Aún no tienes citas</h2>
          <p className="mt-1 max-w-sm text-sm text-ink/60">
            Reserva tu primera cita en menos de un minuto: elige servicio, profesional y hueco.
          </p>
          <Link to="/reservar" className="btn-primary mt-6">
            Reservar ahora
          </Link>
        </div>
      )}

      {!loading && upcoming.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold">Próximas</h2>
          <ul className="mt-3 space-y-3">
            {upcoming.map((a) => (
              <AppointmentCard key={a._id} a={a} upcoming {...cardProps} />
            ))}
          </ul>
        </section>
      )}

      {!loading && appointments.length > 0 && upcoming.length === 0 && (
        <div className="card mt-8 text-center">
          <p className="text-ink/60">No tienes citas próximas.</p>
          <Link to="/reservar" className="btn-primary mt-4">
            Reservar ahora
          </Link>
        </div>
      )}

      {!loading && past.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-ink/70">Anteriores</h2>
          <ul className="mt-3 space-y-3">
            {past.map((a) => (
              <AppointmentCard key={a._id} a={a} upcoming={false} {...cardProps} />
            ))}
          </ul>
        </section>
      )}

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