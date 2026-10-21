import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Globe,
  Link2,
  Loader2,
  Mail,
  Scissors,
  Store,
  UserRound,
} from "lucide-react";
import api from "../services/api";
import ThemeToggle from "../components/ThemeToggle";
import { ErrorAlert, Field, PasswordField } from "../components/FormField";

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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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

  function validate() {
    if (form.salonName.trim().length < 2) return "Escribe el nombre de tu peluquería";
    if (form.slug.length < 3) return "La dirección web tiene al menos 3 caracteres";
    if (form.adminName.trim().length < 2) return "Escribe tu nombre";
    if (!EMAIL_RE.test(form.email.trim())) return "Introduce un email válido";
    if (!PASSWORD_RE.test(form.password))
      return "La contraseña debe tener al menos 8 caracteres, una letra y un número";
    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const problem = validate();
    if (problem) return setError(problem);

    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/salons", form);
      // Dejamos la sesión lista para esa peluquería y entramos en su panel
      localStorage.setItem(`token:${data.salon.slug}`, data.token);
      localStorage.setItem(`user:${data.salon.slug}`, JSON.stringify(data.user));
      window.location.href = `/s/${data.salon.slug}/admin`;
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo conectar con el servidor");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-sand">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight">
            <Scissors className="h-5 w-5 text-gold" aria-hidden="true" />
            Citas<span className="text-gold">.</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 animate-fade-up px-4 py-10">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gold-dark hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver
        </Link>

        <form onSubmit={handleSubmit} className="card mt-4" noValidate>
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink text-gold">
            <Store className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-3xl font-bold">Crea tu peluquería</h1>
          <p className="mt-1 text-sm text-ink/70">
            Tú serás el administrador. Después añadirás servicios y estilistas.
          </p>

          <h2 className="mt-6 text-lg font-semibold">Tu negocio</h2>
          <div className="mt-3 space-y-4">
            <Field label="Nombre de la peluquería" icon={Store}>
              <input
                name="salonName"
                value={form.salonName}
                onChange={handleChange}
                className="input pl-9"
                required
              />
            </Field>
            <Field
              label="Dirección web"
              icon={Link2}
              hint={`Tus clientes entrarán por /s/${form.slug || "tu-peluqueria"}`}
            >
              <input
                name="slug"
                value={form.slug}
                onChange={handleChange}
                className="input pl-9"
                required
              />
            </Field>
            <Field label="Zona horaria" icon={Globe}>
              <select
                name="timezone"
                value={form.timezone}
                onChange={handleChange}
                className="input pl-9"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <h2 className="mt-6 text-lg font-semibold">Tu cuenta de administrador</h2>
          <div className="mt-3 space-y-4">
            <Field label="Tu nombre" icon={UserRound}>
              <input
                name="adminName"
                value={form.adminName}
                onChange={handleChange}
                autoComplete="name"
                className="input pl-9"
                required
              />
            </Field>
            <Field label="Email" icon={Mail}>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                className="input pl-9"
                required
              />
            </Field>
            <PasswordField
              label="Contraseña"
              name="password"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
              hint="Mínimo 8 caracteres, con una letra y un número."
            />
          </div>

          {error && (
            <div className="mt-4">
              <ErrorAlert>{error}</ErrorAlert>
            </div>
          )}

          <button className="btn-primary mt-6 w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {loading ? "Creando..." : "Crear peluquería"}
          </button>
        </form>
      </main>
    </div>
  );
}