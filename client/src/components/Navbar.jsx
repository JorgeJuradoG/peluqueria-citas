import { useEffect, useRef, useState } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import {
  CalendarCheck,
  CalendarDays,
  CalendarPlus,
  ChevronDown,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Scissors,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSalon } from "../context/SalonContext";
import ThemeToggle from "./ThemeToggle";

const ROLE_LABELS = { client: "Cliente", stylist: "Estilista", admin: "Administrador" };

function buildLinks(user) {
  if (!user) return [];
  const links = [
    { to: "/reservar", label: "Reservar", icon: CalendarPlus },
    { to: "/mis-citas", label: "Mis citas", icon: CalendarCheck },
  ];
  if (user.role === "admin" || user.role === "stylist") {
    links.push({ to: "/agenda", label: "Agenda", icon: CalendarDays });
  }
  if (user.role === "admin") {
    links.push(
      { to: "/admin", label: "Panel", icon: LayoutDashboard, end: true },
      { to: "/admin/servicios", label: "Servicios", icon: Scissors },
      { to: "/admin/estilistas", label: "Estilistas", icon: Users }
    );
  }
  return links;
}

const desktopLink = ({ isActive }) =>
  `flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? "bg-gold/15 text-gold-dark" : "text-ink/70 hover:bg-sand/60 hover:text-ink"
  }`;

const mobileLink = ({ isActive }) =>
  `flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition ${
    isActive ? "bg-gold/15 text-gold-dark" : "text-ink/80 hover:bg-sand/60"
  }`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const salon = useSalon();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const userMenuRef = useRef(null);

  const links = buildLinks(user);

  // Al cambiar de página se cierran los menús
  useEffect(() => {
    setMobileOpen(false);
    setUserOpen(false);
  }, [pathname]);

  // Sombra al bajar
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Clic fuera o Escape cierran los menús
  useEffect(() => {
    function onClick(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") {
        setUserOpen(false);
        setMobileOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function handleLogout() {
    setUserOpen(false);
    setMobileOpen(false);
    logout();
    navigate("/");
  }

  return (
    <header
      className={`sticky top-0 z-30 border-b border-sand bg-cream/90 backdrop-blur transition-shadow ${
        scrolled ? "shadow-md" : ""
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link
          to="/"
          className="flex min-w-0 items-center gap-2 font-display text-2xl font-bold tracking-tight"
        >
          <Scissors className="h-5 w-5 shrink-0 text-gold" aria-hidden="true" />
          <span className="truncate">
            {salon.name}
            <span className="text-gold">.</span>
          </span>
        </Link>

        {/* Enlaces de escritorio */}
        {user && (
          <div className="hidden items-center gap-1 lg:flex">
            {links.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={desktopLink}>
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {user ? (
            <>
              {/* Menú de usuario (escritorio) */}
              <div className="relative hidden lg:block" ref={userMenuRef}>
                <button
                  onClick={() => setUserOpen(!userOpen)}
                  aria-expanded={userOpen}
                  aria-haspopup="menu"
                  className="flex items-center gap-2 rounded-full border border-sand bg-surface py-1 pl-1 pr-3 text-sm font-medium transition hover:border-gold"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink font-display text-cream">
                    {user.name[0]}
                  </span>
                  <span className="max-w-32 truncate">{user.name}</span>
                  <ChevronDown
                    className={`h-4 w-4 transition ${userOpen ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  />
                </button>

                {userOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-60 animate-pop rounded-xl border border-sand bg-surface p-2 shadow-lg"
                  >
                    <div className="px-3 py-2">
                      <p className="truncate font-medium">{user.name}</p>
                      <p className="truncate text-xs text-ink/60">{user.email}</p>
                      <p className="mt-1 text-xs text-gold-dark">{ROLE_LABELS[user.role]}</p>
                    </div>
                    <div className="my-1 border-t border-sand" />
                    <Link
                      to="/perfil"
                      role="menuitem"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-sand/60"
                    >
                      <UserRound className="h-4 w-4" aria-hidden="true" />
                      Mi perfil
                    </Link>
                    <button
                      onClick={handleLogout}
                      role="menuitem"
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-700 transition hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" aria-hidden="true" />
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>

              {/* Botón hamburguesa (móvil) */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-expanded={mobileOpen}
                aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
                className="rounded-lg border border-sand bg-surface p-2 transition hover:border-gold lg:hidden"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </>
          ) : (
            <Link to="/login" className="btn-primary">
              <LogIn className="h-4 w-4" aria-hidden="true" />
              Entrar
            </Link>
          )}
        </div>
      </nav>

      {/* Panel móvil */}
      {mobileOpen && user && (
        <div className="animate-fade-up border-t border-sand bg-cream lg:hidden">
          <div className="mx-auto max-w-6xl px-4 py-3">
            <div className="flex items-center gap-3 px-3 py-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink font-display text-cream">
                {user.name[0]}
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium">{user.name}</p>
                <p className="text-xs text-gold-dark">{ROLE_LABELS[user.role]}</p>
              </div>
            </div>

            <div className="mt-2 space-y-1">
              {links.map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end} className={mobileLink}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {label}
                </NavLink>
              ))}
              <NavLink to="/perfil" className={mobileLink}>
                <UserRound className="h-5 w-5" aria-hidden="true" />
                Mi perfil
              </NavLink>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-red-700 transition hover:bg-red-50"
              >
                <LogOut className="h-5 w-5" aria-hidden="true" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}