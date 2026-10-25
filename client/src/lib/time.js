export function greeting(date, tz) {
  const hour =
    Number(
      new Intl.DateTimeFormat("es-ES", { hour: "numeric", hour12: false, timeZone: tz }).format(date)
    ) % 24;
  return hour < 13 ? "Buenos días" : hour < 21 ? "Buenas tardes" : "Buenas noches";
}

export function countdown(target, now) {
  const mins = Math.round((new Date(target) - now) / 60000);
  if (mins <= 0) return "Ahora";
  if (mins < 60) return `En ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `En ${hours} h ${mins % 60} min`;
  const days = Math.floor(hours / 24);
  return `En ${days} ${days === 1 ? "día" : "días"}`;
}