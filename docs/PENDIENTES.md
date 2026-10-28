# Cambios pendientes

Lo que falta para poner la aplicación a la venta, ordenado por prioridad.
Última revisión: 28 de octubre de 2026.

## 1. Imprescindible antes de vender

Sin esto no se puede cobrar ni abrir la aplicación a clientes reales.

- [ ] **Nombre del producto.** «Citas» es demasiado genérico para registrar la marca o conseguir dominio.
  Se cambia en un solo sitio: `PRODUCT_NAME` en [`client/src/lib/brand.js`](../client/src/lib/brand.js).
- [ ] **Correo de contacto real.** El pie de la portada muestra `hola@tudominio.com`
  (`CONTACT_EMAIL` en `brand.js`).
- [ ] **Precios y límites de los planes.** Los de `PLANS` en `brand.js` son una propuesta
  (0 / 19 / 39 € al mes; 1, 5 e ilimitados profesionales) y «Sin permanencia» aparece en los planes de pago.
  Hay que decidirlos y confirmar la política.
- [ ] **Cobros.** La aplicación no cobra todavía: hace falta integrar una pasarela (p. ej. Stripe Billing)
  con alta, cambio de plan, facturas y baja. Hasta entonces la portada muestra la oferta de lanzamiento
  (`LAUNCH_FREE = true`); al activar los cobros, ponerlo a `false`.
- [ ] **Aplicar los límites de cada plan en el servidor.** Hoy cualquier peluquería puede tener
  profesionales ilimitados. El límite tiene que comprobarse en el backend al invitar o activar estilistas,
  no solo mostrarse en la portada.
- [ ] **Textos legales.** Política de privacidad y Términos de uso son un borrador con apartados
  `[COMPLETAR]` en [`client/src/pages/Legal.jsx`](../client/src/pages/Legal.jsx). Necesitan revisión
  legal: datos de la empresa, contrato de encargo de tratamiento (la plataforma trata datos de los
  clientes de cada peluquería), proveedores, plazos de conservación y condiciones de pago.
- [x] **Fuentes sin Google.** Las tipografías van dentro de la web (paquetes `@fontsource`): la base en
  `client/src/main.jsx` y las de cada peluquería bajo demanda en `ensureFont` (`client/src/lib/theme.js`).

## 2. Importante para producción

- [ ] **Renombrar el repositorio en GitHub** a `ProyectoPeluqueria`, actualizar el remoto local
  (`git remote set-url origin …`) y las URLs del README (insignia y `git clone`).
- [ ] **Dominio propio y correo verificado.** Configurar `MAIL_FROM` con un dominio verificado en Resend
  (SPF/DKIM) para que los correos no lleguen a spam. Hoy el valor por defecto es `no-reply@example.com`.
- [x] **Restringir CORS.** La API y el tiempo real solo aceptan los orígenes de `CLIENT_URL`
  (admite varios separados por comas, p. ej. con y sin `www`) — `server/src/utils/origins.js`.
  **Al desplegar:** `CLIENT_URL` tiene que ser exactamente la dirección pública de la web.
- [x] **Cabeceras de seguridad** con `helmet` y una política de contenido estricta (sin scripts
  incrustados ni recursos externos) en [`server/src/app.js`](../server/src/app.js). La web tiene que
  servirse por HTTPS.
- [ ] **Monitorización de errores.** El `ErrorBoundary` del cliente solo escribe en la consola; conectar
  un servicio como Sentry en el cliente y en el servidor.
- [ ] **Copias de seguridad** automáticas de la base de datos de producción (MongoDB Atlas).
- [ ] **Recordatorios en un servidor siempre activo.** Usan `node-cron` dentro del proceso, así que no
  funcionan en hostings que duermen. Alternativa: un cron externo o un plan sin suspensión.
- [x] **Reintentos del correo.** Los fallos pasajeros (red, 429, 5xx) se reintentan dos veces con espera
  creciente (`withRetries` en `server/src/services/mailer.js`). Si el servidor se reinicia a mitad, ese
  correo se pierde: para garantizar la entrega haría falta una cola persistente.
- [x] **Reservas simultáneas solapadas.** Tras guardar se vuelve a comprobar el solape y, si dos reservas
  se cruzan, se retira al menos una (`findConflict` en `server/src/controllers/appointmentController.js`).
- [ ] **Caso extremo al reprogramar:** si otra persona reservase la hora antigua en el instante exacto en
  que una reprogramación choca y se deshace, la cita no podría volver a su hora. Es muy improbable;
  la solución completa sería una transacción (MongoDB Atlas las admite).
- [ ] **`trust proxy`.** Si el servidor va detrás de un proxy (Render, Railway…), activar
  `app.set("trust proxy", 1)` para que el límite de peticiones vea la IP real del visitante.

## 3. Producto

- [ ] **Capturas reales en el README** (portada, reserva, agenda, panel, modo oscuro y móvil) y una
  imagen para compartir el enlace (`og:image` en `client/index.html`).
- [ ] **Testimonios y cifras** en la portada cuando haya clientes reales (no antes: serían inventados).
- [ ] Lista de espera.
- [ ] Valoraciones de clientes.
- [ ] Recordatorios por WhatsApp o SMS además del correo.
- [ ] Cobro de señal o pago por adelantado para reducir ausencias.
- [ ] Dominio propio para cada peluquería.

## 4. Calidad y mantenimiento

- [ ] **Tests del frontend.** El servidor tiene 199 tests; el cliente no tiene ninguno. Como mínimo,
  tests de componentes del flujo de reserva y del panel, y algún test de extremo a extremo.
- [ ] **Avisos de lint del cliente** (33, ninguno es error): sobre todo `setState` dentro de efectos y
  dependencias de `useEffect`.
- [ ] **Revisión de accesibilidad** con un lector de pantalla y navegación solo con teclado.
- [ ] **`.claude/launch.json`** está subido al repositorio (commit `0651243`); solo sirve en local.
  Valorar quitarlo y añadir `.claude/` al `.gitignore`.
- [x] **Datos de ejemplo del seed:** quitada la web `example.com` de la peluquería de ejemplo.
