import { useState } from "react";
import { Eye, EyeOff, Lock, TriangleAlert } from "lucide-react";

// Campo con icono a la izquierda. La etiqueta envuelve al campo, así que
// al pulsar el texto se enfoca y un lector de pantalla lo anuncia bien
export function Field({ label, icon: Icon, hint, optional, children }) {
  return (
    <div>
      <label className="block">
        <span className="label">
          {label} {optional && <span className="text-ink/60">(opcional)</span>}
        </span>
        <span className="relative block">
          <Icon
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40"
            aria-hidden="true"
          />
          {children}
        </span>
      </label>
      {hint && <p className="mt-1 text-xs text-ink/60">{hint}</p>}
    </div>
  );
}

export function PasswordField({ label, name, value, onChange, autoComplete, hint }) {
  const [show, setShow] = useState(false);
  return (
    <Field label={label} icon={Lock} hint={hint}>
      <input
        name={name}
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        className="input pl-9 pr-10"
        required
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink/50 transition hover:text-ink"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </Field>
  );
}

export function ErrorAlert({ children }) {
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      {children}
    </p>
  );
}