import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Al cambiar de página, vuelve arriba (el navegador no lo hace en una SPA)
export default function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}