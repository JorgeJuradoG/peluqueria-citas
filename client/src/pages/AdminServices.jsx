import { useEffect, useState } from "react";
import api from "../services/api";

const emptyForm = { name: "", durationMinutes: 30, price: 0 };

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

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
      load();
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo actualizar");
    }
  }

  const input = "rounded border p-2";

  return (
    <div>
      <h1 className="text-3xl font-bold">Gestionar servicios</h1>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col text-sm">
          Nombre
          <input name="name" value={form.name} onChange={handleChange}
            className={input} required />
        </label>
        <label className="flex flex-col text-sm">
          Duración (min)
          <input name="durationMinutes" type="number" min="5" step="5"
            value={form.durationMinutes} onChange={handleChange}
            className={`${input} w-28`} required />
        </label>
        <label className="flex flex-col text-sm">
          Precio (€)
          <input name="price" type="number" min="0" step="0.5"
            value={form.price} onChange={handleChange}
            className={`${input} w-28`} required />
        </label>
        <button className="rounded bg-black px-4 py-2 text-white">
          {editingId ? "Guardar cambios" : "Crear servicio"}
        </button>
        {editingId && (
          <button type="button" onClick={cancelEdit} className="underline">
            Cancelar
          </button>
        )}
      </form>

      {error && <p className="mt-3 text-red-600">{error}</p>}

      <ul className="mt-6 space-y-2">
        {services.map((s) => (
          <li key={s._id}
            className={`flex items-center justify-between rounded border p-3 ${s.active ? "" : "opacity-50"}`}>
            <span>
              {s.name} · {s.durationMinutes} min · {s.price} €
              {!s.active && " (desactivado)"}
            </span>
            <span className="flex gap-4">
              <button onClick={() => startEdit(s)} className="underline">Editar</button>
              <button onClick={() => toggleActive(s)} className="underline">
                {s.active ? "Desactivar" : "Reactivar"}
              </button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}