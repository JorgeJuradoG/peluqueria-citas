import { Info } from "lucide-react";
import { useSalon } from "../context/SalonContext";
import { policyText } from "../lib/policy";

// Panel con la política de cancelación. No se muestra si la peluquería no tiene límite
export default function PolicyNotice({ className = "" }) {
  const { cancellationHours, phone } = useSalon();
  if (!cancellationHours || cancellationHours <= 0) return null;

  return (
    <aside
      role="note"
      className={`flex items-start gap-3 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm ${className}`}
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-gold-dark" aria-hidden="true" />
      <p className="text-ink/80">
        <b className="text-ink">Política de cancelación.</b> {policyText(cancellationHours)}
        {phone && (
          <>
            {" "}
            Si llegas tarde, llama al{" "}
            <a href={`tel:${phone.replace(/\s/g, "")}`} className="font-medium underline">
              {phone}
            </a>
            .
          </>
        )}
      </p>
    </aside>
  );
}