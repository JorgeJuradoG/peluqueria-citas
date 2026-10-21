import { useEffect, useState } from "react";
import api from "../services/api";
import { useToast } from "../context/UIContext.jsx";

const emptyForm = { name: "", durationMinutes: 30, price: 0 };

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const toast = useToast();


  async function load() {
    const { data } = await api.get("/services", { params: { all: true } });
    setServices(data);
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
    try {
      if (editingId) {
        await api.put(`/services/${editingId}`, form);
      } else {
        await api.post("/services", form);
      }
      setForm(emptyForm);
      setEditingId(null);
      toast.success(editingId ? "Servicio actualizado" : "Servicio creado");
      load();
    } catch (err) {
      const data = err.response?.data;
      setError(data?.errors?.join(". ") || data?.message || "No se pudo guardar");
    }
  }

  function startEdit(s) {
    setEditingId(s._id);
    setForm({ name: s.name, durationMinutes: s.durationMinutes, price: s.price });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function toggleActive(s) {
    try {
      await api.put(`/services/${s._id}`, { active: !s.active });
      toast.success(s.active ? "Servicio desactivado" : "Servicio reactivado");
      load();
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo actualizar");
    }
  }



return (
  <div>
    <h1 className="text-4xl font-bold">Gestionar servicios</h1>

    <form onSubmit={handleSubmit} className="card mt-6">
      <h2 className="text-xl font-semibold">
        {editingId ? "Editar servicio" : "Nuevo servicio"}
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label">Nombre</label>
          <input name="name" value={form.name} onChange={handleChange}
            className="input" required />
        </div>
        <div>
          <label className="label">Duración (min)</label>
          <input name="durationMinutes" type="number" min="5" step="5"
            value={form.durationMinutes} onChange={handleChange}
            className="input" required />
        </div>
        <div>
          <label className="label">Precio (€)</label>
          <input name="price" type="number" min="0" step="0.5"
            value={form.price} onChange={handleChange}
            className="input" required />
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="mt-5 flex gap-3">
        <button className="btn-primary">
          {editingId ? "Guardar cambios" : "Crear servicio"}
        </button>
        {editingId && (
          <button type="button" onClick={cancelEdit} className="btn-outline">
            Cancelar
          </button>
        )}
      </div>
    </form>

    <ul className="mt-6 space-y-3">
      {services.map((s) => (
        <li key={s._id}
          className={`card flex flex-wrap items-center justify-between gap-3 ${
            s.active ? "" : "opacity-50"
          }`}>
          <div>
            <p className="font-display text-lg font-semibold">
              {s.name}
              {!s.active && (
                <span className="ml-2 rounded-full bg-stone-200 px-2 py-0.5 font-sans text-xs font-medium text-stone-700">
                  Desactivado
                </span>
              )}
            </p>
            <p className="text-sm text-ink/60">{s.durationMinutes} min · {s.price} €</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => startEdit(s)} className="btn-outline">Editar</button>
            <button onClick={() => toggleActive(s)} className="btn-outline">
              {s.active ? "Desactivar" : "Reactivar"}
            </button>
          </div>
        </li>
      ))}
    </ul>
  </div>
);
}