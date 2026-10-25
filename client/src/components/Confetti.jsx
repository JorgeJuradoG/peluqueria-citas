import { useMemo } from "react";

const COLORS = ["#b08d57", "#5b8fd1", "#d0735a", "#7a9a7e", "#d4708f", "#e0a030"];

const reduceMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function Confetti({ count = 44 }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 500,
        duration: 1800 + Math.random() * 1500,
        size: 6 + Math.random() * 6,
        drift: (Math.random() - 0.5) * 180,
        rotate: 360 + Math.random() * 720,
        color: COLORS[i % COLORS.length],
        round: i % 3 === 0,
      })),
    [count]
  );

  if (reduceMotion()) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * (p.round ? 1 : 1.6),
            backgroundColor: p.color,
            borderRadius: p.round ? "9999px" : "2px",
            animationDelay: `${p.delay}ms`,
            animationDuration: `${p.duration}ms`,
            "--drift": `${p.drift}px`,
            "--rot": `${p.rotate}deg`,
          }}
        />
      ))}
    </div>
  );
}