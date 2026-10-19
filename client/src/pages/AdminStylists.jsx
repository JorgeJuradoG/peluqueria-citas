import { useEffect, useState } from "react";
import api from "../services/api";

function StylistCard({ stylist, allServices, onChanged }) {
  const [newDay, setNewDay] = useState("");
  const [error, setError] = useState("");

  const offeredIds = stylist.services.map((s) => s._id);
  // Las fechas llegan como ISO (UTC); nos quedamos con AAAA-MM-DD
  const daysOff = stylist.daysOff.map((d) => d.slice(0, 10)).sort();

  async function save(changes) {
    setError("");
    try {
      await api.put(`/stylists/${stylist._id}`, changes);
      onChanged();
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo guardar");
    }
  }

  function toggleService(serviceId) {
    const services = offeredIds.includes(serviceId)
      ? offeredIds.filter((id) => id !== serviceId)
      : [...offeredIds, serviceId];
    save({ services });
  }

  function addDay() {
    if (!newDay || daysOff.includes(newDay)) return;
    save({ daysOff: [...daysOff, newDay] });
    setNewDay("");
  }

  function removeDay(day) {
    save({ daysOff: daysOff.filter((d) => d !== day) });
  }

  return (
    <li className="rounded border p-4">
      <h2 className="text-xl font-semibold">{stylist.user.name}</h2>
      <p className="text-sm text-gray-600">{stylist.user.email}</p>

      <h3 className="mt-3 font-medium">Servicios que ofrece</h3>
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
        {allServices.map((s) => (
          <label key={s._id} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={offeredIds.includes(s._id)}
              onChange={() => toggleService(s._id)}
            />
            {s.name}
          </label>
        ))}
      </div>

      <h3 className="mt-3 font-medium">Días libres</h3>
      <div className="mt-1 flex gap-2">
        <input
          type="date"
          value={newDay}
          onChange={(e) => setNewDay(e.target.value)}
          className="rounded border p-1"
        />
        <button onClick={addDay} className="underline">Añadir</button>
      </div>
      <ul className="mt-2 flex flex-wrap gap-2">
        {daysOff.length === 0 && <li className="text-sm text-gray-500">Ninguno.</li>}
        {daysOff.map((day) => (
          <li key={day} className="rounded border px-2 py-1 text-sm">
            {day}{" "}
            <button onClick={() => removeDay(day)} className="text-red-600">✕</button>
          </li>
        ))}
      </ul>

      {error && <p className="mt-2 text-red-600">{error}</p>}
    </li>
  );
}

export default function AdminStylists() {
  const [stylists, setStylists] = useState([]);
  const [services, setServices] = useState([]);

  async function load() {
    const [st, sv] = await Promise.all([api.get("/stylists"), api.get("/services")]);
    setStylists(st.data);
    setServices(sv.data);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold">Gestionar estilistas</h1>
      {stylists.length === 0 && (
        <p className="mt-4 text-gray-500">No hay estilistas todavía.</p>
      )}
      <ul className="mt-4 space-y-4">
        {stylists.map((s) => (
          <StylistCard key={s._id} stylist={s} allServices={services} onChanged={load} />
        ))}
      </ul>
    </div>
  );
}