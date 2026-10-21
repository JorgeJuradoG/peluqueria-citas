import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/UIContext";

const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const navigate = useNavigate();
  const { saveSession } = useAuth();
  const toast = useToast();

  const [info, setInfo] = useState(null); // { type, name, email }
  const [invalid, setInvalid] = useState(false);
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Comprueba el enlace antes de enseñar el formulario (no lo consume)
  useEffect(() => {
    if (!token) return setInvalid(true);
    api
      .post("/auth/token-info", { token })
      .then((res) => setInfo(res.data))
      .catch(() => setInvalid(true));
  }, [token]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!PASSWORD_RE.test(form.password)) {
      return setError("La contraseña debe tener al menos 8 caracteres, una letra y un número");
    }
    if (form.password !== form.confirm) return setError("Las contraseñas no coinciden");

    setSaving(true);
    try {
      const { data } = await api.post("/auth/reset-password", {
        token,
        password: form.password,
      });
      saveSession(data); // ya queda la sesión abierta
      toast.success(info.type === "invite" ? "Cuenta activada" : "Contraseña actualizada");
      navigate(data.user.role === "stylist" ? "/agenda" : "/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo conectar con el servidor");
      setSaving(false);
    }
  }

  if (invalid) {
    return (
      <div className="mx-auto max-w-sm">
        <div className="card text-center">
          <h1 className="text-3xl font-bold">Enlace no válido</h1>
          <p className="mt-3 text-sm text-ink/70">
            Este enlace ha caducado o ya se ha usado. Puedes pedir uno nuevo.
          </p>
          <Link to="/recuperar" className="btn-primary mt-6 w-full">Pedir un enlace nuevo</Link>
        </div>
      </div>
    );
  }

  if (!info) return <p className="text-center text-ink/50">Comprobando el enlace...</p>;

  const isInvite = info.type === "invite";

  return (
    <div className="mx-auto max-w-sm">
      <form onSubmit={handleSubmit} className="card" noValidate>
        <h1 className="text-3xl font-bold">
          {isInvite ? "Activa tu cuenta" : "Elige tu contraseña"}
        </h1>
        <p className="mt-1 text-sm text-ink/60">
          {isInvite ? "Te damos la bienvenida, " : "Hola, "}
          <b>{info.name}</b>. Tu usuario es {info.email}.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="label">Contraseña nueva</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
              className="input"
              required
            />
            <p className="mt-1 text-xs text-ink/50">
              Mínimo 8 caracteres, con una letra y un número.
            </p>
          </div>
          <div>
            <label className="label">Repite la contraseña</label>
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

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <button className="btn-primary mt-6 w-full" disabled={saving}>
          {saving ? "Guardando..." : isInvite ? "Activar cuenta" : "Guardar contraseña"}
        </button>
      </form>
    </div>
  );
}