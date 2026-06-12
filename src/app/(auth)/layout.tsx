import type { ReactNode } from "react";

/**
 * Layout para rutas de autenticación (login, change-password).
 * Proporciona fondo compartido navy-900 y centrado de contenido.
 */
export default function AuthLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4">
      {children}
    </div>
  );
}
