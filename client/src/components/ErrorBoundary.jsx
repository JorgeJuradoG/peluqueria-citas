import { Component } from "react";

// Tras publicar una versión nueva, una pestaña abierta puede pedir trozos de código que ya no
// existen. En ese caso se recarga una vez para coger la versión nueva, sin mostrar el error.
const CHUNK_ERROR = /dynamically imported module|Importing a module script failed|Loading chunk/i;
const RELOAD_KEY = "chunk-reload-at";

function reloadForNewVersion(error) {
  if (!CHUNK_ERROR.test(String(error?.message))) return false;
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY)) || 0;
    if (Date.now() - last < 10000) return false; // ya se intentó hace poco: no entrar en bucle
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    if (reloadForNewVersion(error)) return;
    // Aquí iría un servicio de monitorización (Sentry, etc.)
    console.error("Error de renderizado:", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="font-display text-6xl text-gold">Ups</p>
        <h1 className="mt-4 text-3xl font-bold">Algo no ha salido bien</h1>
        <p className="mt-3 text-ink/70">
          Ha ocurrido un error inesperado. Puedes recargar la página o volver al inicio.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={() => window.location.reload()} className="btn-primary">
            Recargar
          </button>
          <a href={window.location.pathname.split("/").slice(0, 3).join("/") || "/"} className="btn-outline">
            Ir al inicio
          </a>
        </div>
      </div>
    );
  }
}