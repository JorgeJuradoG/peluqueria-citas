import { useEffect, useState } from "react";
import api from "../services/api";
import { useToast } from "../context/UIContext";

const DAYS = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const emptyForm = { name: "", email: "", phone: "", bio: "", services: [] };

function CreateStylistForm({ allServices, onCreated, onCancel }) {
  const toast = useToast();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState(null); // { name, email, accountCreated, invitationSent }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function toggleService(id) {
    setForm({
      ...form,
      services: form.services.includes(id)
        ? form.services.filter((s) => s !== id)
        : [...form.services, id],
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (form.name.trim().length < 2) return setError("El nombre debe tener al menos 2 caracteres");
    if (!EMAIL_RE.test(form.email.trim())) return setError("Introduce un email válido");

    setSaving(true);
    try {
      const { data } = await api.post("/stylists", form);
      toast.success("Estilista creado");
      setCreated({
        name: form.name,
        email: form.email.trim(),
        accountCreated: data.accountCreated,
        invitationSent: data.invitationSent,
      });
      onCreated();
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo crear el estilista");
    } finally {
      setSaving(false);
    }
  }

  if (created) {
    return (
      <div className="card mt-6">
        <h2 className="text-xl font-semibold">{created.name} ya forma parte del equipo</h2>
        {!created.accountCreated ? (
          <p className="mt-2 text-sm text-ink/70">
            Ya tenía cuenta como cliente en tu peluquería, así que entra con su contraseña de
            siempre.
          </p>
        ) : created.invitationSent ? (
          <p className="mt-2 text-sm text-ink/70">
            Hemos enviado una invitación a <b>{created.email}</b>. Con el enlace elegirá su
            contraseña y activará su cuenta. Caduca en 7 días.
          </p>
        ) : (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            La cuenta está creada, pero no se pudo enviar el correo. Pulsa «Reenviar
            invitación» en su tarjeta para volver a intentarlo.
          </p>
        )}
        <button onClick={onCancel} className="btn-primary mt-5">Hecho</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card mt-6" noValidate>
      <h2 className="text-xl font-semibold">Añadir estilista</h2>
      <p className="mt-1 text-sm text-ink/60">
        Le enviaremos un correo para que elija su contraseña y active su cuenta.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Nombre</label>
          <input name="name" value={form.name} onChange={handleChange} className="input" required />
        </div>
        <div>
          <label className="label">Email</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            className="input"
            required
          />
        </div>
        <div>
          <label className="label">
            Teléfono <span className="text-ink/40">(opcional)</span>
          </label>
          <input
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            className="input"
          />
        </div>
        <div>
          <label className="label">
            Presentación <span className="text-ink/40">(opcional)</span>
          </label>
          <input
            name="bio"
            value={form.bio}
            onChange={handleChange}
            className="input"
            placeholder="Especialista en cortes y color"
          />
        </div>
      </div>

      <h3 className="mt-5 font-semibold">Servicios que ofrece</h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {allServices.length === 0 && (
          <p className="text-sm text-ink/50">
            Crea primero algún servicio en la sección Servicios.
          </p>
        )}
        {allServices.map((s) => {
          const on = form.services.includes(s._id);
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
      <p className="mt-3 text-xs text-ink/50">
        Empieza con horario de lunes a viernes (9-14 y 16-20). Podrás ajustarlo después.
      </p>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="mt-5 flex gap-3">
        <button className="btn-primary" disabled={saving}>
          {saving ? "Creando..." : "Crear y enviar invitación"}
        </button>
        <button type="button" onClick={onCancel} className="btn-outline">
          Cancelar
        </button>
      </div>
    </form>
  );
}

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
                className="flex flex-wrap items-center gap-1 rounded-lg border border-sand bg-cream px-2 py-1 text-sm"
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
  const [inviting, setInviting] = useState(false);

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

  async function resendInvite() {
    setInviting(true);
    try {
      const { data } = await api.post(`/stylists/${stylist._id}/invite`);
      if (data.invitationSent) toast.success(`Invitación enviada a ${stylist.user.email}`);
      else toast.error("No se pudo enviar el correo. Inténtalo de nuevo");
    } catch (err) {
      toast.error(err.response?.data?.message || "No se pudo reenviar la invitación");
    } finally {
      setInviting(false);
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
    <li className={`card ${stylist.active ? "" : "opacity-60"}`}>
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink font-display text-lg text-cream">
          {stylist.user.name[0]}
        </span>
        <div>
          <h2 className="text-xl font-semibold">{stylist.user.name}</h2>
          <p className="text-sm text-ink/60">{stylist.user.email}</p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          {!stylist.active && (
            <span className="rounded-full bg-stone-200 px-2.5 py-0.5 text-xs font-medium text-stone-700">
              Desactivado
            </span>
          )}
          {stylist.user.pendingInvite && (
            <>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                Invitación pendiente
              </span>
              <button onClick={resendInvite} disabled={inviting} className="btn-outline">
                {inviting ? "Enviando..." : "Reenviar invitación"}
              </button>
            </>
          )}
          <button
            onClick={() => save({ active: !stylist.active })}
            className="btn-outline"
          >
            {stylist.active ? "Desactivar" : "Reactivar"}
          </button>
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
  const [adding, setAdding] = useState(false);

  async function load() {
    const [st, sv] = await Promise.all([
      api.get("/stylists/manage/all"),
      api.get("/services"),
    ]);
    setStylists(st.data);
    setServices(sv.data);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl font-bold">Gestionar estilistas</h1>
        {!adding && (
          <button onClick={() => setAdding(true)} className="btn-primary">
            + Añadir estilista
          </button>
        )}
      </div>

      {adding && (
        <CreateStylistForm
          allServices={services}
          onCreated={load}
          onCancel={() => setAdding(false)}
        />
      )}

      {stylists.length === 0 && !adding && (
        <div className="card mt-6 text-center">
          <p className="text-ink/60">Todavía no tienes estilistas.</p>
          <button onClick={() => setAdding(true)} className="btn-primary mt-4">
            Añadir el primero
          </button>
        </div>
      )}

      <ul className="mt-6 space-y-4">
        {stylists.map((s) => (
          <StylistCard key={s._id} stylist={s} allServices={services} onChanged={load} />
        ))}
      </ul>
    </div>
  );
}