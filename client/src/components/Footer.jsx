import { Link } from "react-router-dom";
import { Scissors } from "lucide-react";
import { useSalon } from "../context/SalonContext";

export default function Footer() {
  const salon = useSalon();

  return (
    <footer className="mt-16 border-t border-sand">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-ink/70">
        <p className="flex items-center gap-2">
          <Scissors className="h-4 w-4 text-gold" aria-hidden="true" />
          {salon.name} · © {new Date().getFullYear()}
        </p>
        <nav className="flex items-center gap-4">
          <Link to="/" className="transition hover:text-gold-dark">Inicio</Link>
          <Link to="/reservar" className="transition hover:text-gold-dark">Reservar</Link>
        </nav>
      </div>
    </footer>
  );
}