import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const UIContext = createContext(null);

const TOAST_STYLES = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  error: "border-red-200 bg-red-50 text-red-800",
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

  // Escape cierra el modal como "cancelar"
  useEffect(() => {
    if (!dialog) return;
    function onKey(e) {
      if (e.key === "Escape") {
        dialog.resolve(false);
        setDialog(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dialog]);

  return (
    <UIContext.Provider value={{ toast, confirm }}>
      {children}

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm shadow-md ${TOAST_STYLES[t.type]}`}
          >
            <span>{t.message}</span>
            <button onClick={() => dismiss(t.id)} aria-label="Cerrar" className="opacity-60 hover:opacity-100">
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Modal de confirmación */}
      {dialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4"
          onClick={() => closeDialog(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="card w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold">{dialog.title || "¿Estás seguro?"}</h2>
            {dialog.message && <p className="mt-2 text-ink/70">{dialog.message}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => closeDialog(false)} className="btn-outline">
                Volver
              </button>
              <button
                autoFocus
                onClick={() => closeDialog(true)}
                className={dialog.danger ? "btn-danger" : "btn-primary"}
              >
                {dialog.confirmText || "Aceptar"}
              </button>
            </div>
          </div>
        </div>
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