import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import useStylistSocket from "../hooks/useStylistSocket";
import StatusBadge from "../components/StatusBadge";

function todayISO() {
  const d = new Date();
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 10);
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  });
}

export default function Agenda() {
  const { user } = useAuth();
  const isAdmin = user.role === "admin";

  const [date, setDate] = useState(todayISO());
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
    try {
      setError("");
      const { data } = await api.get("/appointments/agenda", {
        params: { date, stylistId: isAdmin ? selectedStylist : undefined },
      });
      setStylistId(data.stylistId);
      setAppointments(data.appointments);
    } catch (err) {
      setError(err.response?.data?.message || "Error al cargar la agenda");
    }
  }

  useEffect(() => {
    load();
  }, [date, selectedStylist]);

  useStylistSocket(stylistId, load);

  return (
    <div>
      <h1 className="text-4xl font-bold">Agenda</h1>

      <div className="mt-6 flex flex-wrap gap-3">
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
        <input
          type="date"
          className="input max-w-xs"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {!error && appointments.length === 0 && (
        <p className="mt-6 text-ink/50">No hay citas este día.</p>
      )}

      <ul className="mt-6 space-y-3">
        {appointments.map((a) => (
          <li key={a._id} className="card flex items-center gap-4">
            <div className="w-28 shrink-0 border-r border-sand pr-4 text-center">
              <p className="font-display text-xl font-semibold">{formatTime(a.start)}</p>
              <p className="text-xs text-ink/50">hasta {formatTime(a.end)}</p>
            </div>
            <div className="flex-1">
              <p className="font-medium">{a.client?.name}</p>
              <p className="text-sm text-ink/60">
                {a.service?.name} · {a.service?.price} € · {a.client?.email}
              </p>
            </div>
            <StatusBadge status={a.status} />
          </li>
        ))}
      </ul>
    </div>
  );
}