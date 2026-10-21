import { Component } from "react";

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
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