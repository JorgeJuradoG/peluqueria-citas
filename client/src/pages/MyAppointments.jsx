import { useEffect, useState } from "react";
import api from "../services/api";

function formatDate(iso) {
  return new Date(iso).toLocaleString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  });
}

const STATUS_LABELS = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  completed: "Completada",
};

export default function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState("");

  async function load() {
    try {
      const { data } = await api.get("/appointments/me");
      setAppointments(data);
    } catch (err) {
      setError(err.response?.data?.message || "Error al cargar las citas");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function cancel(id) {
    if (!window.confirm("¿Cancelar esta cita?")) return;
    try {
      await api.patch(`/appointments/${id}/cancel`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo cancelar");
    }
  }

  const upcoming = (a) =>
    ["pending", "confirmed"].includes(a.status) && new Date(a.end) > new Date();

  return (
    <div>
      <h1 className="text-3xl font-bold">Mis citas</h1>
      {error && <p className="mt-3 text-red-600">{error}</p>}

      {appointments.length === 0 && (
        <p className="mt-4 text-gray-500">Todavía no tienes citas.</p>
      )}

      <ul className="mt-4 space-y-2">
        {appointments.map((a) => (
          <li key={a._id} className="flex items-center justify-between rounded border p-3">
            <div>
              <p className="font-medium capitalize">{formatDate(a.start)}</p>
              <p className="text-sm text-gray-600">
                {a.service?.name} con {a.stylist?.user?.name} ·{" "}
                {STATUS_LABELS[a.status]}
              </p>
            </div>
            {upcoming(a) && (
              <button onClick={() => cancel(a._id)} className="text-red-600 underline">
                Cancelar
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}