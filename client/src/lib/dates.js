// Día de hoy (AAAA-MM-DD) en la zona horaria de la peluquería
export function todayISO(tz) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date());
}

export function formatTime(iso, tz) {
  return new Date(iso).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: tz,
  });
}

export function formatDateTime(iso, tz) {
  return new Date(iso).toLocaleString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: tz,
  });
}

// «miércoles, 28 de octubre» (sin hora)
export function formatLongDate(iso, tz) {
  return new Date(iso).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: tz,
  });
}
