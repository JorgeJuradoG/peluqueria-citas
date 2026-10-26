import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarCheck,
  CheckCheck,
  KeyRound,
  Loader2,
  Mail,
  Phone,
  Save,
  UserRound,
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/UIContext";
import useTerms from "../hooks/useTerms";
import Avatar from "../components/Avatar";
import { Skeleton } from "../components/Skeleton";
import { ErrorAlert, Field, PasswordField } from "../components/FormField";

const ROLE_LABELS = { client: "Cliente", stylist: "Estilista", admin: "Administrador" };

function PasswordForm() {
  const toast = useToast();
  const { saveSession } = useAuth();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (form.newPassword !== form.confirm) {
      return setError("Las contraseñas nuevas no coinciden");
    }
    setSaving(true);
    try {
      const { data } = await api.put("/auth/password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      saveSession(data); // token nuevo: esta sesión sigue abierta
      toast.success("Contraseña actualizada");
      setForm({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo cambiar la contraseña");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <h2 className="flex items-center gap-2 text-xl font-semibold">
        <KeyRound className="h-5 w-5 text-gold-dark" aria-hidden="true" />
        Cambiar contraseña
      </h2>
      <p className="mt-1 text-sm text-ink/70">
        Al cambiarla, se cerrarán tus sesiones abiertas en otros dispositivos.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <PasswordField
          label="Actual"
          name="currentPassword"
          value={form.currentPassword}
          onChange={handleChange}
          autoComplete="current-password"
        />
        <PasswordField
          label="Nueva"
          name="newPassword"
          value={form.newPassword}
          onChange={handleChange}
          autoComplete="new-password"
        />
        <PasswordField
          label="Repite la nueva"
          name="confirm"
          value={form.confirm}
          onChange={handleChange}
          autoComplete="new-password"
        />
      </div>
      <p className="mt-2 text-xs text-ink/60">Mínimo 8 caracteres, con una letra y un número.</p>

      {error && (
        <div className="mt-4">
          <ErrorAlert>{error}</ErrorAlert>
        </div>
      )}

      <button className="btn-primary mt-5" disabled={saving}>
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <KeyRound className="h-4 w-4" aria-hidden="true" />
        )}
        {saving ? "Guardando..." : "Cambiar contraseña"}
      </button>
    </form>
  );
}

export default function Profile() {
  const { updateUser } = useAuth();
  const toast = useToast();
  const terms = useTerms();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [stats, setStats] = useState({ upcoming: 0, completed: 0 });
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([api.get("/auth/me"), api.get("/appointments/me")])
      .then(([me, apps]) => {
        setProfile(me.data);
        setForm({ name: me.data.name, phone: me.data.phone || "" });
        const now = new Date();
        setStats({
          upcoming: apps.data.filter(
            (a) => ["pending", "confirmed"].includes(a.status) && new Date(a.end) > now
          ).length,
          completed: apps.data.filter((a) => a.status === "completed").length,
        });
      })
      .catch(() => setLoadError("No se pudo cargar el perfil"));
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const { data } = await api.put("/auth/me", form);
      setProfile(data);
      updateUser(data); // actualiza el nombre de la navbar
      toast.success("Perfil actualizado");
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl">
        <ErrorAlert>{loadError}</ErrorAlert>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="mt-6 h-28 w-full" />
        <Skeleton className="mt-5 h-64 w-full" />
      </div>
    );
  }

  const since = new Date(profile.createdAt).toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-4xl font-bold">Mi perfil</h1>

      <section className="card mt-6 flex flex-wrap items-center gap-5">
        <Avatar name={profile.name} size="xl" />
        <div className="min-w-0 flex-1 basis-48">
          <p className="truncate font-display text-2xl font-semibold">{profile.name}</p>
          <p className="truncate text-sm text-ink/70">{profile.email}</p>
          <p className="mt-1 text-xs text-ink/60">
            {profile.role === "stylist" ? terms.One : ROLE_LABELS[profile.role]} · Miembro desde{" "}
            {since}
          </p>
        </div>
        <dl className="flex gap-6 text-center">
          <div>
            <dt className="flex items-center justify-center gap-1 text-xs text-ink/70">
              <CalendarCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Próximas
            </dt>
            <dd className="font-display text-2xl font-semibold">{stats.upcoming}</dd>
          </div>
          <div>
            <dt className="flex items-center justify-center gap-1 text-xs text-ink/70">
              <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Completadas
            </dt>
            <dd className="font-display text-2xl font-semibold">{stats.completed}</dd>
          </div>
        </dl>
      </section>

      <form onSubmit={handleSubmit} className="card mt-5">
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <UserRound className="h-5 w-5 text-gold-dark" aria-hidden="true" />
          Datos personales
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Nombre" icon={UserRound}>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              autoComplete="name"
              className="input pl-9"
              required
            />
          </Field>
          <Field label="Teléfono" icon={Phone}>
            <input
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              autoComplete="tel"
              className="input pl-9"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Email" icon={Mail} hint="El email no se puede cambiar.">
              <input value={profile.email} className="input bg-sand/40 pl-9" disabled />
            </Field>
          </div>
        </div>

        {error && (
          <div className="mt-4">
            <ErrorAlert>{error}</ErrorAlert>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-4">
          <button className="btn-primary" disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="h-4 w-4" aria-hidden="true" />
            )}
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
          <Link to="/mis-citas" className="text-sm text-gold-dark underline">
            Ver mis citas
          </Link>
        </div>
      </form>

      <div className="mt-5">
        <PasswordForm />
      </div>
    </div>
  );
}