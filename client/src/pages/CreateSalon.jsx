import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Globe,
  Link2,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Palette,
  Phone,
  Quote,
  Store,
  Type,
  UserRound,
} from "lucide-react";
import api from "../services/api";
import ThemeToggle from "../components/ThemeToggle";
import BrandIcon from "../components/BrandIcon";
import Stepper from "../components/Stepper";
import Switch from "../components/Switch";
import { InstagramIcon } from "../components/SocialLinks";
import BrandingPicker, { BrandingPreview } from "../components/BrandingPicker";
import { ErrorAlert, Field, PasswordField } from "../components/FormField";
import { DEFAULT_BRANDING, ensureFont } from "../lib/theme";

const STEPS = ["Negocio", "Estilo", "Contenido", "Cuenta"];

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
const PHONE_RE = /^\+?[\d\s-]{9,15}$/;

function TextArea({ label, name, value, onChange, max, rows = 3, placeholder, hint }) {
  return (
    <div>
      <label className="block">
        <span className="label">
          {label} <span className="text-ink/60">(opcional)</span>
        </span>
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          maxLength={max}
          rows={rows}
          placeholder={placeholder}
          className="input resize-y"
        />
      </label>
      <p className="mt-1 flex justify-between gap-3 text-xs text-ink/60">
        <span>{hint}</span>
        <span>
          {value.length}/{max}
        </span>
      </p>
    </div>
  );
}

export default function CreateSalon() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    salonName: "",
    slug: "",
    timezone: "Europe/Madrid",
    heroTitle: "",
    tagline: "",
    about: "",
    hours: "",
    address: "",
    phone: "",
    adminName: "",
    email: "",
    password: "",
  });
  const [social, setSocial] = useState({ instagram: "", whatsapp: "", website: "" });
  const [sections, setSections] = useState({ howItWorks: true, perks: true });
  const [branding, setBranding] = useState(DEFAULT_BRANDING);
  const [slugEdited, setSlugEdited] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const last = STEPS.length - 1;

  // La tipografía elegida se carga para que la vista previa la muestre
  useEffect(() => {
    ensureFont(branding.font);
  }, [branding.font]);

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

  function handleSocial(e) {
    setSocial({ ...social, [e.target.name]: e.target.value });
  }

  function validateStep(s) {
    if (s === 0) {
      if (form.salonName.trim().length < 2) return "Escribe el nombre de tu peluquería";
      if (form.slug.length < 3) return "La dirección web tiene al menos 3 caracteres";
    }
    if (s === 2) {
      if (form.phone.trim() && !PHONE_RE.test(form.phone.trim())) return "Teléfono no válido";
    }
    if (s === 3) {
      if (form.adminName.trim().length < 2) return "Escribe tu nombre";
      if (!EMAIL_RE.test(form.email.trim())) return "Introduce un email válido";
      if (!PASSWORD_RE.test(form.password))
        return "La contraseña debe tener al menos 8 caracteres, una letra y un número";
    }
    return "";
  }

  function goTo(s) {
    setError("");
    setStep(s);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function next() {
    const problem = validateStep(step);
    if (problem) return setError(problem);
    goTo(step + 1);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (step < last) return next(); // Intro en un paso intermedio = Siguiente

    for (let s = 0; s <= last; s++) {
      const problem = validateStep(s);
      if (problem) {
        setStep(s);
        return setError(problem);
      }
    }

    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/salons", { ...form, branding, social, sections });
      // Dejamos la sesión lista para esa peluquería y entramos en su panel
      localStorage.setItem(`token:${data.salon.slug}`, data.token);
      localStorage.setItem(`user:${data.salon.slug}`, JSON.stringify(data.user));
      window.location.href = `/s/${data.salon.slug}/admin`;
    } catch (err) {
      if (err.response?.status === 409) setStep(0); // la dirección ya existe
      setError(err.response?.data?.message || "No se pudo conectar con el servidor");
      setLoading(false);
    }
  }

  const showPreviewOnMobile = step === 1 || step === 2;
  const preview = (
    <BrandingPreview
      branding={branding}
      name={form.salonName}
      tagline={form.tagline}
      heroTitle={form.heroTitle}
    />
  );

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-sand">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight">
            <BrandIcon name="scissors" className="h-5 w-5 text-gold" aria-hidden="true" />
            Citas<span className="text-gold">.</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gold-dark hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver
        </Link>

        <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <form onSubmit={handleSubmit} className="card" noValidate>
            <h1 className="text-3xl font-bold">Crea tu peluquería</h1>
            <p className="mt-1 text-sm text-ink/70">
              Tú serás el administrador. Todo lo que elijas se puede cambiar más adelante.
            </p>

            <div className="mt-6">
              <Stepper steps={STEPS} current={step} />
            </div>

            <div key={step} className="mt-8 animate-fade-up">
              {/* ---------- 1. Negocio ---------- */}
              {step === 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Tu negocio</h2>
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
              )}

              {/* ---------- 2. Estilo ---------- */}
              {step === 1 && (
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-semibold">
                    <Palette className="h-5 w-5 text-gold-dark" aria-hidden="true" />
                    El estilo de tu peluquería
                  </h2>
                  <div className="mt-4 lg:hidden">
                    <p className="label">Vista previa</p>
                    {preview}
                  </div>
                  <div className="mt-5">
                    <BrandingPicker value={branding} onChange={setBranding} />
                  </div>
                </div>
              )}

              {/* ---------- 3. Contenido ---------- */}
              {step === 2 && (
                <div className="space-y-8">
                  <div className="lg:hidden">
                    <p className="label">Vista previa</p>
                    {preview}
                  </div>

                  <section className="space-y-4">
                    <h2 className="text-xl font-semibold">Tu portada</h2>
                    <Field
                      label="Título de la portada"
                      icon={Type}
                      optional
                      hint="Por defecto: «Tu próxima cita, a un par de clics»."
                    >
                      <input
                        name="heroTitle"
                        value={form.heroTitle}
                        onChange={handleChange}
                        maxLength={80}
                        placeholder="Tu mejor versión empieza aquí"
                        className="input pl-9"
                      />
                    </Field>
                    <Field label="Eslogan" icon={Quote} optional>
                      <input
                        name="tagline"
                        value={form.tagline}
                        onChange={handleChange}
                        maxLength={120}
                        placeholder="Cortes con carácter desde 1998"
                        className="input pl-9"
                      />
                    </Field>
                    <TextArea
                      label="Sobre nosotros"
                      name="about"
                      value={form.about}
                      onChange={handleChange}
                      max={600}
                      rows={4}
                      placeholder="Cuéntales quiénes sois, qué os hace diferentes..."
                      hint="Aparece en una sección propia de la portada."
                    />
                  </section>

                  <section className="space-y-4">
                    <h2 className="text-xl font-semibold">Contacto y horario</h2>
                    <Field label="Dirección del local" icon={MapPin} optional>
                      <input
                        name="address"
                        value={form.address}
                        onChange={handleChange}
                        maxLength={160}
                        autoComplete="street-address"
                        className="input pl-9"
                      />
                    </Field>
                    <Field label="Teléfono del local" icon={Phone} optional>
                      <input
                        name="phone"
                        type="tel"
                        value={form.phone}
                        onChange={handleChange}
                        className="input pl-9"
                      />
                    </Field>
                    <TextArea
                      label="Horario de apertura"
                      name="hours"
                      value={form.hours}
                      onChange={handleChange}
                      max={200}
                      rows={3}
                      placeholder={"Lunes a viernes: 9:00-20:00\nSábados: 10:00-14:00"}
                      hint="Es informativo: los horarios de reserva los defines por estilista."
                    />
                  </section>

                  <section className="space-y-4">
                    <h2 className="text-xl font-semibold">Redes</h2>
                    <Field label="Instagram" icon={InstagramIcon} optional hint="Tu usuario, con o sin @.">
                      <input
                        name="instagram"
                        value={social.instagram}
                        onChange={handleSocial}
                        placeholder="@tu_peluqueria"
                        className="input pl-9"
                      />
                    </Field>
                    <Field
                      label="WhatsApp"
                      icon={MessageCircle}
                      optional
                      hint="Con el prefijo del país, por ejemplo +34 600 123 456."
                    >
                      <input
                        name="whatsapp"
                        type="tel"
                        value={social.whatsapp}
                        onChange={handleSocial}
                        className="input pl-9"
                      />
                    </Field>
                    <Field label="Sitio web" icon={Globe} optional>
                      <input
                        name="website"
                        value={social.website}
                        onChange={handleSocial}
                        placeholder="https://tupeluqueria.com"
                        className="input pl-9"
                      />
                    </Field>
                  </section>

                  <section className="space-y-4">
                    <h2 className="text-xl font-semibold">Secciones de la portada</h2>
                    <Switch
                      checked={sections.howItWorks}
                      onChange={(v) => setSections({ ...sections, howItWorks: v })}
                      label="Cómo funciona"
                      hint="Los tres pasos para reservar."
                    />
                    <Switch
                      checked={sections.perks}
                      onChange={(v) => setSections({ ...sections, perks: v })}
                      label="Ventajas"
                      hint="Tiempo real, avisos por correo y calendario."
                    />
                  </section>
                </div>
              )}

              {/* ---------- 4. Cuenta ---------- */}
              {step === 3 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Tu cuenta de administrador</h2>
                  <p className="rounded-xl bg-sand/50 px-4 py-3 text-sm text-ink/70">
                    Vas a crear <b className="text-ink">{form.salonName}</b> en{" "}
                    <b className="text-ink">/s/{form.slug}</b>.
                  </p>
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
              )}
            </div>

            {error && (
              <div className="mt-6">
                <ErrorAlert>{error}</ErrorAlert>
              </div>
            )}

            <div className="mt-8 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => goTo(step - 1)}
                disabled={step === 0 || loading}
                className="btn-outline"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Atrás
              </button>

              {step < last ? (
                <button type="submit" className="btn-primary">
                  Siguiente
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              ) : (
                <button className="btn-primary" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  {loading ? "Creando..." : "Crear peluquería"}
                </button>
              )}
            </div>
          </form>

          <aside className="hidden lg:sticky lg:top-6 lg:block">
            <p className="label">Vista previa</p>
            {preview}
            <p className="mt-3 text-xs text-ink/60">
              Así verán tus clientes tu peluquería. Cambia las opciones y se actualiza al instante.
            </p>
          </aside>
        </div>
      </main>
    </div>
  );
}