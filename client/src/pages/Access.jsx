import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import api from "../services/api";
import PlatformLayout from "../components/platform/PlatformLayout";
import { ErrorAlert } from "../components/FormField";
import { PRODUCT_NAME } from "../lib/brand";

// Entrada para quien ya tiene peluquería: cada negocio vive en /s/<dirección>
export default function Access() {
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    document.title = `Entrar · ${PRODUCT_NAME}`;
  }, []);

  async function goToSalon(e) {
    e.preventDefault();
    setError("");
    if (slug.length < 3) return setError("La dirección tiene al menos 3 caracteres");

    setChecking(true);
    try {
      await api.get(`/salons/${slug}`);
      window.location.href = `/s/${slug}/login`;
    } catch (err) {
      setError(
        err.response?.status === 404
          ? "No existe ninguna peluquería con esa dirección"
          : "No se pudo conectar con el servidor"
      );
      setChecking(false);
    }
  }

  return (
    <PlatformLayout>
      <section className="px-4 py-20">
        <div className="mx-auto max-w-md">
          <h1 className="text-center text-4xl sm:text-5xl">Entra en tu peluquería</h1>
          <p className="mt-3 text-center text-ink/70">
            Escribe la dirección de tu peluquería para ir a su página de acceso.
          </p>

          <form onSubmit={goToSalon} className="card mt-8" noValidate>
            <label htmlFor="slug" className="label">
              Dirección de la peluquería
            </label>
            <div className="flex items-center rounded-xl border border-ink/10 bg-surface pl-4 transition focus-within:border-ink/40 focus-within:ring-4 focus-within:ring-ink/5">
              <span className="shrink-0 text-[15px] text-ink/50">/s/</span>
              <input
                id="slug"
                className="w-full min-w-0 bg-transparent px-1 py-2.5 text-[15px] outline-none placeholder:text-ink/40"
                placeholder="peluqueria-lola"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                autoComplete="off"
                autoFocus
              />
            </div>
            {error && (
              <div className="mt-3">
                <ErrorAlert>{error}</ErrorAlert>
              </div>
            )}
            <button className="btn-primary mt-5 w-full py-3" disabled={checking}>
              {checking ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              )}
              Continuar
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink/70">
            ¿Aún no tienes peluquería?{" "}
            <Link to="/crear-peluqueria" className="font-medium text-ink underline-offset-4 hover:underline">
              Créala gratis →
            </Link>
          </p>
        </div>
      </section>
    </PlatformLayout>
  );
}
