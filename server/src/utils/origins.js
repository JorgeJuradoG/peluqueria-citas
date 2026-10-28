// Orígenes desde los que se acepta la web: CLIENT_URL (admite varios separados por comas,
// p. ej. "https://midominio.com,https://www.midominio.com"). Siempre es una lista: así solo
// se responde con permiso al origen que coincide, no a cualquiera
export function allowedOrigins() {
  return (process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")
    .map((url) => url.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

// Dirección pública de la web para los enlaces de los correos: la primera de la lista
export function publicUrl() {
  return allowedOrigins()[0];
}
