import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import themePlugin from "@fullcalendar/react/themes/classic";
import esLocale from "@fullcalendar/react/locales/es";
import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/classic/theme.css";
import "@fullcalendar/react/themes/classic/palette.css";
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

  const toggle = (value, label) => (
    <button
      onClick={() => setView(value)}
      className={view === value ? "btn-primary" : "btn-outline"}
    >
      {label}
    </button>
  );

  return (
    <div>
      <h1 className="text-4xl font-bold">Agenda</h1>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {isAdmin && (
          <select
            className="input max-w-xs"
            value={selectedStylist}
            onChange={(e) => setSelectedStylist(e.target.value)}
          >
            <option value="">Elige un estilista</option>
            {stylists.map((s) => (
              <option key={s._id} value={s._id}>{s.user.name}</option>
            ))}
          </select>
        )}
        {view === "list" && (
          <input
            type="date"
            className="input max-w-xs"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        )}
        <div className="ml-auto flex gap-2">
          {toggle("week", "Semana")}
          {toggle("list", "Lista")}
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {isAdmin && !selectedStylist && (
        <p className="mt-6 text-ink/50">Elige un estilista para ver su agenda.</p>
      )}

      {view === "week" && (!isAdmin || selectedStylist) && (
        <>
          <div className="mt-6">
            <Legend />
          </div>
          <div className="card mt-3 p-2 sm:p-4">
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
        </>
      )}

      {view === "list" && (
        <>
          {!error && appointments.length === 0 && (!isAdmin || selectedStylist) && (
            <p className="mt-6 text-ink/50">No hay citas este día.</p>
          )}
          <ul className="mt-6 space-y-3">
            {appointments.map((a) => (
              <li key={a._id} className="card flex flex-wrap items-center gap-4">
                <div className="w-28 shrink-0 border-r border-sand pr-4 text-center">
                  <p className="font-display text-xl font-semibold">
                    {formatTime(a.start, timezone)}
                  </p>
                  <p className="text-xs text-ink/50">
                    hasta {formatTime(a.end, timezone)}
                  </p>
                </div>
                <div className="min-w-0 flex-1 basis-40">
                  <p className="font-medium">{a.client?.name}</p>
                  <p className="text-sm text-ink/60">
                    {a.service?.name} · {a.service?.price} € · {a.client?.email}
                  </p>
                </div>
                <button onClick={() => setSelected(a)} className="btn-outline">
                  Detalles
                </button>
                <StatusBadge status={a.status} />
              </li>
            ))}
          </ul>
        </>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-ink/50 p-4"
          onClick={() => setSelected(null)}
        >
          <div className="card w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-2xl font-bold">{selected.client?.name}</h2>
              <StatusBadge status={selected.status} />
            </div>
            <dl className="mt-4 space-y-1 text-sm">
              <p>
                <dt className="inline text-ink/60">Servicio: </dt>
                <dd className="inline">
                  {selected.service?.name} ({selected.service?.price} €)
                </dd>
              </p>
              <p>
                <dt className="inline text-ink/60">Horario: </dt>
                <dd className="inline">
                  {formatTime(selected.start, timezone)} – {formatTime(selected.end, timezone)}
                </dd>
              </p>
              <p>
                <dt className="inline text-ink/60">Email: </dt>
                <dd className="inline">{selected.client?.email}</dd>
              </p>
              {selected.notes && (
                <p>
                  <dt className="inline text-ink/60">Notas: </dt>
                  <dd className="inline">{selected.notes}</dd>
                </p>
              )}
            </dl>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button onClick={() => setSelected(null)} className="btn-outline">
                Cerrar
              </button>
              {["pending", "confirmed"].includes(selected.status) && (
                <>
                  <button
                    onClick={() => changeStatus(selected, "cancelled")}
                    className="btn-danger"
                  >
                    Cancelar cita
                  </button>
                  <button
                    onClick={() => changeStatus(selected, "completed")}
                    className="btn-primary"
                  >
                    Marcar completada
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}