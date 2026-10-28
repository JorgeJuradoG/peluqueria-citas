import { DateTime } from "luxon";
import Appointment from "../models/Appointment.js";
import { sendMail } from "./mailer.js";
import { emailBrand, mapUrl } from "./emailTheme.js";
import { publicUrl } from "../utils/origins.js";

// Evita que un nombre con < > & rompa o inyecte HTML en el correo
export const esc = (s) =>
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

// Marco común de todos los correos, con la marca de la peluquería
export function layout(salon, title, bodyHtml) {
  const t = emailBrand(salon);

  const footerLines = [];
  if (t.address) {
    footerLines.push(
      `<a href="${esc(mapUrl(t.address))}" style="color:#78716c">${esc(t.address)}</a>`
    );
  }
  if (t.phone) {
    footerLines.push(
      `<a href="tel:${esc(t.phone.replace(/\s/g, ""))}" style="color:#78716c">${esc(t.phone)}</a>`
    );
  }
  const footer = footerLines.length
    ? `<p style="margin:24px 0 0;padding-top:16px;border-top:1px solid #ece5d8;font-size:12px;line-height:1.6;color:#78716c">${footerLines.join("<br>")}</p>`
    : "";

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#faf7f2;padding:24px">
    <div style="max-width:480px;margin:auto;background:#ffffff;border:1px solid #ece5d8;border-top:6px solid ${t.gold};border-radius:${t.cardRadius}px;padding:28px">
      <p style="margin:0;color:${t.goldDark};font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase">${esc(t.name)}</p>
      <h1 style="margin:8px 0 16px;font-family:${t.headingFont};font-size:22px;color:#1c1917">${esc(title)}</h1>
      ${bodyHtml}
      ${footer}
    </div>
  </div>`;
}

function row(label, value) {
  return `<tr><td style="padding:6px 0;color:#78716c">${label}</td><td style="padding:6px 0">${value}</td></tr>`;
}

export function button(href, label, salon) {
  const t = emailBrand(salon);
  return `<p style="margin-top:20px"><a href="${esc(href)}" style="display:inline-block;background:${t.gold};color:#1c1917;text-decoration:none;padding:10px 18px;border-radius:${t.buttonRadius}px;font-size:14px;font-weight:bold">${label}</a></p>`;
}

export function baseUrl(salon) {
  return `${publicUrl()}/s/${salon.slug}`;
}

// Fila «Dónde» con enlace al mapa (vacía si la peluquería no tiene dirección)
function whereRow(salon) {
  const t = emailBrand(salon);
  if (!t.address) return "";
  return row(
    "Dónde",
    `<a href="${esc(mapUrl(t.address))}" style="color:${t.goldDark}">${esc(t.address)}</a>`
  );
}

function whereText(salon) {
  return salon.address ? `\nDónde: ${salon.address}` : "";
}

// Política de cancelación: solo si la peluquería tiene un límite (0 = sin límite)
function policySentence(salon) {
  const h = salon.cancellationHours ?? 0;
  return h > 0 ? `Puedes cancelar o cambiar tu cita hasta ${h} horas antes.` : "";
}

function policyHtml(salon) {
  const s = policySentence(salon);
  return s
    ? `<p style="margin:16px 0 0;padding:10px 12px;background:#faf7f2;border-radius:8px;font-size:13px;color:#57534e"><b>Política de cancelación.</b> ${esc(s)}</p>`
    : "";
}

function policyText(salon) {
  const s = policySentence(salon);
  return s ? `\n\nPolítica de cancelación: ${s}` : "";
}

// Firma de los correos en texto plano
export function textSignature(salon) {
  return (
    `\n\n— ${salon.name}` +
    (salon.address ? `\n${salon.address}` : "") +
    (salon.phone ? `\n${salon.phone}` : "")
  );
}

async function loadAppointment(id) {
  const a = await Appointment.findById(id)
    .populate("client", "name email")
    .populate("service", "name price durationMinutes")
    .populate({ path: "stylist", populate: { path: "user", select: "name email" } });

  // Si faltan datos (por ejemplo, el estilista se borró), no hay correo que enviar
  return a?.service && a.stylist?.user ? a : null;
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
       ${whereRow(salon)}
       ${row("Precio", `${a.service.price} €`)}
     </table>
     ${policyHtml(salon)}
     ${button(link, "Ver o cambiar mi cita", salon)}`
  );

  await sendMail({
    to: a.client.email,
    fromName: salon.name,
    subject: `Cita confirmada: ${when} · ${salon.name}`,
    html,
    text:
      `Tu cita está confirmada\n\n${when}\n${a.service.name} con ${a.stylist.user.name} (${a.service.price} €)` +
      `${whereText(salon)}${policyText(salon)}\n\nGestiona tu cita: ${link}${textSignature(salon)}`,
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
      fromName: salon.name,
      subject: `Cita cancelada: ${when} · ${salon.name}`,
      html: layout(
        salon,
        "Tu cita ha sido cancelada",
        `<p style="color:#1c1917">Hola ${esc(a.client.name)}, esta cita ya no está activa:</p>
         ${details}
         ${button(link, "Reservar otra cita", salon)}`
      ),
      text: `Tu cita ha sido cancelada\n\n${when}\n${a.service.name} con ${a.stylist.user.name}\n\nReserva otra: ${link}${textSignature(salon)}`,
    });
  }

  if (byClient && a.stylist?.user?.email) {
    const link = `${baseUrl(salon)}/agenda`;
    await sendMail({
      to: a.stylist.user.email,
      fromName: salon.name,
      subject: `Cita cancelada por el cliente: ${when}`,
      html: layout(
        salon,
        "Un cliente ha cancelado su cita",
        `<p style="color:#1c1917">${esc(a.client?.name)} ha cancelado:</p>
         ${details}
         <p style="color:#78716c;font-size:13px">El hueco vuelve a estar libre para nuevas reservas.</p>
         ${button(link, "Ver mi agenda", salon)}`
      ),
      text: `${a.client?.name} ha cancelado su cita del ${when} (${a.service.name}).\nAgenda: ${link}${textSignature(salon)}`,
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
       ${whereRow(salon)}
     </table>`;

  if (a.client?.email) {
    const link = `${baseUrl(salon)}/mis-citas`;
    await sendMail({
      to: a.client.email,
      fromName: salon.name,
      subject: `Cita cambiada: ${newWhen} · ${salon.name}`,
      html: layout(
        salon,
        "Tu cita ha cambiado de hora",
        `<p style="color:#1c1917">Hola ${esc(a.client.name)}, estos son los nuevos datos:</p>
         ${details}
         ${policyHtml(salon)}
         ${button(link, "Ver mi cita", salon)}`
      ),
      text: `Tu cita ha cambiado de hora\n\nAntes: ${oldWhen}\nAhora: ${newWhen}\n${a.service.name} con ${a.stylist.user.name}${whereText(salon)}${policyText(salon)}\n\n${link}${textSignature(salon)}`,
    });
  }

  if (byClient && a.stylist?.user?.email) {
    const link = `${baseUrl(salon)}/agenda`;
    await sendMail({
      to: a.stylist.user.email,
      fromName: salon.name,
      subject: `Cita reprogramada por el cliente: ${newWhen}`,
      html: layout(
        salon,
        "Un cliente ha movido su cita",
        `<p style="color:#1c1917">${esc(a.client?.name)} ha cambiado la hora:</p>
         ${details}
         ${button(link, "Ver mi agenda", salon)}`
      ),
      text: `${a.client?.name} ha movido su cita.\nAntes: ${oldWhen}\nAhora: ${newWhen}\nAgenda: ${link}${textSignature(salon)}`,
    });
  }
});

// ---------- Recordatorio ----------
export const sendAppointmentReminder = safe(async (appointmentId, salon) => {
  const a = await loadAppointment(appointmentId);
  if (!a || !a.client?.email || !["pending", "confirmed"].includes(a.status)) return;

  const when = formatWhen(a.start, salon.timezone);
  const link = `${baseUrl(salon)}/mis-citas`;

  await sendMail({
    to: a.client.email,
    fromName: salon.name,
    subject: `Recordatorio: ${when} · ${salon.name}`,
    html: layout(
      salon,
      "Te recordamos tu próxima cita",
      `<p style="color:#1c1917">Hola ${esc(a.client.name)}, no olvides tu cita:</p>
       <table style="width:100%;font-size:14px;color:#1c1917;border-collapse:collapse">
         ${row("Cuándo", `<b>${esc(when)}</b>`)}
         ${row("Servicio", `${esc(a.service.name)} (${a.service.durationMinutes} min)`)}
         ${row("Con", esc(a.stylist.user.name))}
         ${whereRow(salon)}
       </table>
       <p style="color:#78716c;font-size:13px">Si no puedes venir, cancélala o cámbiala para dejar el hueco a otra persona.</p>
       ${policyHtml(salon)}
       ${button(link, "Gestionar mi cita", salon)}`
    ),
    text: `Te recordamos tu próxima cita\n\n${when}\n${a.service.name} con ${a.stylist.user.name}${whereText(salon)}${policyText(salon)}\n\nGestiona tu cita: ${link}${textSignature(salon)}`,
  });
});