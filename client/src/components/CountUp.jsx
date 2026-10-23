import { useEffect, useRef, useState } from "react";

const reduceMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function CountUp({
  value,
  format = (n) => String(Math.round(n)),
  duration = 900,
}) {
  const [shown, setShown] = useState(() => (reduceMotion() ? value : 0));
  const current = useRef(shown);

  useEffect(() => {
    if (reduceMotion()) {
      current.current = value;
      setShown(value);
      return;
    }

    const from = current.current;
    const start = performance.now();
    let frame;

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from + (value - from) * eased;
      current.current = next;
      setShown(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return (
    <>
      <span aria-hidden="true">{format(shown)}</span>
      <span className="sr-only">{format(value)}</span>
    </>
  );
}