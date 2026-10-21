import { useEffect, useState } from "react";
import api from "../services/api";
import { useConfirm, useToast } from "../context/UIContext";
import { useSalon } from "../context/SalonContext";
import { todayISO } from "../lib/dates";

export default function RescheduleModal({ appointment, onClose, onDone }) {
  const confirm = useConfirm();
  const toast = useToast();
  const { timezone } = useSalon();
  const [date, setDate] = useState(() => todayISO(timezone));
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  async function loadSlots() {
    setLoading(true);
    try {
      const { data } = await api.get(`/stylists/${appointment.stylist._id}/availability`, {
        params: {
          date,
          serviceId: appointment.service._id,
          excludeAppointment: appointment._id,
        },
      });
      setSlots(data.slots);
    } catch (err) {
      setSlots([]);
      toast.error(err.response?.data?.message || "Error al cargar huecos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSlots();
  }, [date]);

  async function choose(slot) {
    const ok = await confirm({
      title: "Confirmar cambio",
      message: `Tu cita pasará a las ${slot.label} del ${date}.`,
      confirmText: "Reprogramar",
    });
    if (!ok) return;

    try {
      await api.patch(`/appointments/${appointment._id}/reschedule`, { start: slot.start });
      toast.success("Cita reprogramada");
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || "No se pudo reprogramar");
      loadSlots();
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-ink/50 p-4"
      onClick={onClose}
    >
      <div className="card w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold">Reprogramar cita</h2>
        <p className="mt-1 text-sm text-ink/60">
          {appointment.service?.name} con {appointment.stylist?.user?.name}
        </p>

        <input
          type="date"
          className="input mt-4 max-w-xs"
          value={date}
          min={todayISO(timezone)}
          onChange={(e) => setDate(e.target.value)}
        />

        <div className="mt-4 min-h-24">
          {loading && slots.length === 0 && (
            <p className="text-ink/50">Buscando huecos...</p>
          )}
          {!loading && slots.length === 0 && (
            <p className="text-ink/50">No hay huecos libres ese día. Prueba con otra fecha.</p>
          )}
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {slots.map((slot) => (
              <button
                key={slot.start}
                onClick={() => choose(slot)}
                className="rounded-full border border-ink/15 py-2 text-sm font-medium transition hover:border-ink hover:bg-ink hover:text-cream"
              >
                {slot.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="btn-outline">Cerrar</button>
        </div>
      </div>
    </div>
  );
}