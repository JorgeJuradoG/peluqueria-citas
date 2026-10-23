import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import PlatformLayout from "../components/platform/PlatformLayout";
import { PRODUCT_NAME } from "../lib/brand";

const DOCS = {
  privacidad: {
    title: "Política de privacidad",
    sections: [
      ["Quién es el responsable", "[COMPLETAR: nombre o razón social, NIF, dirección y email de contacto]."],
      ["Papeles de cada parte", "[COMPLETAR: cada peluquería es responsable del tratamiento de los datos de sus clientes y la plataforma actúa como encargada. Describe el contrato de encargo de tratamiento]."],
      ["Qué datos se tratan", "[COMPLETAR: nombre, email, teléfono, citas, y los datos de las cuentas de administradores y estilistas]."],
      ["Para qué y con qué base legal", "[COMPLETAR: gestión de las reservas, envío de correos de confirmación, cambio y recordatorio, seguridad de las cuentas]."],
      ["Proveedores que intervienen", "[COMPLETAR: alojamiento de la web, base de datos, servicio de envío de correo y dónde se encuentran sus servidores]."],
      ["Cuánto tiempo se conservan", "[COMPLETAR: plazos]."],
      ["Derechos de las personas", "[COMPLETAR: acceso, rectificación, supresión, oposición, limitación y portabilidad, y cómo ejercerlos]."],
      ["Cookies y almacenamiento local", "[COMPLETAR: la web guarda la sesión y la preferencia de tema en el navegador; indica si se usa analítica]."],
    ],
  },
  terminos: {
    title: "Términos de uso",
    sections: [
      ["Quiénes somos y qué ofrecemos", "[COMPLETAR: descripción del servicio y datos de la empresa]."],
      ["Cuentas y responsabilidad", "[COMPLETAR: veracidad de los datos, custodia de la contraseña, uso por parte del equipo]."],
      ["Uso aceptable", "[COMPLETAR: usos prohibidos]."],
      ["Planes y pagos", "[COMPLETAR: condiciones del plan gratuito y de los planes de pago cuando existan]."],
      ["Disponibilidad y límites de responsabilidad", "[COMPLETAR]."],
      ["Baja y eliminación de datos", "[COMPLETAR: cómo se da de baja una peluquería y qué ocurre con sus datos]."],
      ["Cambios en estos términos", "[COMPLETAR]."],
      ["Ley aplicable y contacto", "[COMPLETAR]."],
    ],
  },
};

export default function Legal({ kind }) {
  const doc = DOCS[kind];

  useEffect(() => {
    document.title = `${doc.title} · ${PRODUCT_NAME}`;
  }, [doc]);

  return (
    <PlatformLayout>
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-4xl font-bold">{doc.title}</h1>

        <p className="mt-6 flex items-start gap-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          Borrador pendiente de revisión legal. Sustituye cada apartado por el texto definitivo y
          elimina este aviso antes de publicar.
        </p>

        <div className="mt-8 space-y-8">
          {doc.sections.map(([heading, text]) => (
            <section key={heading}>
              <h2 className="text-2xl font-semibold">{heading}</h2>
              <p className="mt-2 text-ink/70">{text}</p>
            </section>
          ))}
        </div>
      </div>
    </PlatformLayout>
  );
}