import { sendMail } from "./mailer.js";
import { esc, layout, button, baseUrl, textSignature } from "./appointmentMails.js";

// Devuelven true/false según se haya enviado; nunca lanzan
export async function sendPasswordReset(user, salon, rawToken) {
  try {
    const link = `${baseUrl(salon)}/restablecer?token=${rawToken}`;
    return await sendMail({
      to: user.email,
      fromName: salon.name,
      subject: `Restablece tu contraseña · ${salon.name}`,
      html: layout(
        salon,
        "Restablece tu contraseña",
        `<p style="color:#1c1917">Hola ${esc(user.name)}, hemos recibido una solicitud para cambiar tu contraseña.</p>
         ${button(link, "Elegir una contraseña nueva", salon)}
         <p style="color:#78716c;font-size:13px;margin-top:20px">El enlace caduca en 1 hora y solo se puede usar una vez. Si no lo has pedido tú, ignora este correo: tu contraseña no cambiará.</p>`
      ),
      text: `Hola ${user.name}, para elegir una contraseña nueva entra aquí (caduca en 1 hora):\n${link}\n\nSi no lo has pedido tú, ignora este correo.${textSignature(salon)}`,
    });
  } catch (err) {
    console.error("[mail]", err.message);
    return false;
  }
}

export async function sendStylistInvitation(user, salon, rawToken) {
  try {
    const link = `${baseUrl(salon)}/restablecer?token=${rawToken}`;
    // Término elegido por la peluquería (solo valores de una lista cerrada)
    const term = salon.staffTerm || "estilista";
    return await sendMail({
      to: user.email,
      fromName: salon.name,
      subject: `Te han invitado al equipo de ${salon.name}`,
      html: layout(
        salon,
        "Te damos la bienvenida al equipo",
        `<p style="color:#1c1917">Hola ${esc(user.name)}, ya tienes una cuenta de ${esc(term)} en ${esc(salon.name)}. Elige tu contraseña para empezar a ver tu agenda:</p>
         ${button(link, "Activar mi cuenta", salon)}
         <p style="color:#78716c;font-size:13px;margin-top:20px">Tu usuario es ${esc(user.email)}. El enlace caduca en 7 días y solo se puede usar una vez.</p>`
      ),
      text: `Hola ${user.name}, ya tienes cuenta de ${term} en ${salon.name}.\nElige tu contraseña aquí (caduca en 7 días):\n${link}\n\nTu usuario es ${user.email}.${textSignature(salon)}`,
    });
  } catch (err) {
    console.error("[mail]", err.message);
    return false;
  }
}

// Al crear una peluquería: el dueño confirma que el correo es suyo
export async function sendEmailVerification(user, salon, rawToken) {
  try {
    const link = `${baseUrl(salon)}/confirmar-correo?token=${rawToken}`;
    return await sendMail({
      to: user.email,
      fromName: salon.name,
      subject: `Confirma tu correo · ${salon.name}`,
      html: layout(
        salon,
        "Confirma tu correo",
        `<p style="color:#1c1917">Hola ${esc(user.name)}, tu peluquería <b>${esc(salon.name)}</b> ya está creada. Confirma que este correo es tuyo para completar el alta:</p>
         ${button(link, "Confirmar mi correo", salon)}
         <p style="color:#78716c;font-size:13px;margin-top:20px">El enlace caduca en 48 horas y solo se puede usar una vez. Si no has creado tú esta peluquería, ignora este correo.</p>`
      ),
      text: `Hola ${user.name}, tu peluquería ${salon.name} ya está creada.\nConfirma tu correo aquí (caduca en 48 horas):\n${link}\n\nSi no la has creado tú, ignora este correo.${textSignature(salon)}`,
    });
  } catch (err) {
    console.error("[mail]", err.message);
    return false;
  }
}