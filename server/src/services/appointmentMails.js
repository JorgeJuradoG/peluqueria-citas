import { DateTime } from "luxon";
import Appointment from "../models/Appointment.js";
import { sendMail } from "./mailer.js";

// Evita que un nombre con < > & rompa o inyecte HTML en el correo
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));

// Cualquier fallo se registra, pero nunca llega al controlador
const safe = (fn) => async (...args) => {
  try {
    await fn(...args);
  } catch (err) {
    console.error("[mail]", err.message);
  }
};

function formatWhen(date, tz) {
  return DateTime.fromJSDate(date, { zone: tz })
    .setLocale("es")
    .toFormat("cccc d 'de' LLLL 'a las' HH:mm");
}

function layout(salon, title, bodyHtml) {
  return `
  <div style="font-family:Arial,sans-serif;background:#faf7f2;padding:24px">
    <div style="max-width:480px;margin:auto;background:#fff;border:1px solid #ece5d8;border-radius:12px;padding:28px">
      <p style="margin:0;color:#b08d57;font-size:12px;letter-spacing:2px;text-transform:uppercase">${esc(salon.name)}</p>
      <h1 style="margin:8px 0 16px;font-size:22px;color:#1c1917">${esc(title)}</h1>
      ${bodyHtml}
    </div>
  </div>`;
}

function row(label, value) {
  return `<tr><td style="padding:6px 0;color:#78716c">${label}</td><td style="padding:6px 0">${value}</td></tr>`;
}

function button(href, label) {
  return `<p style="margin-top:20px"><a href="${esc(href)}" style="background:#1c1917;color:#faf7f2;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:14px">${label}</a></p>`;
}

function baseUrl(salon) {
  return `${process.env.CLIENT_URL || "http://localhost:5173"}/s/${salon.slug}`;
}

function loadAppointment(id) {
  return Appointment.findById(id)
    .populate("client", "name email")
    .populate("service", "name price durationMinutes")
    .populate({ path: "stylist", populate: { path: "user", select: "name email" } });
}

// ---------- Confirmación (al cliente) ----------
export const sendAppointmentConfirmation = safe(async (appointmentId, salon) => {
  const a = await loadAppointment(appointmentId);
  if (!a || !a.client?.email) return;

  const when = formatWhen(a.start, salon.timezone);
  const link = `${baseUrl(salon)}/mis-citas`;

  const html = layout(
    salon,
    "Tu cita está confirmada",
    `<p style="color:#1c1917">Hola ${esc(a.client.name)}, te esperamos:</p>
     <table style="width:100%;font-size:14px;color:#1c1917;border-collapse:collapse">
       ${row("Cuándo", `<b>${esc(when)}</b>`)}
       ${row("Servicio", `${esc(a.service.name)} (${a.service.durationMinutes} min)`)}
       ${row("Con", esc(a.stylist.user.name))}
       ${row("Precio", `${a.service.price} €`)}
     </table>
     ${button(link, "Ver o cambiar mi cita")}`
  );

  await sendMail({
    to: a.client.email,
    subject: `Cita confirmada: ${when} · ${salon.name}`,
    html,
    text: `Tu cita está confirmada\n\n${when}\n${a.service.name} con ${a.stylist.user.name} (${a.service.price} €)\n\nGestiona tu cita: ${link}`,
  });
});

// ---------- Cancelación ----------
// byClient: true si la canceló el propio cliente (entonces se avisa también al estilista)
export const sendAppointmentCancelled = safe(async (appointmentId, salon, { byClient }) => {
  const a = await loadAppointment(appointmentId);
  if (!a) return;

  const when = formatWhen(a.start, salon.timezone);
  const details = `<table style="width:100%;font-size:14px;color:#1c1917;border-collapse:collapse">
       ${row("Cita", `<b>${esc(when)}</b>`)}
       ${row("Servicio", esc(a.service.name))}
       ${row("Con", esc(a.stylist.user.name))}
     </table>`;

  if (a.client?.email) {
    const link = `${baseUrl(salon)}/reservar`;
    await sendMail({
      to: a.client.email,
      subject: `Cita cancelada: ${when} · ${salon.name}`,
      html: layout(
        salon,
        "Tu cita ha sido cancelada",
        `<p style="color:#1c1917">Hola ${esc(a.client.name)}, esta cita ya no está activa:</p>
         ${details}
         ${button(link, "Reservar otra cita")}`
      ),
      text: `Tu cita ha sido cancelada\n\n${when}\n${a.service.name} con ${a.stylist.user.name}\n\nReserva otra: ${link}`,
    });
  }

  if (byClient && a.stylist?.user?.email) {
    const link = `${baseUrl(salon)}/agenda`;
    await sendMail({
      to: a.stylist.user.email,
      subject: `Cita cancelada por el cliente: ${when}`,
      html: layout(
        salon,
        "Un cliente ha cancelado su cita",
        `<p style="color:#1c1917">${esc(a.client?.name)} ha cancelado:</p>
         ${details}
         <p style="color:#78716c;font-size:13px">El hueco vuelve a estar libre para nuevas reservas.</p>
         ${button(link, "Ver mi agenda")}`
      ),
      text: `${a.client?.name} ha cancelado su cita del ${when} (${a.service.name}).\nAgenda: ${link}`,
    });
  }
});

// ---------- Reprogramación ----------
export const sendAppointmentRescheduled = safe(async (appointmentId, salon, oldStart, { byClient }) => {
  const a = await loadAppointment(appointmentId);
  if (!a) return;

  const oldWhen = formatWhen(oldStart, salon.timezone);
  const newWhen = formatWhen(a.start, salon.timezone);

  const details = `<table style="width:100%;font-size:14px;color:#1c1917;border-collapse:collapse">
       ${row("Antes", `<span style="text-decoration:line-through;color:#78716c">${esc(oldWhen)}</span>`)}
       ${row("Ahora", `<b>${esc(newWhen)}</b>`)}
       ${row("Servicio", esc(a.service.name))}
       ${row("Con", esc(a.stylist.user.name))}
     </table>`;

  if (a.client?.email) {
    const link = `${baseUrl(salon)}/mis-citas`;
    await sendMail({
      to: a.client.email,
      subject: `Cita cambiada: ${newWhen} · ${salon.name}`,
      html: layout(
        salon,
        "Tu cita ha cambiado de hora",
        `<p style="color:#1c1917">Hola ${esc(a.client.name)}, estos son los nuevos datos:</p>
         ${details}
         ${button(link, "Ver mi cita")}`
      ),
      text: `Tu cita ha cambiado de hora\n\nAntes: ${oldWhen}\nAhora: ${newWhen}\n${a.service.name} con ${a.stylist.user.name}\n\n${link}`,
    });
  }

  if (byClient && a.stylist?.user?.email) {
    const link = `${baseUrl(salon)}/agenda`;
    await sendMail({
      to: a.stylist.user.email,
      subject: `Cita reprogramada por el cliente: ${newWhen}`,
      html: layout(
        salon,
        "Un cliente ha movido su cita",
        `<p style="color:#1c1917">${esc(a.client?.name)} ha cambiado la hora:</p>
         ${details}
         ${button(link, "Ver mi agenda")}`
      ),
      text: `${a.client?.name} ha movido su cita.\nAntes: ${oldWhen}\nAhora: ${newWhen}\nAgenda: ${link}`,
    });
  }
});