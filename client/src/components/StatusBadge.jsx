import { Ban, CheckCheck, CircleCheck, Clock } from "lucide-react";

const CONFIG = {
  pending: { label: "Pendiente", icon: Clock, style: "bg-amber-100 text-amber-800" },
  confirmed: { label: "Confirmada", icon: CircleCheck, style: "bg-emerald-100 text-emerald-800" },
  cancelled: { label: "Cancelada", icon: Ban, style: "bg-red-100 text-red-700" },
  completed: { label: "Completada", icon: CheckCheck, style: "bg-stone-200 text-stone-700" },
};

export default function StatusBadge({ status }) {
  const { label, icon: Icon, style } = CONFIG[status] ?? CONFIG.pending;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}