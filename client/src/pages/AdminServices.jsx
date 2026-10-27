import { useEffect, useState } from "react";
import {
  Clock,
  Euro,
  Loader2,
  Pencil,
  Plus,
  Power,
  PowerOff,
  Save,
  Scissors,
  TriangleAlert,
  X,
} from "lucide-react";
import api from "../services/api";
import { useToast } from "../context/UIContext";
import { Skeleton } from "../components/Skeleton";

const emptyForm = { name: "", durationMinutes: 30, price: 0 };

function Field({ label, icon: Icon, children }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <span className="relative block">
        <Icon
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40"
          aria-hidden="true"
        />
        {children}
      </span>
    </label>
  );
}

export default function AdminServices() {
  const toast = useToast();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const { data } = await api.get("/services", { params: { all: true } });
      setServices(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm({ ...form, [name]: name === "name" ? value : Number(value) });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/services/${editingId}`, form);
      } else {
        await api.post("/services", form);
      }
      toast.success(editingId ? "Servicio actualizado" : "Servicio creado");
      setForm(emptyForm);
      setEditingId(null);
      load();
    } catch (err) {
      const data = err.response?.data;
      setError(data?.errors?.join(". ") || data?.message || "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(s) {
    setEditingId(s._id);
    setForm({ name: s.name, durationMinutes: s.durationMinutes, price: s.price });
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  }

  async function toggleActive(s) {
    try {
      await api.put(`/services/${s._id}`, { active: !s.active });
      toast.success(s.active ? "Servicio desactivado" : "Servicio reactivado");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "No se pudo actualizar");
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-4xl font-bold">Servicios</h1>
      <p className="mt-1 text-ink/70">Lo que ofrece tu peluquería, con su duración y su precio.</p>

      <form onSubmit={handleSubmit} className="card mt-6">
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          {editingId ? (
            <Pencil className="h-5 w-5 text-gold-dark" aria-hidden="true" />
          ) : (
            <Plus className="h-5 w-5 text-gold-dark" aria-hidden="true" />
          )}
          {editingId ? "Editar servicio" : "Nuevo servicio"}
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="Nombre" icon={Scissors}>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="input pl-9"
              required
            />
          </Field>
          <Field label="Duración (min)" icon={Clock}>
            <input
              name="durationMinutes"
              type="number"
              min="5"
              step="5"
              value={form.durationMinutes}
              onChange={handleChange}
              className="input pl-9"
              required
            />
          </Field>
          <Field label="Precio (€)" icon={Euro}>
            <input
              name="price"
              type="number"
              min="0"
              step="0.5"
              value={form.price}
              onChange={handleChange}
              className="input pl-9"
              required
            />
          </Field>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <button className="btn-primary" disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : editingId ? (
              <Save className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Plus className="h-4 w-4" aria-hidden="true" />
            )}
            {editingId ? "Guardar cambios" : "Crear servicio"}
          </button>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="btn-outline">
              <X className="h-4 w-4" aria-hidden="true" />
              Cancelar
            </button>
          )}
        </div>
      </form>

      <ul className="mt-6 space-y-3">
        {loading &&
          [1, 2, 3].map((n) => (
            <li key={n} className="card flex items-center justify-between gap-3">
              <div className="w-full max-w-xs space-y-2">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </div>
              <Skeleton className="h-9 w-32" />
            </li>
          ))}

        {!loading && services.length === 0 && (
          <li className="card flex flex-col items-center py-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-sand text-ink/40">
              <Scissors className="h-7 w-7" aria-hidden="true" />
            </span>
            <p className="mt-3 text-lg font-semibold">Todavía no hay servicios</p>
            <p className="mt-1 text-sm text-ink/70">Crea el primero con el formulario de arriba.</p>
          </li>
        )}

        {services.map((s) => (
          <li
            key={s._id}
            className={`card flex animate-fade-up flex-wrap items-center justify-between gap-3 transition ${
              s.active ? "hover:border-gold" : "opacity-60"
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold-dark">
                <Scissors className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="flex flex-wrap items-center gap-2 font-display text-lg font-semibold">
                  {s.name}
                  {!s.active && (
                    <span className="rounded-full bg-stone-200 px-2 py-0.5 font-sans text-xs font-medium text-stone-700">
                      Desactivado
                    </span>
                  )}
                </p>
                <p className="mt-0.5 flex items-center gap-4 text-sm text-ink/70">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    {s.durationMinutes} min
                  </span>
                  <span className="font-medium text-gold-dark">{s.price} €</span>
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => startEdit(s)}
                className="btn-outline"
                aria-label={`Editar ${s.name}`}
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Editar</span>
              </button>
              <button
                onClick={() => toggleActive(s)}
                className="btn-outline"
                aria-label={`${s.active ? "Desactivar" : "Reactivar"} ${s.name}`}
              >
                {s.active ? (
                  <PowerOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Power className="h-4 w-4" aria-hidden="true" />
                )}
                <span className="hidden sm:inline">{s.active ? "Desactivar" : "Reactivar"}</span>
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}