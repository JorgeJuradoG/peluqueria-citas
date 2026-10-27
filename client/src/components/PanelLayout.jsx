import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  ExternalLink,
  Home,
  LogOut,
  Menu,
  Palette,
  Rocket,
  Scissors,
  Store,
  TrendingUp,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSalon } from "../context/SalonContext";
import useTerms from "../hooks/useTerms";
import Avatar from "./Avatar";
import BrandIcon from "./BrandIcon";
import ThemeToggle from "./ThemeToggle";

function sections(user, terms) {
  const main = {
    items: [
      { to: "/inicio", label: "Inicio", icon: Home },
      { to: "/agenda", label: "Agenda", icon: CalendarDays },
    ],
  };
  if (user.role !== "admin") {
    return [main, { items: [{ to: "/perfil", label: "Mi perfil", icon: UserRound }] }];
  }
  return [
    main,
    {
      title: "Gestión",
      items: [
        { to: "/admin/estadisticas", label: "Estadísticas", icon: TrendingUp },
        { to: "/admin/servicios", label: "Servicios", icon: Scissors },
        { to: "/admin/estilistas", label: terms.Many, icon: Users },
      ],
    },
    {
      title: "Configuración",
      items: [
        { to: "/admin/apariencia", label: "Apariencia", icon: Palette },
        { to: "/admin/negocio", label: "Mi negocio", icon: Store },
        { to: "/admin", label: "Puesta en marcha", icon: Rocket, end: true },
      ],
    },
  ];
}

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
    isActive
      ? "bg-surface font-medium text-ink shadow-card"
      : "text-ink/65 hover:bg-ink/5 hover:text-ink"
  }`;

function SidebarContent({ onNavigate }) {
  const { user, logout } = useAuth();
  const salon = useSalon();
  const terms = useTerms();
  const navigate = useNavigate();
  const roleLabel = user.role === "admin" ? "Administrador" : terms.One;

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="flex h-full flex-col">
      <Link
        to="/inicio"
        onClick={onNavigate}
        className="flex min-w-0 items-center gap-2.5 px-3 py-1 font-display text-xl"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold text-[#17191c]">
          <BrandIcon name={salon.branding.icon} className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="truncate">{salon.name}</span>
      </Link>

      <nav className="mt-8 flex-1 space-y-6 overflow-y-auto" aria-label="Panel de gestión">
        {sections(user, terms).map((section, i) => (
          <div key={section.title ?? i}>
            {section.title && (
              <p className="px-3 pb-2 text-xs text-ink/45">{section.title}</p>
            )}
            <ul className="space-y-0.5">
              {section.items.map(({ to, label, icon: Icon, end }) => (
                <li key={to}>
                  <NavLink to={to} end={end} onClick={onNavigate} className={linkClass}>
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <Link
            to="/"
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-ink/65 transition hover:bg-ink/5 hover:text-ink"
          >
            <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
            Ver mi web
          </Link>
        </div>
      </nav>

      <div className="mt-4 border-t border-ink/10 pt-4">
        <div className="flex items-center gap-3 px-2">
          <Avatar name={user.name} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-ink/55">{roleLabel}</p>
          </div>
          <ThemeToggle />
        </div>
        <div className="mt-3 flex gap-1">
          {user.role === "admin" && (
            <NavLink to="/perfil" onClick={onNavigate} className={(s) => `${linkClass(s)} flex-1`}>
              <UserRound className="h-4 w-4" aria-hidden="true" />
              Perfil
            </NavLink>
          )}
          <button
            onClick={handleLogout}
            className="flex flex-1 items-center gap-3 rounded-xl px-3 py-2 text-sm text-ink/65 transition hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Salir
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PanelLayout({ banners, children }) {
  const { user } = useAuth();
  const salon = useSalon();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-cream"
      >
        Saltar al contenido
      </a>

      {/* Barra lateral fija (escritorio) */}
      <aside className="sticky top-0 hidden h-screen border-r border-ink/5 bg-fog px-3 py-5 lg:block">
        <SidebarContent />
      </aside>

      {/* Barra superior y menú deslizante (móvil y tableta) */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-ink/5 bg-cream/90 px-4 py-3 backdrop-blur lg:hidden">
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          aria-expanded={open}
          className="rounded-lg p-2 text-ink/70 transition hover:bg-ink/5"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="truncate font-display text-lg">{salon.name}</span>
        <Avatar name={user.name} size="sm" />
      </header>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menú">
          <div className="absolute inset-0 animate-fade-in bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] animate-slide-left bg-fog px-3 py-5 shadow-pop">
            <button
              onClick={() => setOpen(false)}
              aria-label="Cerrar menú"
              className="absolute right-3 top-4 rounded-lg p-2 text-ink/60 transition hover:bg-ink/5"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-col">
        {banners}
        <main id="contenido" className="flex-1 px-4 py-8 sm:px-8 lg:px-12 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
