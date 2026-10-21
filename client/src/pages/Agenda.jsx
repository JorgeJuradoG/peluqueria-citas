import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import themePlugin from "@fullcalendar/react/themes/classic";
import esLocale from "@fullcalendar/react/locales/es";
import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/classic/theme.css";
import "@fullcalendar/react/themes/classic/palette.css";
import {
  Ban,
  CalendarDays,
  CalendarX,
  CheckCheck,
  Clock,
  List,
  Mail,
  Scissors,
  StickyNote,
  UserRound,
  Users,
  X,
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useConfirm, useToast } from "../context/UIContext";
import { useSalon } from "../context/SalonContext";
import { todayISO, formatTime } from "../lib/dates";
import useStylistSocket from "../hooks/useStylistSocket";
import StatusBadge from "../components/StatusBadge";

const STATUS_COLORS = {
  pending: { color: "#b45309", contrastColor: "#ffffff" }, // ámbar
  confirmed: { color: "#1c1917", contrastColor: "#faf7f2" }, // negro de la marca
  completed: { color: "#78716c", contrastColor: "#ffffff" }, // gris
};

const STATUS_LABELS = {
  confirmed: "Confirmada",
  pending: "Pendiente",
  completed: "Completada",
};

function Legend() {
  return (
    <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink/70">
      {Object.entries(STATUS_LABELS).map(([status, label]) => (
        <li key={status} className="flex items-center gap-2">
          <span
            className="h-3.5 w-3.5 rounded-sm border-l-4 border-gold shadow-sm"
            style={{ backgroundColor: STATUS_COLORS[status].color }}
          />
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
      {text && <p className="mt-1 max-w-sm text-sm text-ink/60">{text}</p>}
    </div>
  );
}

function DetailRow({ icon: Icon, children }) {
  return (
    <li className="flex items-start gap-3 text-sm">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-ink/40" aria-hidden="true" />
      <span>{children}</span>
    </li>
  );
}

export default function Agenda() {
  const { user } = useAuth();
  const confirm = useConfirm();
  const toast = useToast();
  const { timezone } = useSalon();
  const isAdmin = user.role === "admin";

  const [view, setView] = useState("week"); // "list" | "week"
  const [date, setDate] = useState(() => todayISO(timezone));
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");
  const [stylists, setStylists] = useState([]);
  const [selectedStylist, setSelectedStylist] = useState("");
  const [stylistId, setStylistId] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAdmin) api.get("/stylists").then((res) => setStylists(res.data));
  }, [isAdmin]);

  async function load() {
    if (isAdmin && !selectedStylist) {
      setAppointments([]);
      return;
    }
    const params = { stylistId: isAdmin ? selectedStylist : undefined };
    if (view === "week") {
      if (!rangeFrom) return; // el calendario aún no ha informado de su rango
      params.from = rangeFrom;
      params.to = rangeTo;
    } else {
      params.date = date;
    }
    try {
      setError("");
      const { data } = await api.get("/appointments/agenda", { params });
      setStylistId(data.stylistId);
      setAppointments(data.appointments);
    } catch (err) {
      setError(err.response?.data?.message || "Error al cargar la agenda");
    }
  }

  useEffect(() => {
    load();
  }, [view, date, selectedStylist, rangeFrom, rangeTo]);

  useStylistSocket(stylistId, load);

  // Escape cierra el detalle
  useEffect(() => {
    if (!selected) return;
    const onKey = (e) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

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

  const events = appointments.map((a) => ({
    id: a._id,
    title: `${a.client?.name} · ${a.service?.name}`,
    start: a.start,
    end: a.end,
    ...STATUS_COLORS[a.status],
  }));

  const needsStylist = isAdmin && !selectedStylist;

  const tab = (value, label, Icon) => (
    <button
      onClick={() => setView(value)}
      aria-pressed={view === value}
      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
        view === value ? "bg-ink text-cream shadow-sm" : "text-ink/60 hover:text-ink"
      }`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  );

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-4xl font-bold">Agenda</h1>
          {!needsStylist && !error && (
            <p className="mt-1 text-sm text-ink/60">
              {appointments.length === 1 ? "1 cita" : `${appointments.length} citas`}
              {view === "week" ? " en el rango visible" : " este día"}
            </p>
          )}
        </div>
        <div role="group" className="inline-flex rounded-lg border border-sand bg-white p-1">
          {tab("week", "Semana", CalendarDays)}
          {tab("list", "Lista", List)}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {isAdmin && (
          <div className="relative">
            <UserRound
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40"
              aria-hidden="true"
            />
            <select
              className="input min-w-52 pl-9"
              value={selectedStylist}
              onChange={(e) => setSelectedStylist(e.target.value)}
              aria-label="Estilista"
            >
              <option value="">Elige un estilista</option>
              {stylists.map((s) => (
                <option key={s._id} value={s._id}>{s.user.name}</option>
              ))}
            </select>
          </div>
        )}
        {view === "list" && (
          <input
            type="date"
            className="input max-w-44"
            value={date}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            aria-label="Fecha"
          />
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
          title="Elige un estilista"
          text="Selecciona a quién quieres ver para cargar su agenda."
        />
      )}

      {view === "week" && !needsStylist && (
        <div className="animate-fade-in">
          <div className="mt-6">
            <Legend />
          </div>
          <div className="keep palette card mt-3 p-2 sm:p-4">
            <FullCalendar
              plugins={[timeGridPlugin, themePlugin]}
              initialView="timeGridWeek"
              timeZone={timezone}
              locale={esLocale}
              firstDay={1}
              headerToolbar={{
                start: "title",
                end: "today prev,next timeGridWeek,timeGridDay",
              }}
              allDaySlot={false}
              slotMinTime="08:00:00"
              slotMaxTime="21:00:00"
              slotDuration="00:30:00"
              nowIndicator
              height="auto"
              events={events}
              eventClass="cita-evento"
              eventClick={(info) =>
                setSelected(appointments.find((a) => a._id === info.event.id))
              }
              datesSet={(info) => {
                setRangeFrom(info.startStr);
                setRangeTo(info.endStr);
              }}
            />
          </div>
        </div>
      )}

      {view === "list" && !needsStylist && (
        <>
          {!error && appointments.length === 0 && (
            <EmptyState
              icon={CalendarX}
              title="No hay citas este día"
              text="Cuando alguien reserve, aparecerá aquí al instante."
            />
          )}
          <ul className="mt-6 space-y-3">
            {appointments.map((a) => (
              <li
                key={a._id}
                className="card flex animate-fade-up flex-wrap items-center gap-4 transition hover:border-gold"
              >
                <div className="w-28 shrink-0 border-r border-sand pr-4 text-center">
                  <p className="font-display text-xl font-semibold">
                    {formatTime(a.start, timezone)}
                  </p>
                  <p className="text-xs text-ink/50">hasta {formatTime(a.end, timezone)}</p>
                </div>
                <div className="min-w-0 flex-1 basis-40">
                  <p className="font-medium">{a.client?.name}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink/60">
                    <span className="flex items-center gap-1.5">
                      <Scissors className="h-3.5 w-3.5" aria-hidden="true" />
                      {a.service?.name} · {a.service?.price} €
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                      {a.client?.email}
                    </span>
                  </p>
                </div>
                <StatusBadge status={a.status} />
                <button onClick={() => setSelected(a)} className="btn-outline">
                  Detalles
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-40 flex animate-fade-in items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="detalle-titulo"
            className="card w-full max-w-md animate-pop"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="detalle-titulo" className="text-2xl font-bold">
                  {selected.client?.name}
                </h2>
                <div className="mt-2">
                  <StatusBadge status={selected.status} />
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                aria-label="Cerrar"
                className="rounded-lg p-1.5 text-ink/50 transition hover:bg-sand/60 hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <ul className="mt-5 space-y-3">
              <DetailRow icon={Scissors}>
                {selected.service?.name} ({selected.service?.price} €)
              </DetailRow>
              <DetailRow icon={Clock}>
                {formatTime(selected.start, timezone)} – {formatTime(selected.end, timezone)}
              </DetailRow>
              <DetailRow icon={Mail}>{selected.client?.email}</DetailRow>
              {selected.notes && <DetailRow icon={StickyNote}>{selected.notes}</DetailRow>}
            </ul>

            {["pending", "confirmed"].includes(selected.status) && (
              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <button
                  onClick={() => changeStatus(selected, "cancelled")}
                  className="btn-danger"
                >
                  <Ban className="h-4 w-4" aria-hidden="true" />
                  Cancelar cita
                </button>
                <button
                  onClick={() => changeStatus(selected, "completed")}
                  className="btn-primary"
                >
                  <CheckCheck className="h-4 w-4" aria-hidden="true" />
                  Marcar completada
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}