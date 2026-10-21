import { useEffect, useState } from "react";

const KEY = "theme"; // "light" | "dark" | "system"

function apply(theme) {
  const dark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

function readStored() {
  try {
    return localStorage.getItem(KEY) || "system";
  } catch {
    return "system";
  }
}

export default function useTheme() {
  const [theme, setThemeState] = useState(readStored);

  useEffect(() => {
    apply(theme);
    if (theme !== "system") return;

    // En modo "sistema", sigue los cambios del dispositivo en directo
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [theme]);

  function setTheme(next) {
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* sin almacenamiento: el cambio dura hasta recargar */
    }
    setThemeState(next);
  }

  return [theme, setTheme];
}