import { Link } from "react-router-dom";
import { MapPin, Phone } from "lucide-react";
import BrandIcon from "./BrandIcon";
import SocialLinks from "./SocialLinks";
import { useSalon } from "../context/SalonContext";

export default function Footer() {
  const salon = useSalon();

  return (
    <footer className="mt-16 border-t border-sand">
      <div className="mx-auto flex max-w-6xl flex-wrap items-start justify-between gap-4 px-4 py-6 text-sm text-ink/70">
        <div className="space-y-1">
          <p className="flex items-center gap-2 font-medium text-ink">
            <BrandIcon name={salon.branding.icon} className="h-4 w-4 text-gold" aria-hidden="true" />
            {salon.name} · © {new Date().getFullYear()}
          </p>
          {salon.address && (
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              {salon.address}
            </p>
          )}
          {salon.phone && (
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4" aria-hidden="true" />
              <a href={`tel:${salon.phone.replace(/\s/g, "")}`} className="transition hover:text-gold-dark">
                {salon.phone}
              </a>
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-3">
          <nav className="flex items-center gap-4">
            <Link to="/" className="transition hover:text-gold-dark">Inicio</Link>
            <Link to="/reservar" className="transition hover:text-gold-dark">Reservar</Link>
          </nav>
          <SocialLinks social={salon.social} />
        </div>
      </div>
    </footer>
  );
}