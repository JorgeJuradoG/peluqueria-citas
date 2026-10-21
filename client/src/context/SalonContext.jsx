import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";
import { SALON_SLUG } from "../lib/salon";

const SalonContext = createContext(null);

export function SalonProvider({ children }) {
  const [salon, setSalon] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api
      .get(`/salons/${SALON_SLUG}`)
      .then((res) => {
        setSalon(res.data);
        document.title = res.data.name;
      })
      .catch(() => setNotFound(true));
  }, []);

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
  if (!salon) return <p className="p-10 text-center text-ink/60">Cargando...</p>;

  return <SalonContext.Provider value={salon}>{children}</SalonContext.Provider>;
}

export function useSalon() {
  return useContext(SalonContext);
}