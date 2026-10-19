import { DateTime } from "luxon";

const TZ = process.env.SALON_TIMEZONE || "Europe/Madrid";

// Devuelve las franjas de trabajo de un día como fechas reales (UTC)
export function workingRangesFor(stylist, localDay) {
  // daysOff se guarda como fecha sin hora (UTC), así que se compara en UTC
  const isoDay = localDay.toISODate();
  const isDayOff = stylist.daysOff.some(
    (d) => DateTime.fromJSDate(d, { zone: "utc" }).toISODate() === isoDay
  );
  if (isDayOff) return [];

  // luxon: lunes=1 ... domingo=7. Nuestro modelo: domingo=0 ... sábado=6
  const dayOfWeek = localDay.weekday % 7;

  return stylist.workingHours
    .filter((h) => h.dayOfWeek === dayOfWeek)
    .map((h) => {
      const [sh, sm] = h.start.split(":").map(Number);
      const [eh, em] = h.end.split(":").map(Number);
      return {
        start: localDay.set({ hour: sh, minute: sm }).toJSDate(),
        end: localDay.set({ hour: eh, minute: em }).toJSDate(),
      };
    });
}

// ¿La cita [start, end] cabe entera dentro de alguna franja de trabajo?
export function fitsInWorkingHours(stylist, start, end) {
  const localDay = DateTime.fromJSDate(start, { zone: TZ }).startOf("day");
  return workingRangesFor(stylist, localDay).some(
    (range) => start >= range.start && end <= range.end
  );
}