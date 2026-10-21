import { useEffect, useRef, useState } from "react";

export default function Reveal({ children, delay = 0, className = "" }) {
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
      className={`${visible ? "animate-fade-up" : "opacity-0"} ${className}`}
    >
      {children}
    </div>
  );
}