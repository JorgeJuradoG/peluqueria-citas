// Bloque gris animado: se le da la forma con className (alto, ancho...)
export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-lg bg-sand ${className}`} aria-hidden="true" />;
}

// Tarjeta de servicio (inicio)
export function ServiceCardSkeleton() {
  return (
    <li className="card">
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="mt-3 h-4 w-1/3" />
      <Skeleton className="mt-6 h-7 w-1/4" />
    </li>
  );
}

// Fila de cita (Mis citas)
export function AppointmentSkeleton() {
  return (
    <li className="card flex flex-wrap items-center justify-between gap-3">
      <div className="w-full max-w-xs space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <Skeleton className="h-8 w-28" />
    </li>
  );
}