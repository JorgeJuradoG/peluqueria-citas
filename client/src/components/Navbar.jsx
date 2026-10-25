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
  Palette,
  Scissors,
  Settings,
  TrendingUp,
  UserRound,
  Users,
  X,
  Home
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSalon } from "../context/SalonContext";
import BrandIcon from "./BrandIcon";
import ThemeToggle from "./ThemeToggle";

const ROLE_LABELS = { client: "Cliente", stylist: "Estilista", admin: "Administrador" };

function mainLinks(user) {
  if (!user) return [];
  const links = [
    { to: "/inicio", label: "Inicio", icon: Home },
    { to: "/reservar", label: "Reservar", icon: CalendarPlus },
    { to: "/mis-citas", label: "Mis citas", icon: CalendarCheck },
   
  ];
  if (user.role === "admin" || user.role === "stylist") {
    links.push({ to: "/agenda", label: "Agenda", icon: CalendarDays });
  }
  return links;
}

function adminLinks(user) {
  if (user?.role !== "admin") return [];
  return [
    { to: "/admin", label: "Panel", icon: LayoutDashboard, end: true },
    { to: "/admin/servicios", label: "Servicios", icon: Scissors },
    { to: "/admin/estilistas", label: "Estilistas", icon: Users },
    { to: "/admin/estadisticas", label: "Estadísticas", icon: TrendingUp },
    { to: "/admin/apariencia", label: "Apariencia", icon: Palette },
  ];
}

const desktopLink = ({ isActive }) =>
  `flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? "bg-gold/15 text-gold-dark" : "text-ink/70 hover:bg-sand/60 hover:text-ink"
  }`;

const dropdownLink = ({ isActive }) =>
  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
    isActive ? "bg-gold/15 font-medium text-gold-dark" : "hover:bg-sand/60"
  }`;

const mobileLink = ({ isActive }) =>
  `flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition ${
    isActive ? "bg-gold/15 text-gold-dark" : "text-ink/80 hover:bg-sand/60"
  }`;

// Menú desplegable: se cierra al cambiar de página, con Escape o haciendo clic fuera
function useDropdown(pathname) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return { open, setOpen, ref };
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const salon = useSalon();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const userMenu = useDropdown(pathname);
  const adminMenu = useDropdown(pathname);

  const main = mainLinks(user);
  const admin = adminLinks(user);
  const adminActive = pathname.startsWith("/admin");

  // Al cambiar de página se cierra el menú móvil
  useEffect(() => setMobileOpen(false), [pathname]);

  // Sombra al bajar
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setMobileOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function handleLogout() {
    userMenu.setOpen(false);
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
          <BrandIcon
            name={salon.branding.icon}
            className="h-5 w-5 shrink-0 text-gold"
            aria-hidden="true"
          />
          <span className="truncate">
            {salon.name}
            <span className="text-gold">.</span>
          </span>
        </Link>

        {/* Enlaces de escritorio */}
        {user && (
          <div className="hidden items-center gap-1 xl:flex">
            {main.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={desktopLink}>
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </NavLink>
            ))}

            {admin.length > 0 && (
              <div className="relative" ref={adminMenu.ref}>
                <button
                  onClick={() => adminMenu.setOpen(!adminMenu.open)}
                  aria-expanded={adminMenu.open}
                  aria-haspopup="menu"
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    adminActive
                      ? "bg-gold/15 text-gold-dark"
                      : "text-ink/70 hover:bg-sand/60 hover:text-ink"
                  }`}
                >
                  <Settings className="h-4 w-4" aria-hidden="true" />
                  Administración
                  <ChevronDown
                    className={`h-4 w-4 transition ${adminMenu.open ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  />
                </button>

                {adminMenu.open && (
                  <div
                    role="menu"
                    className="absolute left-0 mt-2 w-56 animate-pop rounded-xl border border-sand bg-surface p-2 shadow-lg"
                  >
                    {admin.map(({ to, label, icon: Icon, end }) => (
                      <NavLink key={to} to={to} end={end} role="menuitem" className={dropdownLink}>
                        <Icon className="h-4 w-4" aria-hidden="true" />
                        {label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {user ? (
            <>
              {/* Menú de usuario (escritorio) */}
              <div className="relative hidden xl:block" ref={userMenu.ref}>
                <button
                  onClick={() => userMenu.setOpen(!userMenu.open)}
                  aria-expanded={userMenu.open}
                  aria-haspopup="menu"
                  className="flex items-center gap-2 rounded-full border border-sand bg-surface py-1 pl-1 pr-3 text-sm font-medium transition hover:border-gold"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink font-display text-cream">
                    {user.name[0]}
                  </span>
                  <span className="max-w-32 truncate">{user.name}</span>
                  <ChevronDown
                    className={`h-4 w-4 transition ${userMenu.open ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  />
                </button>

                {userMenu.open && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-60 animate-pop rounded-xl border border-sand bg-surface p-2 shadow-lg"
                  >
                    <div className="px-3 py-2">
                      <p className="truncate font-medium">{user.name}</p>
                      <p className="truncate text-xs text-ink/70">{user.email}</p>
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

              {/* Botón hamburguesa (móvil y pantallas medianas) */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-expanded={mobileOpen}
                aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
                className="rounded-lg border border-sand bg-surface p-2 transition hover:border-gold xl:hidden"
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
        <div className="animate-fade-up border-t border-sand bg-cream xl:hidden">
          <div className="mx-auto max-h-[75vh] max-w-6xl overflow-y-auto px-4 py-3">
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
              {main.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} className={mobileLink}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {label}
                </NavLink>
              ))}

              {admin.length > 0 && (
                <>
                  <p className="px-3 pt-3 text-xs font-semibold uppercase tracking-widest text-ink/60">
                    Administración
                  </p>
                  {admin.map(({ to, label, icon: Icon, end }) => (
                    <NavLink key={to} to={to} end={end} className={mobileLink}>
                      <Icon className="h-5 w-5" aria-hidden="true" />
                      {label}
                    </NavLink>
                  ))}
                </>
              )}

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