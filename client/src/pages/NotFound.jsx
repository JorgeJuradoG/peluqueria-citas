import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="font-display text-7xl text-gold">404</p>
      <h1 className="mt-4 text-3xl font-bold">Página no encontrada</h1>
      <p className="mt-3 text-ink/70">
        La dirección que buscas no existe o ha cambiado de sitio.
      </p>
      <Link to="/" className="btn-primary mt-6">Volver al inicio</Link>
    </div>
  );
}