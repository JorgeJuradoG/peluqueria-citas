import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import useStylistSocket from "../hooks/useStylistSocket";

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

  // Tiempo real: se refresca cuando alguien reserva o cancela
  useStylistSocket(stylistId, load);

  const field = "rounded border p-2";

  return (
    <div>
      <h1 className="text-3xl font-bold">Agenda</h1>

      <div className="mt-4 flex gap-3">
        {isAdmin && (
          <select
            className={field}
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
          className={field}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {error && <p className="mt-3 text-red-600">{error}</p>}

      {!error && appointments.length === 0 && (
        <p className="mt-4 text-gray-500">No hay citas este día.</p>
      )}

      <ul className="mt-4 space-y-2">
        {appointments.map((a) => (
          <li key={a._id} className="rounded border p-3">
            <p className="font-medium">
              {formatTime(a.start)} – {formatTime(a.end)} · {a.service?.name}
            </p>
            <p className="text-sm text-gray-600">
              {a.client?.name} ({a.client?.email}) · {a.service?.price} €
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}