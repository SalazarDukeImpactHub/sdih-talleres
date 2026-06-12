"use client";

import Link from "next/link";
import { signOut } from "@/app/(authenticated)/_actions/sign-out";

interface User {
  id: string;
  email: string;
  name: string;
}

interface TopBarProps {
  user: User;
}

/**
 * Componente TopBar — barra superior de navegación para rutas autenticadas.
 *
 * Estructura:
 * - Izquierda: Logo SDIH (link a /catalogo)
 * - Centro-derecha: Nombre del usuario
 * - Derecha: Botón "Cerrar sesión" (form con Server Action signOut)
 *
 * Responsive:
 * - Padding y font-size ajustados en mobile
 * - Altura mínima botones: 44px (touch-friendly)
 */
export function TopBar({ user }: TopBarProps) {
  const displayName = user.name || user.email;

  return (
    <header className="bg-navy-800 border-b border-navy-600 sticky top-0 z-50" data-testid="top-bar">
      <div className="max-w-full px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo a la izquierda */}
          <Link
            href="/catalogo"
            className="flex items-center gap-2 text-xl font-bold text-text-primary font-display hover:text-cyan transition-colors"
          >
            {/* Isotipo cerebro simple (text-based en este cambio) */}
            <span className="text-2xl">🧠</span>
            <span className="hidden sm:inline">SDIH</span>
          </Link>

          {/* Nombre del usuario en el centro */}
          <div className="flex-1 text-center">
            <p className="text-sm sm:text-base text-text-secondary truncate">
              {displayName}
            </p>
          </div>

          {/* Botón Cerrar sesión a la derecha */}
          <form action={signOut} className="flex-shrink-0">
            <button
              type="submit"
              className="px-4 py-2 min-h-11 sm:min-h-12 bg-cyan text-navy-900 rounded font-semibold hover:bg-cyan/90 transition-colors active:scale-95 text-xs sm:text-sm"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
