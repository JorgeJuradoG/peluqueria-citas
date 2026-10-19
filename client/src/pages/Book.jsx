import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function todayISO() {
  const d = new Date();
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 10);
}

export default function Book() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [stylists, setStylists] = useState([]);
  const [serviceId, setServiceId] = useState("");
  const [stylistId, setStylistId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [slots, setSlots] = useState([]);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    api.get("/services").then((res) => setServices(res.data));
    api.get("/stylists").then((res) => setStylists(res.data));
  }, []);

  // Estilistas que ofrecen el servicio elegido
  const availableStylists = stylists.filter((s) =>
    s.services.some((sv) => sv._id === serviceId)
  );

  async function loadSlots() {
    if (!serviceId || !stylistId || !date) {
      setSlots([]);
      return;
    }
    try {
      const { data } = await api.get(`/stylists/${stylistId}/availability`, {
        params: { date, serviceId },
      });
      setSlots(data.slots);
    } catch (err) {
      setSlots([]);
      setMessage({ type: "error", text: err.response?.data?.message || "Error al cargar huecos" });
    }
  }

  useEffect(() => {
    loadSlots();
  }, [serviceId, stylistId, date]);

  async function reserve(slot) {
    setMessage({ type: "", text: "" });
    try {
      await api.post("/appointments", { stylistId, serviceId, start: slot.start });
      setMessage({ type: "ok", text: `Cita reservada a las ${slot.label}` });
      loadSlots();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "No se pudo reservar" });
      loadSlots();
    }
  }

  const field = "w-full rounded border p-2";

  return (
    <div>
      <h1 className="text-3xl font-bold">Reservar cita</h1>

      <div className="mt-4 space-y-3">
        <select
          className={field}
          value={serviceId}
          onChange={(e) => {
            setServiceId(e.target.value);
            setStylistId("");
          }}
        >
          <option value="">Elige un servicio</option>
          {services.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name} · {s.durationMinutes} min · {s.price} €
            </option>
          ))}
        </select>

        <select
          className={field}
          value={stylistId}
          onChange={(e) => setStylistId(e.target.value)}
          disabled={!serviceId}
        >
          <option value="">Elige un estilista</option>
          {availableStylists.map((s) => (
            <option key={s._id} value={s._id}>{s.user.name}</option>
          ))}
        </select>

        <input
          type="date"
          className={field}
          value={date}
          min={todayISO()}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {message.text && (
        <p className={`mt-4 ${message.type === "ok" ? "text-green-700" : "text-red-600"}`}>
          {message.text}
        </p>
      )}

      <div className="mt-6">
        {serviceId && stylistId && slots.length === 0 && (
          <p className="text-gray-500">No hay huecos libres ese día.</p>
        )}
        <div className="grid grid-cols-4 gap-2">
          {slots.map((slot) => (
            <button
              key={slot.start}
              onClick={() => reserve(slot)}
              className="rounded border p-2 hover:bg-black hover:text-white"
            >
              {slot.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}