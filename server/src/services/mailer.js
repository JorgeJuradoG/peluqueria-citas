import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import nodemailer from "nodemailer";

let transporterPromise;
let consoleModeUntil = 0;

// En test (y en modo consola) los correos quedan aquí para poder leerlos
export const outbox = [];

const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("tiempo de espera agotado")), ms)
    ),
  ]);

async function createTransporter() {
  if (process.env.SMTP_HOST) {
    const port = Number(process.env.SMTP_PORT) || 587;
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  // Sin SMTP configurado: buzón de pruebas Ethereal (si responde en 6 s)
  const account = await withTimeout(nodemailer.createTestAccount(), 6000);
  console.log("[mail] Usando Ethereal (los correos no se entregan, solo se previsualizan)");
  return nodemailer.createTransport({
    host: account.smtp.host,
    port: account.smtp.port,
    secure: account.smtp.secure,
    auth: { user: account.user, pass: account.pass },
  });
}

async function getTransporter() {
  if (!transporterPromise) {
    // Si falla, no se guarda el fallo: el siguiente envío vuelve a intentarlo
    transporterPromise = createTransporter().catch((err) => {
      transporterPromise = undefined;
      throw err;
    });
  }
  return transporterPromise;
}

// Remitente con el nombre de la peluquería, sobre la dirección configurada en MAIL_FROM
function buildFrom(fromName) {
  const configured = process.env.MAIL_FROM || "Reservas <no-reply@example.com>";
  if (!fromName) return configured;
  const address = configured.match(/<([^>]+)>/)?.[1] ?? configured;
  const name = String(fromName).replace(/[\r\n"<>]/g, "").trim();
  return name ? `"${name}" <${address}>` : configured;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Reintenta un envío ante fallos pasajeros (red, servidor saturado), con esperas crecientes.
// Un error definitivo (dirección inválida, clave incorrecta) no se reintenta
export async function withRetries(send, { delays = [2000, 8000], isTransient = () => true } = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await send();
    } catch (err) {
      if (attempt >= delays.length || !isTransient(err)) throw err;
      console.warn(`[mail] Fallo al enviar (${err.message}). Reintento en ${delays[attempt] / 1000} s`);
      await sleep(delays[attempt]);
    }
  }
}

// Sin código de estado (corte de red, tiempo agotado), 429 o 5xx: merece la pena reintentar
const isTransientResend = (err) => !err.status || err.status === 429 || err.status >= 500;

// Envío por API HTTPS (Resend). Sirve donde el hosting bloquea los puertos SMTP
async function sendWithResend({ to, subject, html, text, fromName }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: buildFrom(fromName), to: [to], subject, html, text }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      const err = new Error(`Resend respondió ${res.status}: ${body.slice(0, 200)}`);
      err.status = res.status;
      throw err;
    }
    return true;
  } finally {
    clearTimeout(timer);
  }
}

// Guarda el HTML para poder abrirlo en el navegador
function saveHtmlPreview({ subject, html }) {
  try {
    const dir = path.resolve("mail-preview");
    fs.mkdirSync(dir, { recursive: true });
    const slug = String(subject).replace(/[^a-z0-9]+/gi, "-").slice(0, 40);
    const file = path.join(dir, `${Date.now()}-${slug}.html`);
    fs.writeFileSync(file, html ?? "", "utf8");
    return pathToFileURL(file).href;
  } catch {
    return null;
  }
}

function printToConsole({ to, subject, text, fromName }, previewUrl) {
  const line = "─".repeat(60);
  console.log(
    `\n${line}\n[mail · modo consola]\n` +
      (fromName ? `De:     ${fromName}\n` : "") +
      `Para:   ${to}\nAsunto: ${subject}\n\n${text}\n` +
      (previewUrl ? `\nVista previa HTML: ${previewUrl}\n` : "") +
      `${line}\n`
  );
}

// Nunca lanza: un fallo de correo no debe romper una reserva
export async function sendMail({ to, subject, html, text, fromName }) {
  if (process.env.NODE_ENV === "test") {
    outbox.push({ to, subject, html, text, fromName });
    return true;
  }

  // Con clave de API, el envío es real: un fallo es un fallo, no se disimula
  if (process.env.RESEND_API_KEY && process.env.MAIL_MODE !== "console") {
    try {
      await withRetries(() => sendWithResend({ to, subject, html, text, fromName }), {
        isTransient: isTransientResend,
      });
      console.log(`[mail] Enviado a ${to}: ${subject}`);
      return true;
    } catch (err) {
      console.error("[mail] Error al enviar:", err.message);
      return false;
    }
  }

  const hasSmtp = Boolean(process.env.SMTP_HOST);
  const forceConsole = process.env.MAIL_MODE === "console";
  const skipEthereal = forceConsole || Date.now() < consoleModeUntil;

  if (hasSmtp || !skipEthereal) {
    try {
      const transporter = await getTransporter();
      const message = { from: buildFrom(fromName), to, subject, html, text };
      // Con SMTP real se reintenta; con Ethereal (pruebas) no merece la pena esperar
      const info = hasSmtp
        ? await withRetries(() => transporter.sendMail(message))
        : await transporter.sendMail(message);
      const preview = nodemailer.getTestMessageUrl(info);
      console.log(
        `[mail] Enviado a ${to}: ${subject}${preview ? `\n[mail] Vista previa: ${preview}` : ""}`
      );
      return true;
    } catch (err) {
      console.error("[mail] Error al enviar:", err.message);
      // Con SMTP real, un fallo es un fallo: no se disimula
      if (hasSmtp) return false;
      // Sin SMTP: durante un minuto no se vuelve a intentar Ethereal
      consoleModeUntil = Date.now() + 60_000;
      console.warn("[mail] Ethereal no está disponible: los correos se mostrarán aquí, en la consola.");
    }
  }

  // Modo consola: el correo se imprime (con sus enlaces) y se guarda su HTML
  outbox.push({ to, subject, html, text, fromName });
  if (outbox.length > 50) outbox.shift();
  printToConsole({ to, subject, text, fromName }, saveHtmlPreview({ subject, html }));
  return true;
}