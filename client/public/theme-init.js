// Aplica el tema antes de pintar para que no parpadee. Va en un archivo aparte (no dentro
// del HTML) para que la política de seguridad pueda prohibir los scripts incrustados.
try {
  var t = localStorage.getItem("theme") || "system";
  var dark = t === "dark" || (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  if (dark) document.documentElement.classList.add("dark");
} catch {
  // Sin acceso al almacenamiento (modo privado estricto): se queda el tema claro
}
