import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { KeyRound, Loader2, PartyPopper, TriangleAlert } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/UIContext";
import { ErrorAlert, PasswordField } from "../components/FormField";

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
      <div className="mx-auto max-w-sm py-4">
        <div className="card animate-fade-up text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <TriangleAlert className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-3xl font-bold">Enlace no válido</h1>
          <p className="mt-3 text-sm text-ink/70">
            Este enlace ha caducado o ya se ha usado. Puedes pedir uno nuevo.
          </p>
          <Link to="/recuperar" className="btn-primary mt-6 w-full">
            Pedir un enlace nuevo
          </Link>
        </div>
      </div>
    );
  }

  if (!info) {
    return (
      <p className="flex items-center justify-center gap-2 py-10 text-ink/70">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Comprobando el enlace...
      </p>
    );
  }

  const isInvite = info.type === "invite";

  return (
    <div className="mx-auto max-w-sm py-4">
      <form onSubmit={handleSubmit} className="card animate-fade-up" noValidate>
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink text-gold">
          {isInvite ? (
            <PartyPopper className="h-6 w-6" aria-hidden="true" />
          ) : (
            <KeyRound className="h-6 w-6" aria-hidden="true" />
          )}
        </span>
        <h1 className="mt-4 text-3xl font-bold">
          {isInvite ? "Activa tu cuenta" : "Elige tu contraseña"}
        </h1>
        <p className="mt-1 text-sm text-ink/70">
          {isInvite ? "Te damos la bienvenida, " : "Hola, "}
          <b>{info.name}</b>. Tu usuario es {info.email}.
        </p>

        <div className="mt-6 space-y-4">
          <PasswordField
            label="Contraseña nueva"
            name="password"
            value={form.password}
            onChange={handleChange}
            autoComplete="new-password"
            hint="Mínimo 8 caracteres, con una letra y un número."
          />
          <PasswordField
            label="Repite la contraseña"
            name="confirm"
            value={form.confirm}
            onChange={handleChange}
            autoComplete="new-password"
          />
        </div>

        {error && (
          <div className="mt-4">
            <ErrorAlert>{error}</ErrorAlert>
          </div>
        )}

        <button className="btn-primary mt-6 w-full" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {saving ? "Guardando..." : isInvite ? "Activar cuenta" : "Guardar contraseña"}
        </button>
      </form>
    </div>
  );
}