import { Globe, MessageCircle } from "lucide-react";

export function InstagramIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function socialItems(social) {
  const s = social ?? {};
  const items = [];
  if (s.instagram) {
    items.push({
      key: "instagram",
      label: "Instagram",
      text: `@${s.instagram}`,
      href: `https://instagram.com/${encodeURIComponent(s.instagram)}`,
      Icon: InstagramIcon,
    });
  }
  if (s.whatsapp) {
    items.push({
      key: "whatsapp",
      label: "WhatsApp",
      text: "WhatsApp",
      href: `https://wa.me/${encodeURIComponent(s.whatsapp)}`,
      Icon: MessageCircle,
    });
  }
  if (s.website && s.website.startsWith("https://")) {
    items.push({
      key: "website",
      label: "Sitio web",
      text: s.website.replace(/^https:\/\//, ""),
      href: s.website,
      Icon: Globe,
    });
  }
  return items;
}

// Solo iconos (para el pie de página)
export default function SocialLinks({ social, className = "" }) {
  const items = socialItems(social);
  if (items.length === 0) return null;
  return (
    <ul className={`flex items-center gap-2 ${className}`}>
      {items.map(({ key, label, href, Icon }) => (
        <li key={key}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            title={label}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-sand transition hover:border-gold hover:text-gold-dark"
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
          </a>
        </li>
      ))}
    </ul>
  );
}