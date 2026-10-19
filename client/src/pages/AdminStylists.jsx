import { useEffect, useState } from "react";
import api from "../services/api";

const DAYS = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
];

function WorkingHoursEditor({ workingHours, onSave }) {
  const [rows, setRows] = useState(
    workingHours.map(({ dayOfWeek, start, end }) => ({ dayOfWeek, start, end }))
  );

  function update(index, field, value) {
    setRows(rows.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }

  function addRow(dayOfWeek) {
    setRows([...rows, { dayOfWeek, start: "09:00", end: "14:00" }]);
  }

  function removeRow(index) {
    setRows(rows.filter((_, i) => i !== index));
  }

  return (
    <div>
      {DAYS.map((day) => (
        <div key={day.value} className="mt-2 flex flex-wrap items-center gap-2">
          <span className="w-24">{day.label}</span>
          {rows.map((r, i) =>
            r.dayOfWeek !== day.value ? null : (
              <span key={i} className="flex items-center gap-1 rounded border px-2 py-1">
                <input type="time" value={r.start}
                  onChange={(e) => update(i, "start", e.target.value)} />
                –
                <input type="time" value={r.end}
                  onChange={(e) => update(i, "end", e.target.value)} />
                <button onClick={() => removeRow(i)} className="text-red-600">✕</button>
              </span>
            )
          )}
          <button onClick={() => addRow(day.value)} className="text-sm underline">
            + franja
          </button>
        </div>
      ))}
      <button
        onClick={() => onSave(rows)}
        className="mt-3 rounded bg-black px-3 py-1 text-white"
      >
        Guardar horario
      </button>
    </div>
  );
}

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
        <h3 className="mt-3 font-medium">Horario semanal</h3>
        <WorkingHoursEditor
            workingHours={stylist.workingHours}
            onSave={(workingHours) => save({ workingHours })}
          />
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