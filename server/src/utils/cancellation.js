export const CANCELLATION_HOURS = [0, 2, 4, 12, 24, 48];

// ¿Puede un cliente cancelar o mover esta cita? hours = 0 significa «sin límite»
export function canClientChange(start, hours, now = new Date()) {
  if (!hours || hours <= 0) return true;
  return new Date(start).getTime() - now.getTime() >= hours * 3600 * 1000;
}

export function cancellationMessage(hours, phone) {
  return (
    `Solo se puede cancelar o cambiar la cita hasta ${hours} horas antes.` +
    (phone ? ` Llama al ${phone} y te ayudarán.` : " Contacta con la peluquería.")
  );
}