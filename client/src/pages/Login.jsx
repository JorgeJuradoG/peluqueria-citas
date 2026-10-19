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

  const input = "w-full rounded border p-2";

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-3xl font-bold">
        {mode === "login" ? "Entrar" : "Crear cuenta"}
      </h1>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        {mode === "register" && (
          <input name="name" placeholder="Nombre" value={form.name}
            onChange={handleChange} className={input} required />
        )}
        <input name="email" type="email" placeholder="Email" value={form.email}
          onChange={handleChange} className={input} required />
        <input name="password" type="password" placeholder="Contraseña (mín. 8)"
          value={form.password} onChange={handleChange} className={input} required />

        {error && <p className="text-red-600">{error}</p>}

        <button className="w-full rounded bg-black p-2 text-white">
          {mode === "login" ? "Entrar" : "Registrarme"}
        </button>
      </form>

      <button
        onClick={() => setMode(mode === "login" ? "register" : "login")}
        className="mt-3 text-sm underline"
      >
        {mode === "login" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Entra"}
      </button>
    </div>
  );
}