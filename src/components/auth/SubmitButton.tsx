"use client";

import { useFormStatus } from "react-dom";

interface SubmitButtonProps {
  children: string;
  disabled?: boolean;
}

/**
 * Componente SubmitButton — botón de envío de formulario con loading state.
 * Usa useFormStatus de React 19 para mostrar estado pending.
 */
export function SubmitButton({ children, disabled = false }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const isLoading = pending || disabled;

  return (
    <button
      type="submit"
      disabled={isLoading}
      className="w-full bg-cyan text-navy-900 py-2.5 rounded font-semibold disabled:opacity-50 transition-opacity duration-200"
    >
      {isLoading ? "Cargando..." : children}
    </button>
  );
}
