import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Check, Loader2, TriangleAlert } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function ConfirmEmail() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const { user, updateUser } = useAuth();
  const [state, setState] = useState(token ? "loading" : "error");
  const [message, setMessage] = useState(token ? "" : "El enlace no es válido o ha caducado");
  const sent = useRef(false); // el enlace es de un solo uso: no se debe llamar dos veces

  useEffect(() => {
    if (!token || sent.current) return;
    sent.current = true;

    api
      .post("/auth/confirm-email", { token })
      .then(() => {
        setState("ok");
        // Si es la misma persona con la sesión abierta, el aviso desaparece al momento
        if (user && user.emailVerified === false) updateUser({ ...user, emailVerified: true });
      })
      .catch((err) => {
        setState("error");
        setMessage(err.response?.data?.message || "El enlace no es válido o ha caducado");
      });
  }, [token]);

  return (
    <div className="mx-auto max-w-sm py-8">
      <div className="card text-center">
        {state === "loading" && (
          <>
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-ink/50" aria-hidden="true" />
            <p className="mt-4 text-ink/70">Confirmando tu correo...</p>
          </>
        )}

        {state === "ok" && (
          <>
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Check className="h-7 w-7" aria-hidden="true" />
            </span>
            <h1 className="mt-4 text-3xl font-bold">¡Correo confirmado!</h1>
            <p className="mt-1 text-sm text-ink/70">Tu peluquería ya tiene el alta completa.</p>
            <Link to={user ? "/inicio" : "/login"} className="btn-primary mt-6 w-full">
              {user ? "Ir a mi panel" : "Entrar"}
            </Link>
          </>
        )}

        {state === "error" && (
          <>
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-700">
              <TriangleAlert className="h-7 w-7" aria-hidden="true" />
            </span>
            <h1 className="mt-4 text-2xl font-bold">No se pudo confirmar</h1>
            <p role="alert" className="mt-1 text-sm text-ink/70">
              {message}
            </p>
            <p className="mt-3 text-sm text-ink/70">
              Entra en tu panel y pulsa «Reenviar correo» para recibir un enlace nuevo.
            </p>
            <Link to={user ? "/inicio" : "/login"} className="btn-outline mt-6 w-full">
              {user ? "Ir a mi panel" : "Entrar"}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}