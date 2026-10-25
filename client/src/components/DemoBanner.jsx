import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Eye, LayoutDashboard, Loader2, Store, UserRound } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useSalon } from "../context/SalonContext";
import { useToast } from "../context/UIContext";

const ROLES = {
  admin: { label: "Administrador", icon: LayoutDashboard, to: "/inicio" },
  stylist: { label: "Estilista", icon: CalendarDays, to: "/inicio" },
  client: { label: "Cliente", icon: UserRound, to: "/inicio" },
};

export default function DemoBanner() {
  const salon = useSalon();
  const { user, saveSession } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(null);

  if (!salon.demo) return null;

  async function enter(role) {
    setLoading(role);
    try {
      const { data } = await api.post("/auth/demo", { role });
      saveSession(data);
      navigate(ROLES[role].to);
    } catch (err) {
      toast.error(err.response?.data?.message || "No se pudo abrir la demo");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="keep-palette bg-ink text-cream">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2.5 text-sm">
        <p className="flex items-center gap-2">
          <Eye className="h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
          <span>
            <b>Demo de solo lectura.</b> Explórala con el rol que quieras; los cambios no se
            guardan.
          </span>
        </p>

        <div className="flex flex-wrap items-center gap-2">
          {Object.entries(ROLES).map(([role, { label, icon: Icon }]) => {
            const current = user?.role === role;
            return (
              <button
                key={role}
                onClick={() => enter(role)}
                disabled={loading !== null}
                aria-pressed={current}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
                  current
                    ? "border-gold bg-gold text-[#1c1917]"
                    : "border-cream/30 hover:border-gold hover:text-gold"
                }`}
              >
                {loading === role ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {label}
              </button>
            );
          })}
          <a
            href="/crear-peluqueria"
            className="inline-flex items-center gap-1.5 rounded-full bg-gold px-3 py-1 text-xs font-semibold text-[#1c1917] transition hover:bg-cream"
          >
            <Store className="h-3.5 w-3.5" aria-hidden="true" />
            Crear la mía
          </a>
        </div>
      </div>
    </div>
  );
}