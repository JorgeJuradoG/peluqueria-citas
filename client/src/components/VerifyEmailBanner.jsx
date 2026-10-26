import { useState } from "react";
import { Loader2, Mail, RefreshCw } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/UIContext";

// Aviso fijo para el dueño que aún no ha confirmado su correo
export default function VerifyEmailBanner() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);

  if (!user || user.role !== "admin" || user.emailVerified !== false) return null;

  async function resend() {
    setSending(true);
    try {
      const { data } = await api.post("/auth/send-verification");
      toast.success(data.message || "Correo enviado");
    } catch (err) {
      toast.error(err.response?.data?.message || "No se pudo enviar el correo");
    } finally {
      setSending(false);
    }
  }

  // Por si lo ha confirmado en otra pestaña o en el móvil
  async function check() {
    setChecking(true);
    try {
      const { data } = await api.get("/auth/me");
      updateUser({ ...user, ...data });
      if (data.emailVerified === false) toast.error("Todavía no está confirmado");
      else toast.success("¡Correo confirmado!");
    } catch (err) {
      toast.error(err.response?.data?.message || "No se pudo comprobar");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div role="status" className="border-b border-amber-200 bg-amber-50 text-amber-900">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
        <p className="flex items-start gap-2">
          <Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            <b>Confirma tu correo.</b> Te hemos enviado un enlace a {user.email}. Revisa también
            la carpeta de spam.
          </span>
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={check}
            disabled={checking || sending}
            className="btn-outline"
          >
            {checking ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
            )}
            Ya lo he confirmado
          </button>
          <button type="button" onClick={resend} disabled={sending || checking} className="btn-primary">
            {sending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Reenviar correo
          </button>
        </div>
      </div>
    </div>
  );
}