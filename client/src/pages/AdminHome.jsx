import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useSalon } from "../context/SalonContext";
import { useToast } from "../context/UIContext";

function Step({ number, done, title, text, to, action }) {
  return (
    <li className={`card flex flex-wrap items-center gap-4 ${done ? "opacity-70" : ""}`}>
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display ${
          done ? "bg-emerald-600 text-white" : "bg-ink text-cream"
        }`}
      >
        {done ? "✓" : number}
      </span>
      <div className="min-w-0 flex-1 basis-48">
        <p className={`font-medium ${done ? "line-through" : ""}`}>{title}</p>
        <p className="text-sm text-ink/60">{text}</p>
      </div>
      {to && (
        <Link to={to} className={done ? "btn-outline" : "btn-primary"}>
          {done ? "Ver" : action}
        </Link>
      )}
    </li>
  );
}

export default function AdminHome() {
  const { user } = useAuth();
  const salon = useSalon();
  const toast = useToast();

  const sharedKey = `shared:${salon.slug}`;
  const [counts, setCounts] = useState(null);
  const [shared, setShared] = useState(() => {
    try {
      return localStorage.getItem(sharedKey) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    Promise.all([api.get("/services"), api.get("/stylists/manage/all")]).then(([sv, st]) =>
      setCounts({
        services: sv.data.length,
        stylists: st.data.filter((s) => s.active).length,
      })
    );
  }, []);

  const link = `${window.location.origin}/s/${salon.slug}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Enlace copiado");
    } catch {
      toast.error(`No se pudo copiar. Tu enlace es: ${link}`);
    }
    try {
      localStorage.setItem(sharedKey, "1");
    } catch {
      /* sin almacenamiento: no pasa nada */
    }
    setShared(true);
  }

  if (!counts) return <p className="text-ink/50">Cargando...</p>;

  const steps = [counts.services > 0, counts.stylists > 0, shared];
  const doneCount = steps.filter(Boolean).length;
  const allDone = doneCount === steps.length;

  return (
    <div>
      <h1 className="text-4xl font-bold">Hola, {user.name}</h1>
      <p className="mt-1 text-ink/60">
        {allDone
          ? `${salon.name} está lista para recibir reservas.`
          : `Vamos a dejar lista ${salon.name} en tres pasos.`}
      </p>

      <div className="mt-6">
        <div className="flex items-center justify-between text-sm text-ink/60">
          <span>Progreso</span>
          <span>{doneCount} de {steps.length}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-sand">
          <div
            className="h-full rounded-full bg-gold transition-all"
            style={{ width: `${(doneCount / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <ul className="mt-6 space-y-3">
        <Step
          number={1}
          done={steps[0]}
          title="Crea tu primer servicio"
          text="Por ejemplo «Corte de pelo», con su duración y su precio."
          to="/admin/servicios"
          action="Crear servicio"
        />
        <Step
          number={2}
          done={steps[1]}
          title="Añade a tu equipo"
          text="Crea la cuenta de cada estilista y elige qué servicios ofrece."
          to="/admin/estilistas"
          action="Añadir estilista"
        />
        <li className={`card ${steps[2] ? "opacity-70" : ""}`}>
          <div className="flex flex-wrap items-center gap-4">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display ${
                steps[2] ? "bg-emerald-600 text-white" : "bg-ink text-cream"
              }`}
            >
              {steps[2] ? "✓" : 3}
            </span>
            <div className="min-w-0 flex-1 basis-48">
              <p className={`font-medium ${steps[2] ? "line-through" : ""}`}>
                Comparte tu enlace con los clientes
              </p>
              <p className="text-sm text-ink/60">
                Pégalo en tu Instagram, WhatsApp o en la puerta del local.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg bg-sand/50 p-3">
            <code className="min-w-0 flex-1 break-all text-sm">{link}</code>
            <button onClick={copyLink} className="btn-primary">Copiar enlace</button>
          </div>
        </li>
      </ul>

      {allDone && (
        <div className="card mt-6">
          <h2 className="text-xl font-semibold">¿Y ahora qué?</h2>
          <p className="mt-1 text-sm text-ink/60">
            Revisa las reservas que vayan entrando y ajusta horarios o días libres cuando
            haga falta.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to="/agenda" className="btn-primary">Ver la agenda</Link>
            <Link to="/admin/estilistas" className="btn-outline">Horarios del equipo</Link>
          </div>
        </div>
      )}
    </div>
  );
}