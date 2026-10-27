# Cambios pendientes

Lo que falta para poner la aplicación a la venta, ordenado por prioridad.
Última revisión: 27 de octubre de 2026.

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
- [ ] **Fuentes sin Google.** Las tipografías se cargan desde Google Fonts (`client/index.html` y
  `ensureFont` en `client/src/lib/theme.js`), lo que envía la IP del visitante a Google. En la UE es
  más seguro alojarlas en el propio servidor.

## 2. Importante para producción

- [ ] **Renombrar el repositorio en GitHub** a `ProyectoPeluqueria`, actualizar el remoto local
  (`git remote set-url origin …`) y las URLs del README (insignia y `git clone`).
- [ ] **Dominio propio y correo verificado.** Configurar `MAIL_FROM` con un dominio verificado en Resend
  (SPF/DKIM) para que los correos no lleguen a spam. Hoy el valor por defecto es `no-reply@example.com`.
- [ ] **Restringir CORS.** El servidor acepta peticiones de cualquier origen (`cors()` en
  [`server/src/app.js`](../server/src/app.js)); en producción, limitarlo a `CLIENT_URL`.
- [ ] **Cabeceras de seguridad** (p. ej. `helmet`) en el servidor.
- [ ] **Monitorización de errores.** El `ErrorBoundary` del cliente solo escribe en la consola; conectar
  un servicio como Sentry en el cliente y en el servidor.
- [ ] **Copias de seguridad** automáticas de la base de datos de producción (MongoDB Atlas).
- [ ] **Recordatorios en un servidor siempre activo.** Usan `node-cron` dentro del proceso, así que no
  funcionan en hostings que duermen. Alternativa: un cron externo o un plan sin suspensión.
- [ ] **Cola de reintentos para el correo.** Si un envío falla, hoy no se reintenta.
- [ ] **Reservas simultáneas solapadas.** El índice único evita dos reservas a la misma hora exacta, pero
  no solapamientos parciales simultáneos (p. ej. 10:00 y 10:15 a la vez). Solución: transacción o
  bloqueo por estilista.

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
- [ ] **Datos de ejemplo del seed** (`example.com` en `server/src/scripts/seed.js`): cambiar por datos
  de demostración creíbles para la demo pública.
