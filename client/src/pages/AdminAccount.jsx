import { useState } from "react";
import { Download, Loader2, Trash2, TriangleAlert } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useSalon } from "../context/SalonContext";
import { useConfirm, useToast } from "../context/UIContext";
import { ErrorAlert } from "../components/FormField";

export default function AdminAccount() {
  const { logout } = useAuth();
  const salon = useSalon();
  const confirm = useConfirm();
  const toast = useToast();

  const [exporting, setExporting] = useState(false);
  const [slug, setSlug] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [closing, setClosing] = useState(false);

  const slugOk = slug.trim().toLowerCase() === salon.slug;

  async function download() {
    setExporting(true);
    try {
      const { data } = await api.get("/salon-settings/export");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${salon.slug}-datos.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Datos descargados");
    } catch (err) {
      toast.error(err.response?.data?.message || "No se pudieron descargar los datos");
    } finally {
      setExporting(false);
    }
  }

  async function close(e) {
    e.preventDefault();
    if (!slugOk || !password) return;

    const ok = await confirm({
      title: "Cerrar la peluquería",
      message: `Se borrarán ${salon.name}, su equipo, sus clientes y todas sus citas. No se puede deshacer.`,
      confirmText: "Cerrar y borrar todo",
      danger: true,
    });
    if (!ok) return;

    setError("");
    setClosing(true);
    try {
      await api.post("/salon-settings/close", { slug: slug.trim(), password });
      logout();
      // La peluquería ya no existe: volvemos a la web del producto
      window.location.assign("/");
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo cerrar la peluquería");
      setClosing(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-4xl font-bold">Mi negocio</h1>
      <p className="mt-1 text-ink/70">Tus datos y el cierre de {salon.name}.</p>

      <div className="max-w-2xl">
        <section className="card mt-6">
          <h2 className="text-xl font-semibold">Descargar mis datos</h2>
          <p className="mt-1 text-sm text-ink/70">
            Un archivo con tu peluquería, servicios, equipo, clientes y citas. No incluye
            contraseñas.
          </p>
          <button onClick={download} disabled={exporting} className="btn-outline mt-4">
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Download className="h-4 w-4" aria-hidden="true" />
            )}
            Descargar (.json)
          </button>
        </section>

        <section className="card mt-6 border-red-300">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-red-700">
            <TriangleAlert className="h-5 w-5" aria-hidden="true" />
            Cerrar mi peluquería
          </h2>

          {salon.demo ? (
            <p className="mt-2 text-sm text-ink/70">
              La peluquería de demostración no se puede cerrar.
            </p>
          ) : (
            <form onSubmit={close} noValidate className="mt-2">
              <p className="text-sm text-ink/70">
                Se borrarán para siempre la peluquería, su equipo, sus clientes y todas sus citas, y
                tu web dejará de existir. <b className="text-ink">No se puede deshacer.</b> Descarga
                antes tus datos si quieres conservarlos.
              </p>

              <label className="mt-4 block">
                <span className="label">
                  Escribe <b>{salon.slug}</b> para confirmar
                </span>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  autoComplete="off"
                  className="input"
                />
              </label>

              <label className="mt-4 block">
                <span className="label">Tu contraseña</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="input"
                />
              </label>

              {error && <ErrorAlert>{error}</ErrorAlert>}

              <button
                className="btn-danger mt-5 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!slugOk || !password || closing}
              >
                {closing ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                )}
                {closing ? "Cerrando..." : "Cerrar y borrar todo"}
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}