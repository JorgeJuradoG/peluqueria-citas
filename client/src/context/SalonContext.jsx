import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { SALON_SLUG } from "../lib/salon";
import { applyTheme, resolveBranding } from "../lib/theme";

const SalonContext = createContext(null);

export function SalonProvider({ children }) {
  const [salon, setSalon] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const adopt = useCallback((data) => {
    applyTheme(data.branding, data.name); // antes de pintar: sin parpadeo de colores
    document.title = data.name;
    setSalon(data);
  }, []);

  useEffect(() => {
    api
      .get(`/salons/${SALON_SLUG}`)
      .then((res) => adopt(res.data))
      .catch(() => setNotFound(true));
  }, [adopt]);

  // Siempre entrega una marca completa y las secciones con valores por defecto,
  // así las peluquerías antiguas (sin personalización guardada) se ven como siempre
  const value = useMemo(
    () =>
      salon
        ? {
            ...salon,
            branding: resolveBranding(salon.branding),
            social: salon.social ?? {},
            sections: { howItWorks: true, perks: true, ...(salon.sections ?? {}) },
            updateSalon: adopt,
          }
        : null,
    [salon, adopt]
  );

  if (notFound) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-4xl font-bold">Peluquería no encontrada</h1>
        <p className="mt-3 text-ink/70">
          La dirección «{SALON_SLUG}» no existe o está desactivada.
        </p>
        <a href="/" className="btn-primary mt-6">Ir al inicio</a>
      </div>
    );
  }
  if (!value) return <p className="p-10 text-center text-ink/70">Cargando...</p>;

  return <SalonContext.Provider value={value}>{children}</SalonContext.Provider>;
}

export function useSalon() {
  return useContext(SalonContext);
}