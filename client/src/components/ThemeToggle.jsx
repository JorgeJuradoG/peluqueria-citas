import { Monitor, Moon, Sun } from "lucide-react";
import useTheme from "../hooks/useTheme";

const ORDER = ["light", "dark", "system"];
const META = {
  light: { icon: Sun, label: "Claro" },
  dark: { icon: Moon, label: "Oscuro" },
  system: { icon: Monitor, label: "Sistema" },
};

export default function ThemeToggle() {
  const [theme, setTheme] = useTheme();
  const { icon: Icon, label } = META[theme];
  const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];

  return (
    <button
      onClick={() => setTheme(next)}
      title={`Tema: ${label}`}
      aria-label={`Tema ${label}. Cambiar a ${META[next].label}`}
      className="rounded-lg border border-sand bg-surface p-2 text-ink/70 transition hover:border-gold hover:text-gold-dark"
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}