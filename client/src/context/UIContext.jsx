import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { CircleAlert, CircleCheck, TriangleAlert, X } from "lucide-react";
import Modal from "../components/Modal";

const UIContext = createContext(null);

const TOAST_STYLES = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  error: "border-red-200 bg-red-50 text-red-800",
};

const TOAST_ICONS = {
  success: <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />,
  error: <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />,
};

export function UIProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const notify = useCallback(
    (message, type) => {
      const id = ++idRef.current;
      setToasts((t) => [...t, { id, message, type }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss]
  );

  const toast = useMemo(
    () => ({
      success: (message) => notify(message, "success"),
      error: (message) => notify(message, "error"),
    }),
    [notify]
  );

  // confirm() devuelve una promesa: true si acepta, false si cancela
  const confirm = useCallback(
    (options) => new Promise((resolve) => setDialog({ ...options, resolve })),
    []
  );

  function closeDialog(result) {
    dialog.resolve(result);
    setDialog(null);
  }

  return (
    <UIContext.Provider value={{ toast, confirm }}>
      {children}

      {/* Toasts */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex animate-slide-in items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg ${TOAST_STYLES[t.type]}`}
          >
            {TOAST_ICONS[t.type]}
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Cerrar aviso"
              className="rounded p-0.5 opacity-60 transition hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Modal de confirmación */}
      {dialog && (
        <Modal onClose={() => closeDialog(false)} labelledBy="dialog-title" layer="z-50">
          <div className="flex items-start gap-4">
            {dialog.danger && (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                <TriangleAlert className="h-5 w-5" aria-hidden="true" />
              </span>
            )}
            <div>
              <h2 id="dialog-title" className="text-2xl font-bold">
                {dialog.title || "¿Estás seguro?"}
              </h2>
              {dialog.message && <p className="mt-2 text-ink/70">{dialog.message}</p>}
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => closeDialog(false)} className="btn-outline">
              Volver
            </button>
            <button
              data-autofocus
              onClick={() => closeDialog(true)}
              className={dialog.danger ? "btn-danger" : "btn-primary"}
            >
              {dialog.confirmText || "Aceptar"}
            </button>
          </div>
        </Modal>
      )}
    </UIContext.Provider>
  );
}

export function useToast() {
  return useContext(UIContext).toast;
}

export function useConfirm() {
  return useContext(UIContext).confirm;
}