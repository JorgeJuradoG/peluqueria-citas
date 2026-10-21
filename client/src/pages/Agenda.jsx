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
import useStylistSocket from "../hooks/useStylistSocket";
import StatusBadge from "../components/StatusBadge";

const TZ = "Europe/Madrid";

function todayISO() {
  const d = new Date();
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 10);
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  });
}

export default function Agenda() {
  const { user } = useAuth();
  const isAdmin = user.role === "admin";

  const [view, setView] = useState("week"); // "list" | "week"
  const [date, setDate] = useState(todayISO());
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");
  const [stylists, setStylists] = useState([]);
  const [selectedStylist, setSelectedStylist] = useState("");
  const [stylistId, setStylistId] = useState("");
  const [appointments, setAppointments] = useState([]);
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

  const events = appointments.map((a) => ({
    id: a._id,
    title: `${a.client?.name} · ${a.service?.name}`,
    start: a.start,
    end: a.end,
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
        <div className="card mt-6 p-2 sm:p-4">
          <FullCalendar
            plugins={[timeGridPlugin, themePlugin]}
            initialView="timeGridWeek"
            timeZone={TZ}
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
            eventColor="#b08d57"
            eventContrastColor="#1c1917"
            datesSet={(info) => {
              setRangeFrom(info.startStr);
              setRangeTo(info.endStr);
            }}
          />
        </div>
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
                  <p className="font-display text-xl font-semibold">{formatTime(a.start)}</p>
                  <p className="text-xs text-ink/50">hasta {formatTime(a.end)}</p>
                </div>
                <div className="min-w-0 flex-1 basis-40">
                  <p className="font-medium">{a.client?.name}</p>
                  <p className="text-sm text-ink/60">
                    {a.service?.name} · {a.service?.price} € · {a.client?.email}
                  </p>
                </div>
                <StatusBadge status={a.status} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}