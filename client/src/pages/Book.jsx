import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import useStylistSocket from "../hooks/useStylistSocket";
import { useConfirm, useToast } from "../context/UIContext.jsx";

function todayISO() {
  const d = new Date();
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 10);
}

function Step({ number, title, children }) {
  return (
    <section className="card">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink font-display text-sm text-cream">
          {number}
        </span>
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function Book() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [stylists, setStylists] = useState([]);
  const [serviceId, setServiceId] = useState("");
  const [stylistId, setStylistId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [message, setMessage] = useState("");
  const toast = useToast();
  const confirm = useConfirm();

  useEffect(() => {
    api.get("/services").then((res) => setServices(res.data));
    api.get("/stylists").then((res) => setStylists(res.data));
  }, []);

  const availableStylists = stylists.filter((s) =>
    s.services.some((sv) => sv._id === serviceId)
  );

  async function loadSlots() {
    if (!serviceId || !stylistId || !date) {
      setSlots([]);
      return;
    }
    setLoadingSlots(true);
    try {
      const { data } = await api.get(`/stylists/${stylistId}/availability`, {
        params: { date, serviceId },
      });
      setSlots(data.slots);
    } catch (err) {
      setSlots([]);
      toast.error(err.response?.data?.message || "No se pudo cargar la disponibilidad");
    } finally {
      setLoadingSlots(false);
    }
  }

  useEffect(() => {
    loadSlots();
  }, [serviceId, stylistId, date]);

  useStylistSocket(stylistId, loadSlots);

async function reserve(slot) {
  const service = services.find((s) => s._id === serviceId);
  const stylist = stylists.find((s) => s._id === stylistId);

  const ok = await confirm({
    title: "Confirmar reserva",
    message: `${service.name} con ${stylist.user.name} a las ${slot.label} (${service.price} €).`,
    confirmText: "Reservar",
  });
  if (!ok) return;

  try {
    await api.post("/appointments", { stylistId, serviceId, start: slot.start });
    toast.success("Cita reservada");
    navigate("/mis-citas");
  } catch (err) {
    toast.error(err.response?.data?.message || "No se pudo reservar");
    loadSlots();
  }
}

  return (
    <div>
      <h1 className="text-4xl font-bold">Reservar cita</h1>
      <p className="mt-1 text-ink/60">Tres pasos y listo.</p>

      <div className="mt-8 space-y-5">
        <Step number={1} title="Elige un servicio">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <button
                key={s._id}
                onClick={() => {
                  setServiceId(s._id);
                  setStylistId("");
                }}
                className={`rounded-lg border p-3 text-left transition ${
                  serviceId === s._id
                    ? "border-gold bg-gold/10 ring-2 ring-gold/30"
                    : "border-sand hover:border-gold"
                }`}
              >
                <p className="font-medium">{s.name}</p>
                <p className="text-sm text-ink/60">
                  {s.durationMinutes} min · {s.price} €
                </p>
              </button>
            ))}
          </div>
        </Step>

        {serviceId && (
          <Step number={2} title="Elige profesional">
            {availableStylists.length === 0 ? (
              <p className="text-ink/50">Nadie ofrece este servicio por ahora.</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {availableStylists.map((s) => (
                  <button
                    key={s._id}
                    onClick={() => setStylistId(s._id)}
                    className={`flex items-center gap-3 rounded-lg border px-4 py-2 transition ${
                      stylistId === s._id
                        ? "border-gold bg-gold/10 ring-2 ring-gold/30"
                        : "border-sand hover:border-gold"
                    }`}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink font-display text-cream">
                      {s.user.name[0]}
                    </span>
                    <span className="text-left">
                      <span className="block font-medium">{s.user.name}</span>
                      {s.bio && <span className="block text-xs text-ink/60">{s.bio}</span>}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </Step>
        )}

        {serviceId && stylistId && (
          <Step number={3} title="Elige día y hora">
            <input
              type="date"
              className="input max-w-xs"
              value={date}
              min={todayISO()}
              onChange={(e) => setDate(e.target.value)}
            />

            {message && (
              <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {message}
              </p>
            )}

            <div className="mt-5">
              {loadingSlots && slots.length === 0 && (
                <p className="text-ink/50">Buscando huecos...</p>
              )}
              {!loadingSlots && slots.length === 0 && (
                <p className="text-ink/50">No hay huecos libres ese día. Prueba con otra fecha.</p>
              )}
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-6">
                {slots.map((slot) => (
                  <button
                    key={slot.start}
                    onClick={() => reserve(slot)}
                    className="rounded-full border border-ink/15 py-2 text-sm font-medium transition hover:border-ink hover:bg-ink hover:text-cream"
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
            </div>
          </Step>
        )}
      </div>
    </div>
  );
}