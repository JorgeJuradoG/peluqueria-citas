import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, Lock, Mail, Phone, TriangleAlert, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
const PHONE_RE = /^\+?[\d\s-]{9,15}$/;

// Campo con icono a la izquierda y, opcionalmente, acción a la derecha
function Field({ label, icon: Icon, hint, optional, children }) {
  return (
    <div>
      <label className="label">
        {label} {optional && <span className="text-ink/40">(opcional)</span>}
      </label>
      <div className="relative">
        <Icon
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40"
          aria-hidden="true"
        />
        {children}
      </div>
      {hint && <p className="mt-1 text-xs text-ink/50">{hint}</p>}
    </div>
  );
}

function PasswordField({ label, name, value, onChange, autoComplete, hint }) {
  const [show, setShow] = useState(false);
  return (
    <Field label={label} icon={Lock} hint={hint}>
      <input
        name={name}
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        className="input pl-9 pr-10"
        required
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink/50 transition hover:text-ink"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </Field>
  );
}

export default function Login() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";

  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={from} replace />;

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function validate() {
    if (!EMAIL_RE.test(form.email.trim())) return "Introduce un email válido";
    if (mode === "register") {
      if (form.name.trim().length < 2) return "El nombre debe tener al menos 2 caracteres";
      if (form.phone.trim() && !PHONE_RE.test(form.phone.trim())) return "Teléfono no válido";
      if (!PASSWORD_RE.test(form.password))
        return "La contraseña debe tener al menos 8 caracteres, una letra y un número";
      if (form.password !== form.confirm) return "Las contraseñas no coinciden";
    }
    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const problem = validate();
    if (problem) return setError(problem);

    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(form.email.trim(), form.password);
      } else {
        await register({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
        });
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setMode(mode === "login" ? "register" : "login");
    setError("");
  }

  return (
    <div className="mx-auto max-w-sm animate-fade-up py-4">
      <div className="card">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink text-gold">
          <UserRound className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-3xl font-bold">
          {mode === "login" ? "Bienvenido" : "Crear cuenta"}
        </h1>
        <p className="mt-1 text-sm text-ink/60">
          {mode === "login"
            ? "Entra para reservar y gestionar tus citas."
            : "Regístrate en unos segundos."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          {mode === "register" && (
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
          )}

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

          {mode === "register" && (
            <Field label="Teléfono" icon={Phone} optional>
              <input
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                autoComplete="tel"
                className="input pl-9"
              />
            </Field>
          )}

          <PasswordField
            label="Contraseña"
            name="password"
            value={form.password}
            onChange={handleChange}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            hint={mode === "register" ? "Mínimo 8 caracteres, con una letra y un número." : ""}
          />

          {mode === "login" && (
            <p className="-mt-2 text-right">
              <Link to="/recuperar" className="text-sm text-gold-dark underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </p>
          )}

          {mode === "register" && (
            <PasswordField
              label="Repite la contraseña"
              name="confirm"
              value={form.confirm}
              onChange={handleChange}
              autoComplete="new-password"
            />
          )}

          {error && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {error}
            </p>
          )}

          <button className="btn-primary w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {loading ? "Un momento..." : mode === "login" ? "Entrar" : "Registrarme"}
          </button>
        </form>

        <button onClick={switchMode} className="mt-4 text-sm text-gold-dark underline">
          {mode === "login" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Entra"}
        </button>
      </div>
    </div>
  );
}