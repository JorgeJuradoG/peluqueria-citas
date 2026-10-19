import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      if (mode === "login") {
        await login(form.email, form.password);
      } else {
        await register(form.name, form.email, form.password);
      }
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo conectar con el servidor");
    }
  }



return (
  <div className="mx-auto max-w-sm">
    <div className="card">
      <h1 className="text-3xl font-bold">
        {mode === "login" ? "Bienvenido" : "Crear cuenta"}
      </h1>
      <p className="mt-1 text-sm text-ink/60">
        {mode === "login"
          ? "Entra para reservar y gestionar tus citas."
          : "Regístrate en unos segundos."}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {mode === "register" && (
          <div>
            <label className="label">Nombre</label>
            <input name="name" value={form.name} onChange={handleChange}
              className="input" required />
          </div>
        )}
        <div>
          <label className="label">Email</label>
          <input name="email" type="email" value={form.email}
            onChange={handleChange} className="input" required />
        </div>
        <div>
          <label className="label">Contraseña</label>
          <input name="password" type="password" value={form.password}
            onChange={handleChange} className="input" minLength={8} required />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <button className="btn-primary w-full">
          {mode === "login" ? "Entrar" : "Registrarme"}
        </button>
      </form>

      <button
        onClick={() => setMode(mode === "login" ? "register" : "login")}
        className="mt-4 text-sm text-gold-dark underline"
      >
        {mode === "login" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Entra"}
      </button>
    </div>
  </div>
);
}