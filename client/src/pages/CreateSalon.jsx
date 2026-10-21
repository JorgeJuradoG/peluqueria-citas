import { useState } from "react";
import api from "../services/api";

const TIMEZONES = [
  "Europe/Madrid",
  "Atlantic/Canary",
  "Europe/Lisbon",
  "Europe/London",
  "Europe/Paris",
  "America/Mexico_City",
  "America/Bogota",
  "America/Argentina/Buenos_Aires",
  "America/Santiago",
];

const slugify = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export default function CreateSalon() {
  const [form, setForm] = useState({
    salonName: "",
    slug: "",
    timezone: "Europe/Madrid",
    adminName: "",
    email: "",
    password: "",
  });
  const [slugEdited, setSlugEdited] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    if (name === "slug") {
      setSlugEdited(true);
      return setForm({ ...form, slug: slugify(value) });
    }
    const next = { ...form, [name]: value };
    // Mientras no lo toques a mano, la dirección sigue al nombre
    if (name === "salonName" && !slugEdited) next.slug = slugify(value);
    setForm(next);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!PASSWORD_RE.test(form.password)) {
      return setError("La contraseña debe tener al menos 8 caracteres, una letra y un número");
    }
    setLoading(true);
    try {
      const { data } = await api.post("/salons", form);
      // Dejamos la sesión lista para esa peluquería y entramos en su panel
      localStorage.setItem(`token:${data.salon.slug}`, data.token);
      localStorage.setItem(`user:${data.salon.slug}`, JSON.stringify(data.user));
      window.location.href = `/s/${data.salon.slug}/admin/servicios`;
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo conectar con el servidor");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <a href="/" className="text-sm text-gold-dark underline">← Volver</a>
      <form onSubmit={handleSubmit} className="card mt-4" noValidate>
        <h1 className="text-3xl font-bold">Crea tu peluquería</h1>
        <p className="mt-1 text-sm text-ink/60">
          Tú serás el administrador. Después añadirás servicios y estilistas.
        </p>

        <h2 className="mt-6 text-lg font-semibold">Tu negocio</h2>
        <div className="mt-3 space-y-4">
          <div>
            <label className="label">Nombre de la peluquería</label>
            <input name="salonName" value={form.salonName} onChange={handleChange}
              className="input" required />
          </div>
          <div>
            <label className="label">Dirección web</label>
            <div className="flex items-center gap-1">
              <span className="text-sm text-ink/50">/s/</span>
              <input name="slug" value={form.slug} onChange={handleChange}
                className="input" required />
            </div>
            <p className="mt-1 text-xs text-ink/50">
              Tus clientes entrarán por /s/{form.slug || "tu-peluqueria"}
            </p>
          </div>
          <div>
            <label className="label">Zona horaria</label>
            <select name="timezone" value={form.timezone} onChange={handleChange} className="input">
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>
        </div>

        <h2 className="mt-6 text-lg font-semibold">Tu cuenta de administrador</h2>
        <div className="mt-3 space-y-4">
          <div>
            <label className="label">Tu nombre</label>
            <input name="adminName" value={form.adminName} onChange={handleChange}
              autoComplete="name" className="input" required />
          </div>
          <div>
            <label className="label">Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange}
              autoComplete="email" className="input" required />
          </div>
          <div>
            <label className="label">Contraseña</label>
            <input name="password" type="password" value={form.password}
              onChange={handleChange} autoComplete="new-password" className="input" required />
            <p className="mt-1 text-xs text-ink/50">
              Mínimo 8 caracteres, con una letra y un número.
            </p>
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <button className="btn-primary mt-6 w-full" disabled={loading}>
          {loading ? "Creando..." : "Crear peluquería"}
        </button>
      </form>
    </div>
  );
}