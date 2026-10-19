import { useEffect, useRef } from "react";

// Mantiene el foco dentro de la ventana y lo devuelve al control que la abrió.
export default function Modal({ children, onClose }) {
  const container = useRef(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const controls = () => [
      ...container.current.querySelectorAll(
        "button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href]",
      ),
    ];
    controls()[0]?.focus();
    function keydown(e) {
      if (e.key === "Escape") close.current();
      if (e.key !== "Tab") return;
      const elements = controls();
      const first = elements[0];
      const last = elements.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      }
      if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
    document.addEventListener("keydown", keydown);
    return () => {
      document.removeEventListener("keydown", keydown);
      document.body.style.overflow = oldOverflow;
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="market-backdrop"
      ref={container}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {children}
    </div>
  );
}
