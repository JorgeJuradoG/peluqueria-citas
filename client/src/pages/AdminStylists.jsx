import { useEffect, useState } from "react";
import api from "../services/api";
import { useToast } from "../context/UIContext.jsx";

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
    <div className="mt-2 divide-y divide-sand">
      {DAYS.map((day) => (
        <div key={day.value} className="flex flex-wrap items-center gap-2 py-2">
          <span className="w-24 text-sm font-medium">{day.label}</span>
          {rows.map((r, i) =>
            r.dayOfWeek !== day.value ? null : (
              <span
                key={i}
                className="flex items-center gap-1 rounded-lg border border-sand bg-cream px-2 py-1 text-sm"
              >
                <input
                  type="time"
                  value={r.start}
                  onChange={(e) => update(i, "start", e.target.value)}
                />
                –
                <input
                  type="time"
                  value={r.end}
                  onChange={(e) => update(i, "end", e.target.value)}
                />
                <button onClick={() => removeRow(i)} className="text-red-600">
                  ✕
                </button>
              </span>
            )
          )}
          <button
            onClick={() => addRow(day.value)}
            className="text-sm text-gold-dark underline"
          >
            + franja
          </button>
        </div>
      ))}
      <div className="pt-4">
        <button onClick={() => onSave(rows)} className="btn-primary">
          Guardar horario
        </button>
      </div>
    </div>
  );
}

function StylistCard({ stylist, allServices, onChanged }) {
  const toast = useToast();
  const [newDay, setNewDay] = useState("");
  const [error, setError] = useState("");

  const offeredIds = stylist.services.map((s) => s._id);
  // Las fechas llegan como ISO (UTC); nos quedamos con AAAA-MM-DD
  const daysOff = stylist.daysOff.map((d) => d.slice(0, 10)).sort();

  async function save(changes) {
  setError("");
  try {
    await api.put(`/stylists/${stylist._id}`, changes);
    toast.success("Cambios guardados");
    onChanged();
  } catch (err) {
    const data = err.response?.data;
    setError(data?.errors?.join(". ") || data?.message || "No se pudo guardar");
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
    <li className="card">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink font-display text-lg text-cream">
          {stylist.user.name[0]}
        </span>
        <div>
          <h2 className="text-xl font-semibold">{stylist.user.name}</h2>
          <p className="text-sm text-ink/60">{stylist.user.email}</p>
        </div>
      </div>

      <h3 className="mt-6 text-lg font-semibold">Servicios que ofrece</h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {allServices.map((s) => {
          const on = offeredIds.includes(s._id);
          return (
            <label
              key={s._id}
              className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1 text-sm transition ${
                on ? "border-gold bg-gold/10" : "border-sand hover:border-gold"
              }`}
            >
              <input
                type="checkbox"
                className="accent-[#b08d57]"
                checked={on}
                onChange={() => toggleService(s._id)}
              />
              {s.name}
            </label>
          );
        })}
      </div>

      <h3 className="mt-6 text-lg font-semibold">Días libres</h3>
      <div className="mt-2 flex gap-2">
        <input
          type="date"
          value={newDay}
          onChange={(e) => setNewDay(e.target.value)}
          className="input max-w-xs"
        />
        <button onClick={addDay} className="btn-outline">
          Añadir
        </button>
      </div>
      <ul className="mt-3 flex flex-wrap gap-2">
        {daysOff.length === 0 && <li className="text-sm text-ink/50">Ninguno.</li>}
        {daysOff.map((day) => (
          <li
            key={day}
            className="flex items-center gap-2 rounded-full bg-sand px-3 py-1 text-sm"
          >
            {day}
            <button onClick={() => removeDay(day)} className="text-red-600">
              ✕
            </button>
          </li>
        ))}
      </ul>

      <h3 className="mt-6 text-lg font-semibold">Horario semanal</h3>
      <WorkingHoursEditor
        workingHours={stylist.workingHours}
        onSave={(workingHours) => save({ workingHours })}
      />

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
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
      <h1 className="text-4xl font-bold">Gestionar estilistas</h1>
      {stylists.length === 0 && (
        <p className="mt-4 text-ink/50">No hay estilistas todavía.</p>
      )}
      <ul className="mt-6 space-y-4">
        {stylists.map((s) => (
          <StylistCard key={s._id} stylist={s} allServices={services} onChanged={load} />
        ))}
      </ul>
    </div>
  );
}