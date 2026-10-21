import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/UIContext";

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
      <h2 className="text-xl font-semibold">Cambiar contraseña</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label">Actual</label>
          <input
            name="currentPassword"
            type="password"
            value={form.currentPassword}
            onChange={handleChange}
            autoComplete="current-password"
            className="input"
            required
          />
        </div>
        <div>
          <label className="label">Nueva</label>
          <input
            name="newPassword"
            type="password"
            value={form.newPassword}
            onChange={handleChange}
            autoComplete="new-password"
            className="input"
            required
          />
        </div>
        <div>
          <label className="label">Repite la nueva</label>
          <input
            name="confirm"
            type="password"
            value={form.confirm}
            onChange={handleChange}
            autoComplete="new-password"
            className="input"
            required
          />
        </div>
      </div>
      <p className="mt-2 text-xs text-ink/50">
        Mínimo 8 caracteres, con una letra y un número.
      </p>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <button className="btn-primary mt-5" disabled={saving}>
        {saving ? "Guardando..." : "Cambiar contraseña"}
      </button>
    </form>
  );
}

export default function Profile() {
  const { updateUser } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [stats, setStats] = useState({ upcoming: 0, completed: 0 });
  const [error, setError] = useState("");
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
      .catch(() => setError("No se pudo cargar el perfil"));
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

  if (!profile) {
    return error ? (
      <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
    ) : (
      <p className="text-ink/50">Cargando...</p>
    );
  }

  const since = new Date(profile.createdAt).toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });

  return (
    <div>
      <h1 className="text-4xl font-bold">Mi perfil</h1>

      <section className="card mt-6 flex flex-wrap items-center gap-5">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-ink font-display text-2xl text-cream">
          {profile.name[0]}
        </span>
        <div className="flex-1">
          <p className="font-display text-2xl font-semibold">{profile.name}</p>
          <p className="text-sm text-ink/60">{profile.email}</p>
          <p className="mt-1 text-xs text-ink/50">
            {ROLE_LABELS[profile.role]} · Miembro desde {since}
          </p>
        </div>
        <div className="flex gap-6 text-center">
          <div>
            <p className="font-display text-2xl font-semibold">{stats.upcoming}</p>
            <p className="text-xs text-ink/60">Próximas</p>
          </div>
          <div>
            <p className="font-display text-2xl font-semibold">{stats.completed}</p>
            <p className="text-xs text-ink/60">Completadas</p>
          </div>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="card mt-5">
        <h2 className="text-xl font-semibold">Datos personales</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Nombre</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">Teléfono</label>
            <input
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              className="input"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Email</label>
            <input value={profile.email} className="input bg-sand/40" disabled />
            <p className="mt-1 text-xs text-ink/50">El email no se puede cambiar.</p>
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <div className="mt-5 flex items-center gap-4">
          <button className="btn-primary" disabled={saving}>
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