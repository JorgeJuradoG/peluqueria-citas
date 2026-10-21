import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const linkClass = ({ isActive }) =>
  `text-sm transition hover:text-gold-dark ${
    isActive ? "font-semibold text-gold-dark" : "text-ink/70"
  }`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  const isStaff = user && (user.role === "admin" || user.role === "stylist");

  return (
    <header className="sticky top-0 z-10 border-b border-sand bg-cream/90 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="font-display text-2xl font-bold tracking-tight">
          Peluquería<span className="text-gold">.</span>
        </Link>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 sm:gap-x-5">
          {user ? (
            <>
              <NavLink to="/reservar" className={linkClass}>Reservar</NavLink>
              <NavLink to="/mis-citas" className={linkClass}>Mis citas</NavLink>
              {isStaff && <NavLink to="/agenda" className={linkClass}>Agenda</NavLink>}
              {user.role === "admin" && (
                <>
                  <NavLink to="/admin/servicios" className={linkClass}>Servicios</NavLink>
                  <NavLink to="/admin/estilistas" className={linkClass}>Estilistas</NavLink>
                </>
              )}
              <span className="hidden h-5 w-px bg-sand sm:block" />
              <NavLink to="/perfil" className={linkClass}>{user.name}</NavLink>
              <button onClick={handleLogout} className="btn-outline">Salir</button>
            </>
          ) : (
            <Link to="/login" className="btn-primary">Entrar</Link>
          )}
        </div>
      </nav>
    </header>
  );
}