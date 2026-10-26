export const CANCELLATION_OPTIONS = [
  { value: 0, label: "Sin límite" },
  { value: 2, label: "2 horas antes" },
  { value: 4, label: "4 horas antes" },
  { value: 12, label: "12 horas antes" },
  { value: 24, label: "24 horas antes" },
  { value: 48, label: "48 horas antes" },
];

// ¿Puede el cliente cancelar o mover esta cita? hours = 0 significa «sin límite»
export function canChange(start, hours, now = new Date()) {
  if (!hours || hours <= 0) return true;
  return new Date(start).getTime() - now.getTime() >= hours * 3600 * 1000;
}

export function policyText(hours) {
  return hours > 0 ? `Puedes cancelar o cambiar tu cita hasta ${hours} horas antes.` : "";
}