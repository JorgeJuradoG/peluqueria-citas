import { useEffect, useState } from "react";

// Fecha actual que se refresca sola (para cuentas atrás)
export default function useNow(ms = 30000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}