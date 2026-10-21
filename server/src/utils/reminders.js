export const REMINDER_HOURS = Number(process.env.REMINDER_HOURS) || 24;
export const REMINDER_MS = REMINDER_HOURS * 3600 * 1000;

// Si la cita ya cae dentro de la ventana, el recordatorio no aporta nada:
// se marca como enviado. Si no, queda pendiente (null).
export function initialReminderSentAt(start) {
  return start.getTime() - Date.now() <= REMINDER_MS ? new Date() : null;
}