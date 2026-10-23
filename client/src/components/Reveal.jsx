import { useEffect, useRef, useState } from "react";

const VARIANTS = {
  up: "animate-fade-up",
  zoom: "animate-pop",
  right: "animate-slide-in",
  left: "animate-slide-left",
};

export default function Reveal({ children, delay = 0, variant = "up", className = "" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Sin soporte del navegador: se muestra directamente
    if (!("IntersectionObserver" in window)) return setVisible(true);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ animationDelay: `${delay}ms` }}
      className={`${visible ? VARIANTS[variant] ?? VARIANTS.up : "opacity-0"} ${className}`}
    >
      {children}
    </div>
  );
}