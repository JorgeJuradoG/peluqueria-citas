import { Clock, MapPin, Phone } from "lucide-react";
import { socialItems } from "./SocialLinks";

function Row({ icon: Icon, title, children }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold-dark">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <div className="mt-0.5 text-sm text-ink/70">{children}</div>
      </div>
    </li>
  );
}

export default function ContactCard({ salon }) {
  const items = socialItems(salon.social);
  if (!salon.hours && !salon.address && !salon.phone && items.length === 0) return null;

  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(salon.address)}`;

  return (
    <section className="card">
      <h2 className="text-3xl font-bold">Visítanos</h2>
      <ul className="mt-6 grid gap-6 sm:grid-cols-2">
        {salon.address && (
          <Row icon={MapPin} title="Dónde estamos">
            <p>{salon.address}</p>
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold-dark underline"
            >
              Ver en el mapa
            </a>
          </Row>
        )}
        {salon.hours && (
          <Row icon={Clock} title="Horario">
            <p className="whitespace-pre-line">{salon.hours}</p>
          </Row>
        )}
        {salon.phone && (
          <Row icon={Phone} title="Teléfono">
            <a href={`tel:${salon.phone.replace(/\s/g, "")}`} className="hover:text-gold-dark">
              {salon.phone}
            </a>
          </Row>
        )}
        {items.map(({ key, label, text, href, Icon }) => (
          <Row key={key} icon={Icon} title={label}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all hover:text-gold-dark"
            >
              {text}
            </a>
          </Row>
        ))}
      </ul>
    </section>
  );
}