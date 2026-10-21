import { useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input:not([disabled]), select, [tabindex]:not([tabindex="-1"])';

// Pila de modales abiertos: solo el de arriba reacciona a Esc y Tab
const stack = [];
let locks = 0;

export default function useModal(onClose) {
  const ref = useRef(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const node = ref.current;
    const token = {};
    const previous = document.activeElement; // para devolver el foco al cerrar
    stack.push(token);

    if (locks++ === 0) document.body.style.overflow = "hidden";

    // Foco inicial: el elemento con autoFocus o, si no, el primero enfocable
    if (node && !node.contains(document.activeElement)) {
      (node.querySelector("[data-autofocus]") || node.querySelector(FOCUSABLE) || node).focus();
    }

    function onKey(e) {
      if (stack[stack.length - 1] !== token) return;

      if (e.key === "Escape") {
        onCloseRef.current?.();
        return;
      }
      if (e.key !== "Tab" || !node) return;

      const items = [...node.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (items.length === 0) return e.preventDefault();

      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === node)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      stack.splice(stack.indexOf(token), 1);
      if (--locks === 0) document.body.style.overflow = "";
      previous?.focus?.();
    };
  }, []);

  return ref;
}