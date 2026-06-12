import type { ReactNode } from "react";

interface AuthCardProps {
  children: ReactNode;
  className?: string;
}

/**
 * Componente AuthCard — wrapper para formularios de autenticación.
 * Proporciona estilos visuales consistentes: backdrop blur, borde sutil, sombra.
 * Responsive: padding reducido en mobile.
 */
export function AuthCard({ children, className = "" }: AuthCardProps) {
  return (
    <div
      className={`
        backdrop-blur-sm bg-navy-700 border border-navy-600 rounded-lg
        p-6 sm:p-8 max-w-md mx-auto
        shadow-lg sd-rise
        ${className}
      `}
    >
      {children}
    </div>
  );
}
