import { useEffect, useMemo, useState } from "react";
import {
  ExternalLink,
  Globe,
  Loader2,
  MapPin,
  MessageCircle,
  Phone,
  Quote,
  Save,
  Store,
  Type,
  Undo2,
} from "lucide-react";
import api from "../services/api";
import { useSalon } from "../context/SalonContext";
import { useToast } from "../context/UIContext";
import Switch from "../components/Switch";
import StaffTermPicker from "../components/StaffTermPicker";
import { InstagramIcon } from "../components/SocialLinks";
import BrandingPicker, { BrandingPreview } from "../components/BrandingPicker";
import { ErrorAlert, Field } from "../components/FormField";
import { DEFAULT_BRANDING, ensureFont } from "../lib/theme";

const PHONE_RE = /^\+?[\d\s-]{9,15}$/;
const BRAND_KEYS = Object.keys(DEFAULT_BRANDING);

// Estado editable a partir de la peluquería guardada
const toState = (s) => ({
  name: s.name ?? "",
  staffTerm: s.staffTerm ?? "estilista",
  heroTitle: s.heroTitle ?? "",
  tagline: s.tagline ?? "",
  about: s.about ?? "",
  hours: s.hours ?? "",
  address: s.address ?? "",
  phone: s.phone ?? "",
  social: {
    instagram: s.social?.instagram ?? "",
    whatsapp: s.social?.whatsapp ?? "",
    website: s.social?.website ?? "",
  },
  sections: {
    howItWorks: s.sections?.howItWorks !== false,
    perks: s.sections?.perks !== false,
  },
  branding: { ...DEFAULT_BRANDING, ...(s.branding ?? {}) },
});

// Huella estable para saber si hay cambios sin guardar
const fingerprint = (v) =>
  JSON.stringify([
    v.name,
    v.staffTerm,
    v.heroTitle,
    v.tagline,
    v.about,
    v.hours,
    v.address,
    v.phone,
    v.social.instagram,
    v.social.whatsapp,
    v.social.website,
    v.sections.howItWorks,
    v.sections.perks,
    ...BRAND_KEYS.map((k) => String(v.branding[k]).toLowerCase()),
  ]);

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

function Section({ title, text, children }) {
  return (
    <section className="card">
      <h2 className="text-xl font-semibold">{title}</h2>
      {text && <p className="mt-1 text-sm text-ink/70">{text}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export default function Appearance() {
  const salon = useSalon();
  const toast = useToast();

  const saved = useMemo(() => toState(salon), [salon]);
  const [form, setForm] = useState(saved);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const dirty = fingerprint(form) !== fingerprint(saved);

  // La tipografía elegida se carga para que la vista previa la muestre
  useEffect(() => {
    ensureFont(form.branding.font);
  }, [form.branding.font]);

  // Aviso del navegador si se intenta cerrar la pestaña con cambios sin guardar
  useEffect(() => {
    if (!dirty) return;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const field = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const socialField = (e) =>
    setForm({ ...form, social: { ...form.social, [e.target.name]: e.target.value } });

  function discard() {
    setForm(saved);
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!dirty) return;

    if (form.name.trim().length < 2) return setError("El nombre debe tener al menos 2 caracteres");
    if (form.phone.trim() && !PHONE_RE.test(form.phone.trim())) return setError("Teléfono no válido");

    setError("");
    setSaving(true);
    try {
      const { data } = await api.put("/salon-settings", form);
      salon.updateSalon(data); // la web entera adopta el tema nuevo
      toast.success("Apariencia guardada");
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  const link = `/s/${salon.slug}`;

  return (
    <div className="mx-auto max-w-5xl pb-24">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-4xl font-bold">Apariencia</h1>
          <p className="mt-1 text-ink/70">Cómo se ve tu peluquería para tus clientes.</p>
        </div>
        <a href={link} target="_blank" rel="noopener noreferrer" className="btn-outline">
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
          Ver mi web
        </a>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start"
      >
        <div className="min-w-0 space-y-6">
          <div className="lg:hidden">
            <p className="label">Vista previa</p>
            <BrandingPreview
              branding={form.branding}
              name={form.name}
              tagline={form.tagline}
              heroTitle={form.heroTitle}
            />
          </div>

          <Section title="Tu negocio">
            <Field label="Nombre de la peluquería" icon={Store}>
              <input
                name="name"
                value={form.name}
                onChange={field}
                className="input pl-9"
                required
              />
            </Field>
            <p className="rounded-xl bg-sand/50 px-4 py-3 text-sm text-ink/70">
              Dirección web: <b className="text-ink">/s/{salon.slug}</b> · Zona horaria:{" "}
              <b className="text-ink">{salon.timezone}</b>. Estos dos datos no se pueden cambiar
              porque los clientes ya pueden tener tu enlace y tus citas dependen de la zona horaria.
            </p>
            <StaffTermPicker
              value={form.staffTerm}
              onChange={(staffTerm) => setForm({ ...form, staffTerm })}
            />
          </Section>

          <Section title="Estilo" text="Elige un punto de partida y ajusta cada detalle.">
            <BrandingPicker
              value={form.branding}
              onChange={(branding) => setForm({ ...form, branding })}
            />
          </Section>

          <Section title="Tu portada">
            <Field
              label="Título de la portada"
              icon={Type}
              optional
              hint="Por defecto: «Tu próxima cita, a un par de clics»."
            >
              <input
                name="heroTitle"
                value={form.heroTitle}
                onChange={field}
                maxLength={80}
                className="input pl-9"
              />
            </Field>
            <Field label="Eslogan" icon={Quote} optional>
              <input
                name="tagline"
                value={form.tagline}
                onChange={field}
                maxLength={120}
                className="input pl-9"
              />
            </Field>
            <TextArea
              label="Sobre nosotros"
              name="about"
              value={form.about}
              onChange={field}
              max={600}
              rows={4}
              hint="Aparece en una sección propia de la portada."
            />
            <Switch
              checked={form.sections.howItWorks}
              onChange={(v) => setForm({ ...form, sections: { ...form.sections, howItWorks: v } })}
              label="Mostrar «Cómo funciona»"
              hint="Los tres pasos para reservar."
            />
            <Switch
              checked={form.sections.perks}
              onChange={(v) => setForm({ ...form, sections: { ...form.sections, perks: v } })}
              label="Mostrar «Ventajas»"
              hint="Tiempo real, avisos por correo y calendario."
            />
          </Section>

          <Section title="Contacto y horario">
            <Field label="Dirección del local" icon={MapPin} optional>
              <input
                name="address"
                value={form.address}
                onChange={field}
                maxLength={160}
                className="input pl-9"
              />
            </Field>
            <Field label="Teléfono del local" icon={Phone} optional>
              <input
                name="phone"
                type="tel"
                value={form.phone}
                onChange={field}
                className="input pl-9"
              />
            </Field>
            <TextArea
              label="Horario de apertura"
              name="hours"
              value={form.hours}
              onChange={field}
              max={200}
              rows={3}
              placeholder={"Lunes a viernes: 9:00-20:00\nSábados: 10:00-14:00"}
              hint="Es informativo: los horarios de reserva los defines por miembro del equipo."
            />
          </Section>

          <Section title="Redes">
            <Field label="Instagram" icon={InstagramIcon} optional hint="Tu usuario, con o sin @.">
              <input
                name="instagram"
                value={form.social.instagram}
                onChange={socialField}
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
                value={form.social.whatsapp}
                onChange={socialField}
                className="input pl-9"
              />
            </Field>
            <Field label="Sitio web" icon={Globe} optional>
              <input
                name="website"
                value={form.social.website}
                onChange={socialField}
                placeholder="https://tupeluqueria.com"
                className="input pl-9"
              />
            </Field>
          </Section>

          {error && <ErrorAlert>{error}</ErrorAlert>}
        </div>

        <aside className="hidden lg:sticky lg:top-24 lg:block">
          <p className="label">Vista previa</p>
          <BrandingPreview
            branding={form.branding}
            name={form.name}
            tagline={form.tagline}
            heroTitle={form.heroTitle}
          />
          <p className="mt-3 text-xs text-ink/60">
            Se actualiza al instante. Los cambios no se aplican a tus clientes hasta que guardes.
          </p>
        </aside>

        {/* Barra de guardado: solo aparece si hay cambios */}
        {dirty && (
          <div className="fixed inset-x-0 bottom-0 z-30 animate-fade-up border-t border-sand bg-cream/95 backdrop-blur">
            <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
              <p className="text-sm text-amber-700">Tienes cambios sin guardar</p>
              <div className="flex gap-2">
                <button type="button" onClick={discard} disabled={saving} className="btn-outline">
                  <Undo2 className="h-4 w-4" aria-hidden="true" />
                  Descartar
                </button>
                <button className="btn-primary" disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Save className="h-4 w-4" aria-hidden="true" />
                  )}
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}