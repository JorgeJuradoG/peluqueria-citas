import useModal from "../hooks/useModal";

// layer: z-40 para modales normales, z-50 para la confirmación (va encima de todo)
export default function Modal({ onClose, labelledBy, layer = "z-40", size = "max-w-md", children }) {
  const ref = useModal(onClose);

  return (
    <div
      className={`fixed inset-0 ${layer} flex animate-fade-in items-center justify-center bg-black/50 p-4 backdrop-blur-sm`}
      onClick={onClose}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={`card max-h-[90vh] w-full ${size} animate-pop overflow-y-auto outline-none`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}