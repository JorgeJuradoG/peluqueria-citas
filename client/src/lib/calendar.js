// Formato de fecha para calendarios: 20261026T090000Z (siempre en UTC)
function toUTC(date) {
  return new Date(date).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

// Escapa los caracteres que tienen significado en el formato iCalendar
function escapeICS(text) {
  return String(text ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

export function buildICS({ uid, title, description, start, end, location }) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Peluqueria//Citas//ES",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}@citas`,
    `DTSTAMP:${toUTC(new Date())}`,
    `DTSTART:${toUTC(start)}`,
    `DTEND:${toUTC(end)}`,
    `SUMMARY:${escapeICS(title)}`,
    `DESCRIPTION:${escapeICS(description)}`,
    ...(location ? [`LOCATION:${escapeICS(location)}`] : []),
    "BEGIN:VALARM",
    "TRIGGER:-PT1H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Recordatorio de cita",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}

export function downloadICS(filename, content) {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Enlace directo para abrir el evento ya rellenado en Google Calendar
export function googleCalendarUrl({ title, description, start, end, location }) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${toUTC(start)}/${toUTC(end)}`,
    details: description,
  });
  if (location) params.set("location", location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// Datos de evento a partir de una cita y el nombre de la peluquería
export function eventFromAppointment({ id, start, end, serviceName, stylistName, salonName }) {
  return {
    uid: id,
    title: `${serviceName} · ${salonName}`,
    description: `${serviceName} con ${stylistName} en ${salonName}`,
    start,
    end,
  };
}