import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import StatusBadge from "../components/StatusBadge";
import RescheduleModal from "../components/RescheduleModal";
import { useConfirm, useToast } from "../context/UIContext";

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

export default function MyAppointments() {
  const confirm = useConfirm();
  const toast = useToast();
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

  const isUpcoming = (a) =>
    ["pending", "confirmed"].includes(a.status) && new Date(a.end) > new Date();

  return (
    <div>
      <h1 className="text-4xl font-bold">Mis citas</h1>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {loading && <p className="mt-6 text-ink/50">Cargando...</p>}

      {!loading && appointments.length === 0 && (
        <div className="card mt-6 text-center">
          <p className="text-ink/60">Todavía no tienes citas.</p>
          <Link to="/reservar" className="btn-primary mt-4">Reservar ahora</Link>
        </div>
      )}

      <ul className="mt-6 space-y-3">
        {appointments.map((a) => (
          <li
            key={a._id}
            className={`card flex flex-wrap items-center justify-between gap-3 ${
              isUpcoming(a) ? "" : "opacity-60"
            }`}
          >
            <div>
              <p className="font-display text-lg font-semibold capitalize">
                {formatDate(a.start)}
              </p>
              <p className="text-sm text-ink/60">
                {a.service?.name} con {a.stylist?.user?.name} · {a.service?.price} €
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={a.status} />
              {isUpcoming(a) && (
                <>
                  <button onClick={() => setRescheduling(a)} className="btn-outline">
                    Reprogramar
                  </button>
                  <button onClick={() => cancel(a._id)} className="btn-danger">
                    Cancelar
                  </button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>

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