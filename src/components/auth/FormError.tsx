interface FormErrorProps {
  message?: string | string[];
}

/**
 * Componente FormError — renderiza mensaje de error inline bajo input.
 * Accesible con aria-live para screen readers.
 */
export function FormError({ message }: FormErrorProps) {
  if (!message) return null;

  const errorText = Array.isArray(message) ? message[0] : message;

  return (
    <p className="text-red-400 text-sm mt-1" aria-live="polite">
      {errorText}
    </p>
  );
}
