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

function printToConsole({ to, subject, text }) {
  const line = "─".repeat(60);
  console.log(`\n${line}\n[mail · modo consola]\nPara:   ${to}\nAsunto: ${subject}\n\n${text}\n${line}\n`);
}

// Nunca lanza: un fallo de correo no debe romper una reserva
export async function sendMail({ to, subject, html, text }) {
  if (process.env.NODE_ENV === "test") {
    outbox.push({ to, subject, html, text });
    return true;
  }

  const hasSmtp = Boolean(process.env.SMTP_HOST);
  const forceConsole = process.env.MAIL_MODE === "console";
  const skipEthereal = forceConsole || Date.now() < consoleModeUntil;

  if (hasSmtp || !skipEthereal) {
    try {
      const transporter = await getTransporter();
      const info = await transporter.sendMail({
        from: process.env.MAIL_FROM || "Reservas <no-reply@example.com>",
        to,
        subject,
        html,
        text,
      });
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

  // Modo consola: el correo se imprime (con sus enlaces) en lugar de enviarse
  outbox.push({ to, subject, html, text });
  if (outbox.length > 50) outbox.shift();
  printToConsole({ to, subject, text });
  return true;
}