import { Check } from "lucide-react";

export default function Stepper({ steps, current }) {
  return (
    <ol className="flex items-center" aria-label="Progreso">
      {steps.map((name, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={name} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-2">
              <span
                aria-current={active ? "step" : undefined}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition ${
                  done
                    ? "bg-emerald-600 text-white"
                    : active
                    ? "bg-ink text-cream"
                    : "bg-sand text-ink/60"
                }`}
              >
                {done ? <Check className="h-4 w-4" aria-hidden="true" /> : i + 1}
              </span>
              <span className={`hidden text-sm sm:inline ${active ? "font-medium" : "text-ink/60"}`}>
                {name}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span
                aria-hidden="true"
                className={`mx-3 h-0.5 flex-1 rounded transition ${done ? "bg-emerald-600" : "bg-sand"}`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}