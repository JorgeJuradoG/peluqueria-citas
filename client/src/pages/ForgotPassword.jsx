import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!EMAIL_RE.test(email.trim())) return setError("Introduce un email válido");

    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: email.trim() });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <div className="card">
        {sent ? (
          <>
            <h1 className="text-3xl font-bold">Revisa tu correo</h1>
            <p className="mt-3 text-sm text-ink/70">
              Si existe una cuenta con <b>{email.trim()}</b>, te hemos enviado un enlace para
              elegir una contraseña nueva. Caduca en 1 hora.
            </p>
            <p className="mt-3 text-sm text-ink/50">
              ¿No llega? Mira en la carpeta de spam o espera un minuto y vuelve a intentarlo.
            </p>
            <Link to="/login" className="btn-primary mt-6 w-full">Volver a entrar</Link>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold">Recupera tu contraseña</h1>
            <p className="mt-1 text-sm text-ink/60">
              Escribe tu email y te enviaremos un enlace para elegir una nueva.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="input"
                  required
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
              )}

              <button className="btn-primary w-full" disabled={loading}>
                {loading ? "Enviando..." : "Enviar enlace"}
              </button>
            </form>

            <Link to="/login" className="mt-4 inline-block text-sm text-gold-dark underline">
              Volver a entrar
            </Link>
          </>
        )}
      </div>
    </div>
  );
}