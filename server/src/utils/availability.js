import { DateTime } from "luxon";

const SLOT_STEP_MINUTES = 15;

// Franjas de trabajo de un día como fechas reales (UTC). localDay ya está en la zona del salón
export function workingRangesFor(stylist, localDay) {
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

export function fitsInWorkingHours(stylist, start, end, tz) {
  const localDay = DateTime.fromJSDate(start, { zone: tz }).startOf("day");
  return workingRangesFor(stylist, localDay).some(
    (range) => start >= range.start && end <= range.end
  );
}

export function getAvailableSlots({ stylist, service, localDay, appointments, tz, now = new Date() }) {
  const durationMs = service.durationMinutes * 60000;
  const stepMs = SLOT_STEP_MINUTES * 60000;
  const slots = [];

  for (const range of workingRangesFor(stylist, localDay)) {
    for (
      let s = range.start.getTime();
      s + durationMs <= range.end.getTime();
      s += stepMs
    ) {
      const slotStart = new Date(s);
      const slotEnd = new Date(s + durationMs);

      if (slotStart <= now) continue;

      const busy = appointments.some((a) => a.start < slotEnd && a.end > slotStart);
      if (busy) continue;

      slots.push({
        start: slotStart.toISOString(),
        label: DateTime.fromJSDate(slotStart, { zone: tz }).toFormat("HH:mm"),
      });
    }
  }
  return slots;
}