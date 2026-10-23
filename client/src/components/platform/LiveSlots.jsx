import { useEffect, useRef, useState } from "react";
import { CalendarDays, Clock, Scissors, UserRound, Zap } from "lucide-react";
import BrandIcon from "../BrandIcon";
import BrowserFrame from "./BrowserFrame";

const TIMES = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "16:00", "16:30", "17:00",
];
const INITIAL = ["09:30", "10:30", "16:00"];
const NAMES = ["Ana", "Carlos", "Lucía", "Pablo", "Marta", "Sara"];

export default function LiveSlots() {
  const [taken, setTaken] = useState(INITIAL);
  const [last, setLast] = useState(null);
  const takenRef = useRef(INITIAL);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = setInterval(() => {
      const prev = takenRef.current;
      const free = TIMES.filter((t) => !prev.includes(t));

      // Cuando casi no quedan huecos, vuelve a empezar
      if (free.length <= 4) {
        takenRef.current = INITIAL;
        setTaken(INITIAL);
        setLast(null);
        return;
      }

      const time = free[Math.floor(Math.random() * free.length)];
      const name = NAMES[Math.floor(Math.random() * NAMES.length)];
      takenRef.current = [...prev, time];
      setTaken(takenRef.current);
      setLast({ time, name, id: Date.now() });
    }, 2600);

    return () => clearInterval(id);
  }, []);

  return (
    <figure>
      <BrowserFrame url={`${window.location.host}/s/peluqueria-lola`}>
        <div className="relative p-5" aria-hidden="true">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 font-display text-lg font-bold">
              <BrandIcon name="scissors" className="h-4 w-4 text-gold" />
              Peluquería Lola<span className="text-gold">.</span>
            </span>
            <span className="rounded-lg bg-gold/15 px-2.5 py-1 text-xs font-medium text-gold-dark">
              Reservar
            </span>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gold bg-gold/10 px-3 py-1.5 font-medium">
              <Scissors className="h-3.5 w-3.5" />
              Corte de pelo · 30 min · 15 €
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gold bg-gold/10 px-3 py-1.5 font-medium">
              <UserRound className="h-3.5 w-3.5" />
              Marta
            </span>
          </div>

          <p className="mt-5 flex items-center gap-2 text-sm font-medium text-ink/70">
            <CalendarDays className="h-4 w-4" />
            Huecos libres · jueves
          </p>

          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {TIMES.map((t) => {
              const isTaken = taken.includes(t);
              const justTaken = last?.time === t;
              return (
                <span
                  key={t}
                  className={`rounded-full border py-2 text-center text-sm font-medium transition ${
                    isTaken
                      ? "border-transparent bg-sand text-ink/40 line-through"
                      : "border-ink/15"
                  } ${justTaken ? "animate-pop ring-2 ring-gold" : ""}`}
                >
                  {t}
                </span>
              );
            })}
          </div>

          <div className="mt-5 flex min-h-10 items-center">
            {last ? (
              <p
                key={last.id}
                className="inline-flex animate-slide-in items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-900"
              >
                <Zap className="h-3.5 w-3.5" />
                {last.name} acaba de reservar las {last.time}
              </p>
            ) : (
              <p className="flex items-center gap-2 text-xs text-ink/60">
                <Clock className="h-3.5 w-3.5" />
                Los huecos se actualizan solos
              </p>
            )}
          </div>
        </div>
      </BrowserFrame>
      <figcaption className="mt-3 text-center text-xs text-ink/60">
        Simulación ilustrativa de las reservas en tiempo real.
      </figcaption>
    </figure>
  );
}