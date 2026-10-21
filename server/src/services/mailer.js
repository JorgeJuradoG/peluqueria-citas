import nodemailer from "nodemailer";

let transporterPromise;

async function getTransporter() {
  if (!transporterPromise) {
    transporterPromise = (async () => {
      if (process.env.SMTP_HOST) {
        const port = Number(process.env.SMTP_PORT) || 587;
        return nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port,
          secure: port === 465,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });
      }
      // Sin SMTP configurado: buzón de pruebas Ethereal
      const account = await nodemailer.createTestAccount();
      console.log("[mail] Usando Ethereal (los correos no se entregan, solo se previsualizan)");
      return nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: { user: account.user, pass: account.pass },
      });
    })();
  }
  return transporterPromise;
}

// Nunca lanza: un fallo de correo no debe romper una reserva
export async function sendMail({ to, subject, html, text }) {
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
    console.log(`[mail] Enviado a ${to}: ${subject}${preview ? `\n[mail] Vista previa: ${preview}` : ""}`);
    return true;
  } catch (err) {
    console.error("[mail] Error al enviar:", err.message);
    return false;
  }
}