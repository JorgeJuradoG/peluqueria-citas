import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <nav className="flex items-center justify-between border-b px-6 py-3">
      <Link to="/" className="text-lg font-bold">Peluquería</Link>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span>Hola, {user.name} {(user.role === "admin" || user.role === "stylist") && (
  <Link to="/agenda" className="underline">Agenda</Link>
)} <Link to="/reservar" className="underline">Reservar</Link>   <Link to="/mis-citas" className="underline">Mis citas</Link></span>
            <button onClick={handleLogout} className="underline">Salir</button>
          </>
        ) : (
          <Link to="/login" className="underline">Entrar</Link>
        )}
      </div>
    </nav>
  );
}