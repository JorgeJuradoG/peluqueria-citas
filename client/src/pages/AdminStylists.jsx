import { useEffect, useState } from "react";
import {
  CalendarOff,
  Check,
  ChevronDown,
  Clock,
  Loader2,
  Mail,
  MailWarning,
  Phone,
  Plus,
  Power,
  PowerOff,
  Save,
  Scissors,
  Send,
  StickyNote,
  Trash2,
  TriangleAlert,
  UserRound,
  Users,
} from "lucide-react";
import api from "../services/api";
import { useToast } from "../context/UIContext";
import { Skeleton } from "../components/Skeleton";

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

const formatDay = (iso) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

function Field({ label, icon: Icon, optional, children }) {
  return (
    <div>
      <label className="label">
        {label} {optional && <span className="text-ink/40">(opcional)</span>}
      </label>
      <div className="relative">
        <Icon
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40"
          aria-hidden="true"
        />
        {children}
      </div>
    </div>
  );
}

function ErrorBox({ children }) {
  return (
    <p
      role="alert"
      className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      {children}
    </p>
  );
}

function ServiceChips({ services, selectedIds, onToggle }) {
  if (services.length === 0) {
    return (
      <p className="text-sm text-ink/50">
        Crea primero algún servicio en la sección Servicios.
      </p>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {services.map((s) => {
        const on = selectedIds.includes(s._id);
        return (
          <label
            key={s._id}
            className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
              on ? "border-gold bg-gold/10 font-medium" : "border-sand hover:border-gold"
            }`}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={on}
              onChange={() => onToggle(s._id)}
            />
            {on ? (
              <Check className="h-3.5 w-3.5 text-gold-dark" aria-hidden="true" />
            ) : (
              <Plus className="h-3.5 w-3.5 text-ink/40" aria-hidden="true" />
            )}
            {s.name}
          </label>
        );
      })}
    </div>
  );
}

function CreateStylistForm({ allServices, onCreated, onCancel }) {
  const toast = useToast();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState(null);

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
      <div className="card mt-6 animate-pop">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <Check className="h-6 w-6" aria-hidden="true" />
        </span>
        <h2 className="mt-3 text-xl font-semibold">{created.name} ya forma parte del equipo</h2>
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
          <p className="mt-2 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <MailWarning className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            La cuenta está creada, pero no se pudo enviar el correo. Pulsa «Reenviar invitación»
            en su tarjeta para volver a intentarlo.
          </p>
        )}
        <button onClick={onCancel} className="btn-primary mt-5">Hecho</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card mt-6 animate-fade-up" noValidate>
      <h2 className="flex items-center gap-2 text-xl font-semibold">
        <Plus className="h-5 w-5 text-gold-dark" aria-hidden="true" />
        Añadir estilista
      </h2>
      <p className="mt-1 text-sm text-ink/60">
        Le enviaremos un correo para que elija su contraseña y active su cuenta.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Nombre" icon={UserRound}>
          <input name="name" value={form.name} onChange={handleChange} className="input pl-9" required />
        </Field>
        <Field label="Email" icon={Mail}>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            className="input pl-9"
            required
          />
        </Field>
        <Field label="Teléfono" icon={Phone} optional>
          <input
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            className="input pl-9"
          />
        </Field>
        <Field label="Presentación" icon={StickyNote} optional>
          <input
            name="bio"
            value={form.bio}
            onChange={handleChange}
            className="input pl-9"
            placeholder="Especialista en cortes y color"
          />
        </Field>
      </div>

      <h3 className="mt-5 font-semibold">Servicios que ofrece</h3>
      <div className="mt-2">
        <ServiceChips services={allServices} selectedIds={form.services} onToggle={toggleService} />
      </div>
      <p className="mt-3 text-xs text-ink/50">
        Empieza con horario de lunes a viernes (9-14 y 16-20). Podrás ajustarlo después.
      </p>

      {error && <ErrorBox>{error}</ErrorBox>}

      <div className="mt-5 flex flex-wrap gap-3">
        <button className="btn-primary" disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="h-4 w-4" aria-hidden="true" />
          )}
          {saving ? "Creando..." : "Crear y enviar invitación"}
        </button>
        <button type="button" onClick={onCancel} className="btn-outline">
          Cancelar
        </button>
      </div>
    </form>
  );
}

const normalizeRows = (rows) =>
  rows
    .map(({ dayOfWeek, start, end }) => ({ dayOfWeek, start, end }))
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.start.localeCompare(b.start));

function WorkingHoursEditor({ workingHours, onSave }) {
  const initial = normalizeRows(workingHours);
  const [rows, setRows] = useState(workingHours.map(({ dayOfWeek, start, end }) => ({ dayOfWeek, start, end })));

  const dirty = JSON.stringify(normalizeRows(rows)) !== JSON.stringify(initial);

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
      <div className="divide-y divide-sand rounded-xl border border-sand">
        {DAYS.map((day) => {
          const dayRows = rows
            .map((r, i) => ({ ...r, i }))
            .filter((r) => r.dayOfWeek === day.value);
          return (
            <div key={day.value} className="flex flex-wrap items-center gap-2 px-3 py-2.5">
              <span className="w-24 text-sm font-medium">{day.label}</span>
              {dayRows.length === 0 && (
                <span className="rounded-full bg-sand px-2.5 py-0.5 text-xs text-ink/50">Libre</span>
              )}
              {dayRows.map((r) => (
                <span
                  key={r.i}
                  className="flex flex-wrap items-center gap-1 rounded-lg border border-sand bg-cream px-2 py-1 text-sm"
                >
                  <Clock className="h-3.5 w-3.5 text-ink/40" aria-hidden="true" />
                  <input
                    type="time"
                    value={r.start}
                    onChange={(e) => update(r.i, "start", e.target.value)}
                    aria-label={`${day.label}: inicio`}
                  />
                  –
                  <input
                    type="time"
                    value={r.end}
                    onChange={(e) => update(r.i, "end", e.target.value)}
                    aria-label={`${day.label}: fin`}
                  />
                  <button
                    onClick={() => removeRow(r.i)}
                    aria-label={`Quitar franja del ${day.label}`}
                    className="rounded p-0.5 text-red-600 transition hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
              <button
                onClick={() => addRow(day.value)}
                className="ml-auto flex items-center gap-1 text-sm text-gold-dark transition hover:underline"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                franja
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button onClick={() => onSave(rows)} disabled={!dirty} className="btn-primary">
          <Save className="h-4 w-4" aria-hidden="true" />
          Guardar horario
        </button>
        {dirty && <span className="text-sm text-amber-700">Tienes cambios sin guardar</span>}
      </div>
    </div>
  );
}

function StylistCard({ stylist, allServices, onChanged, defaultOpen }) {
  const toast = useToast();
  const [open, setOpen] = useState(defaultOpen);
  const [newDay, setNewDay] = useState("");
  const [error, setError] = useState("");
  const [inviting, setInviting] = useState(false);

  const offeredIds = stylist.services.map((s) => s._id);
  // Las fechas llegan como ISO (UTC); nos quedamos con AAAA-MM-DD
  const daysOff = stylist.daysOff.map((d) => d.slice(0, 10)).sort();
  const slotCount = stylist.workingHours.length;
  const panelId = `estilista-${stylist._id}`;

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
    <li className={`card animate-fade-up p-0 transition ${stylist.active ? "" : "opacity-60"}`}>
      {/* Cabecera */}
      <div className="flex flex-wrap items-center gap-3 p-5">
        <button
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex min-w-0 flex-1 basis-60 items-center gap-3 rounded-lg text-left"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink font-display text-xl text-cream">
            {stylist.user.name[0]}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-xl font-semibold">{stylist.user.name}</span>
            <span className="block truncate text-sm text-ink/60">{stylist.user.email}</span>
          </span>
          <ChevronDown
            className={`ml-1 h-5 w-5 shrink-0 text-ink/40 transition ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {!stylist.active && (
            <span className="rounded-full bg-stone-200 px-2.5 py-0.5 text-xs font-medium text-stone-700">
              Desactivado
            </span>
          )}
          {stylist.user.pendingInvite && (
            <>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                <MailWarning className="h-3.5 w-3.5" aria-hidden="true" />
                Invitación pendiente
              </span>
              <button onClick={resendInvite} disabled={inviting} className="btn-outline">
                {inviting ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="h-4 w-4" aria-hidden="true" />
                )}
                <span className="hidden sm:inline">{inviting ? "Enviando..." : "Reenviar"}</span>
              </button>
            </>
          )}
          <button onClick={() => save({ active: !stylist.active })} className="btn-outline">
            {stylist.active ? (
              <PowerOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Power className="h-4 w-4" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">{stylist.active ? "Desactivar" : "Reactivar"}</span>
          </button>
        </div>

        {/* Resumen (visible aunque la tarjeta esté cerrada) */}
        <ul className="flex w-full flex-wrap gap-2 text-xs text-ink/60">
          <li className="inline-flex items-center gap-1 rounded-full bg-sand/60 px-2.5 py-1">
            <Scissors className="h-3.5 w-3.5" aria-hidden="true" />
            {stylist.services.length} {stylist.services.length === 1 ? "servicio" : "servicios"}
          </li>
          <li className="inline-flex items-center gap-1 rounded-full bg-sand/60 px-2.5 py-1">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {slotCount} {slotCount === 1 ? "franja" : "franjas"} a la semana
          </li>
          <li className="inline-flex items-center gap-1 rounded-full bg-sand/60 px-2.5 py-1">
            <CalendarOff className="h-3.5 w-3.5" aria-hidden="true" />
            {daysOff.length} {daysOff.length === 1 ? "día libre" : "días libres"}
          </li>
        </ul>
      </div>

      {/* Detalle plegable */}
      {open && (
        <div id={panelId} className="animate-fade-in space-y-8 border-t border-sand p-5">
          <section>
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <Scissors className="h-4 w-4 text-gold-dark" aria-hidden="true" />
              Servicios que ofrece
            </h3>
            <div className="mt-3">
              <ServiceChips
                services={allServices}
                selectedIds={offeredIds}
                onToggle={toggleService}
              />
            </div>
          </section>

          <section>
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <CalendarOff className="h-4 w-4 text-gold-dark" aria-hidden="true" />
              Días libres
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <input
                type="date"
                value={newDay}
                onChange={(e) => setNewDay(e.target.value)}
                className="input max-w-44"
                aria-label="Nuevo día libre"
              />
              <button onClick={addDay} disabled={!newDay} className="btn-outline">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Añadir
              </button>
            </div>
            <ul className="mt-3 flex flex-wrap gap-2">
              {daysOff.length === 0 && <li className="text-sm text-ink/50">Ninguno.</li>}
              {daysOff.map((day) => (
                <li
                  key={day}
                  className="flex items-center gap-1.5 rounded-full bg-sand py-1 pl-3 pr-1.5 text-sm capitalize"
                >
                  {formatDay(day)}
                  <button
                    onClick={() => removeDay(day)}
                    aria-label={`Quitar el día libre ${day}`}
                    className="rounded-full p-0.5 text-red-600 transition hover:bg-red-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <Clock className="h-4 w-4 text-gold-dark" aria-hidden="true" />
              Horario semanal
            </h3>
            <div className="mt-3">
              <WorkingHoursEditor
                workingHours={stylist.workingHours}
                onSave={(workingHours) => save({ workingHours })}
              />
            </div>
          </section>

          {error && <ErrorBox>{error}</ErrorBox>}
        </div>
      )}
    </li>
  );
}

export default function AdminStylists() {
  const [stylists, setStylists] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  async function load() {
    try {
      const [st, sv] = await Promise.all([
        api.get("/stylists/manage/all"),
        api.get("/services"),
      ]);
      setStylists(st.data);
      setServices(sv.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-4xl font-bold">Estilistas</h1>
          <p className="mt-1 text-ink/60">Tu equipo, sus servicios y sus horarios.</p>
        </div>
        {!adding && (
          <button onClick={() => setAdding(true)} className="btn-primary">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Añadir estilista
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

      {loading && (
        <ul className="mt-6 space-y-4">
          {[1, 2].map((n) => (
            <li key={n} className="card flex items-center gap-4">
              <Skeleton className="h-12 w-12 !rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </li>
          ))}
        </ul>
      )}

      {!loading && stylists.length === 0 && !adding && (
        <div className="card mt-6 flex flex-col items-center py-12 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-sand text-ink/40">
            <Users className="h-8 w-8" aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-2xl font-bold">Todavía no tienes estilistas</h2>
          <p className="mt-1 max-w-sm text-sm text-ink/60">
            Añade a tu equipo para que los clientes puedan reservar con ellos.
          </p>
          <button onClick={() => setAdding(true)} className="btn-primary mt-6">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Añadir el primero
          </button>
        </div>
      )}

      <ul className="mt-6 space-y-4">
        {stylists.map((s) => (
          <StylistCard
            key={s._id}
            stylist={s}
            allServices={services}
            onChanged={load}
            defaultOpen={stylists.length === 1}
          />
        ))}
      </ul>
    </div>
  );
}