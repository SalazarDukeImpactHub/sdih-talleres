"use client";

import { useActionState, useRef, useEffect } from "react";
import { redeemKey } from "@/app/(authenticated)/catalogo/actions";

interface AccessKeyModalProps {
  isOpen: boolean;
  workshopId: string;
  workshopTitle: string;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * AccessKeyModal — Modal para ingresar clave de acceso a taller bloqueado.
 * Estados: idle (formulario) → loading (spinner) → error (mensaje rojo) → success (checkmark)
 * Auto-cierra después de 2s en success.
 */
export function AccessKeyModal({
  isOpen,
  workshopId,
  workshopTitle,
  onClose,
  onSuccess,
}: AccessKeyModalProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [state, formAction, isPending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const key = formData.get("key") as string;
      const result = await redeemKey({ key, workshopId });
      return result;
    },
    { status: "idle" as const, error: "" }
  );

  // Auto-focus input cuando el modal abre
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Pequeño delay para que el modal sea visible primero
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Auto-close modal después de 2s en success
  useEffect(() => {
    if (state.status === "success") {
      const timer = setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [state.status, onClose, onSuccess]);

  // Escape key cierra modal (pero no en loading state)
  useEffect(() => {
    if (!isOpen || isPending) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isPending, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={!isPending ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-sm bg-navy-800 rounded-lg shadow-xl border border-navy-600/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          aria-describedby="modal-description"
        >
          {/* Header */}
          <div className="p-6 border-b border-navy-600/30">
            <div className="flex items-center justify-between">
              <h2
                id="modal-title"
                className="text-lg font-semibold text-text-primary"
              >
                Ingresar a {workshopTitle}
              </h2>
              <button
                onClick={onClose}
                disabled={isPending}
                className="text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Cerrar modal"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <form ref={formRef} action={formAction} className="space-y-4">
              {/* Hint text */}
              <p
                id="modal-description"
                className="text-sm text-text-secondary mb-4"
              >
                Ingresá la clave que recibiste para acceder a este taller.
              </p>

              {/* Input field */}
              <div>
                <label
                  htmlFor="access-key-input"
                  className="block text-xs font-medium text-text-secondary mb-2"
                >
                  Clave de acceso
                </label>
                <input
                  ref={inputRef}
                  id="access-key-input"
                  type="text"
                  name="key"
                  placeholder="Ej: FUTURE-TECH-2024"
                  disabled={isPending || state.status === "success"}
                  className="w-full px-3 py-2 rounded bg-navy-700 border border-navy-500 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  autoComplete="off"
                  spellCheck="false"
                />
              </div>

              {/* Error state */}
              {state.status === "error" && state.error && (
                <div className="p-3 rounded bg-red-500/10 border border-red-500/30">
                  <p className="text-sm text-red-400">{state.error}</p>
                </div>
              )}

              {/* Success state */}
              {state.status === "success" && (
                <div className="p-3 rounded bg-lime-500/10 border border-lime-500/30">
                  <div className="flex items-center gap-2">
                    <span className="text-xl text-lime-400">✓</span>
                    <p className="text-sm text-lime-400">¡Acceso concedido!</p>
                  </div>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={isPending || state.status === "success"}
                className="w-full px-3 py-2 rounded text-sm font-semibold bg-cyan text-navy-900 hover:bg-cyan/90 active:bg-cyan/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                aria-label={
                  state.status === "success"
                    ? "Acceso concedido, cerrando..."
                    : "Enviar"
                }
              >
                {isPending && (
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                )}
                {state.status === "success" ? "Cerrar" : "Enviar"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
