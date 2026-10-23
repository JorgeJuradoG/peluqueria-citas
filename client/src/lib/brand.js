export const PRODUCT_NAME = "Citas"; // cámbialo cuando elijas el nombre definitivo
export const CONTACT_EMAIL = "hola@tudominio.com"; // pon un correo real
export const DEMO_SLUG = "demo"; // la peluquería que crea el seed

export const NAV = [
  { href: "/#funciones", label: "Funciones" },
  { href: "/#como-funciona", label: "Cómo funciona" },
  { href: "/#marca", label: "Tu marca" },
  { href: "/#precios", label: "Precios" },
  { href: "/#preguntas", label: "Preguntas" },
];

// Los precios y límites son un EJEMPLO: decide los tuyos antes de publicar.
// Mientras no haya cobros, los planes de pago se marcan como "soon".
export const PLANS = [
  {
    key: "start",
    name: "Inicio",
    price: "0 €",
    period: "al mes",
    text: "Todo lo necesario para llevar tu agenda online.",
    features: [
      "Reservas en tiempo real",
      "Estilistas, servicios y horarios",
      "Agenda semanal para cada estilista",
      "Correos de confirmación y recordatorio",
      "Tu web con tu propia imagen",
    ],
    cta: "Crear mi peluquería",
    to: "/crear-peluqueria",
    highlight: true,
  },
  {
    key: "grow",
    name: "Crece",
    price: "—",
    period: "",
    text: "Para negocios que quieren ir más allá.",
    features: [
      "Todo lo del plan Inicio",
      "Estadísticas de citas e ingresos",
      "Lista de espera",
      "Dominio propio",
    ],
    soon: true,
  },
];

export const FAQ = [
  {
    q: "¿Mis clientes tienen que instalar algo?",
    a: "No. Reservan desde el navegador del móvil o del ordenador. Solo necesitan registrarse con su email la primera vez.",
  },
  {
    q: "¿Puedo adaptarla a la imagen de mi peluquería?",
    a: "Sí. Eliges color, tipografía, estilo de esquinas, icono y estilo de portada, y añades tu eslogan, tu horario, tu dirección y tus redes. Tu web se ve en tu estilo, no en el nuestro.",
  },
  {
    q: "¿Qué pasa si dos personas reservan el mismo hueco a la vez?",
    a: "Solo una de las reservas se confirma. A la otra se le avisa de que el hueco ya no está libre y ve los demás disponibles.",
  },
  {
    q: "¿Cómo se enteran mis clientes de su cita?",
    a: "Reciben un correo al reservar, otro si la cita cambia o se cancela, y un recordatorio el día anterior. Además pueden añadirla a su calendario con un botón.",
  },
  {
    q: "¿Mis datos se mezclan con los de otras peluquerías?",
    a: "No. Cada peluquería tiene sus propios clientes, equipo, servicios y citas, completamente separados de los demás.",
  },
  {
    q: "¿Puedo trabajar con varios estilistas y horarios partidos?",
    a: "Sí. Cada estilista tiene sus servicios, su horario semanal (con tantas franjas como necesite) y sus días libres. Los invitas por correo y cada uno ve su propia agenda.",
  },
  {
    q: "¿Y si mi cliente quiere cambiar o cancelar la cita?",
    a: "Lo hace él mismo desde «Mis citas». El hueco queda libre al instante y tanto el cliente como el estilista reciben el aviso por correo.",
  },
  
];
