import { STAFF_TERMS, termsFor } from "../lib/terms";

export default function StaffTermPicker({ value, onChange }) {
  const t = termsFor(value);
  return (
    <fieldset>
      <legend className="label">¿Cómo llamas a tu equipo?</legend>
      <div className="grid grid-cols-3 gap-2">
        {Object.entries(STAFF_TERMS).map(([key, term]) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            aria-pressed={value === key}
            className={`rounded-xl border p-3 text-sm font-medium capitalize transition ${
              value === key
                ? "border-gold bg-gold/10 ring-2 ring-gold/30"
                : "border-sand hover:border-gold"
            }`}
          >
            {term.one}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-ink/70">
        Se usa en toda tu web: «Elige {t.one}», «Añadir {t.one}», «{t.Many} activos»...
      </p>
    </fieldset>
  );
}