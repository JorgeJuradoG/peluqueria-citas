export const PRODUCT_NAME = "Bruki"; // cámbialo cuando elijas el nombre definitivo
export const CONTACT_EMAIL = "hola@tudominio.com"; // pon un correo real
export const DEMO_SLUG = "demo"; // la peluquería que crea el seed

export const NAV = [
  { href: "/#producto", label: "Producto" },
  { href: "/#funciones", label: "Funciones" },
  { href: "/#como-funciona", label: "Cómo funciona", secondary: true },
  { href: "/#marca", label: "Tu marca", secondary: true },
  { href: "/#precios", label: "Precios" },
  { href: "/#preguntas", label: "Preguntas" },
];

// Precios y límites PROPUESTOS: revísalos antes de publicar. Todavía no hay cobros
// ni se aplican límites, por eso la página avisa de que en el lanzamiento todo es gratis.
// monthly = precio pagando mes a mes; yearly = precio al mes pagando un año.
export const LAUNCH_FREE = true;

export const PLANS = [
  {
    key: "solo",
    name: "Inicio",
    text: "Para quien trabaja solo y quiere dejar de apuntar citas a mano.",
    monthly: 0,
    yearly: 0,
    features: [
      "1 profesional",
      "Reservas online ilimitadas",
      "Tu web con tu propia imagen",
      "Correos de confirmación y recordatorio",
    ],
  },
  {
    key: "pro",
    name: "Profesional",
    text: "Para salones con un equipo pequeño que quiere crecer.",
    monthly: 19,
    yearly: 15,
    highlight: true,
    features: [
      "Hasta 5 profesionales",
      "Todo lo del plan Inicio",
      "Agenda en tiempo real para cada profesional",
      "Estadísticas de citas e ingresos",
      "Política de cancelación configurable",
    ],
  },
  {
    key: "salon",
    name: "Salón",
    text: "Para negocios con varios equipos y mucho movimiento.",
    monthly: 39,
    yearly: 31,
    features: [
      "Profesionales ilimitados",
      "Todo lo del plan Profesional",
      "Horarios partidos y días libres por profesional",
      "Exportación de todos tus datos",
    ],
  },
];

// Incluido en todos los planes
export const PLAN_BASICS = [
  "Sin instalar nada: funciona en el navegador",
  "Modo claro y oscuro",
  "Datos separados de otros negocios",
  "Cambios y cancelaciones por el propio cliente",
];

// Lo que cambia al dejar la libreta y el teléfono
export const BEFORE_AFTER = {
  before: [
    "Llamadas y mensajes en mitad de un corte",
    "Citas apuntadas en una libreta que solo está en el local",
    "Clientes que se olvidan y huecos que se quedan vacíos",
    "Cambios de última hora a base de mensajes",
  ],
  after: [
    "Tus clientes reservan solos, a cualquier hora",
    "La agenda de todo el equipo, al día y en el móvil",
    "Recordatorio automático el día anterior",
    "Si alguien cancela, el hueco se libera al instante",
  ],
};

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
  {
    q: "¿Puedo llevarme mis datos si me voy?",
    a: "Sí. Desde el panel de administración puedes exportar en cualquier momento tus clientes, tu equipo, tus servicios y tus citas.",
  },
];
