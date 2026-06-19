"use client";

import Image from "next/image";
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
          {/* Logo oficial Salazar Duke Impact Hub */}
          <Link
            href="/catalogo"
            className="flex items-center gap-2 sm:gap-3 group"
            aria-label="Salazar Duke Impact Hub — ir al catálogo"
          >
            <span className="relative inline-block h-9 w-9 sm:h-10 sm:w-10 overflow-hidden rounded-md ring-1 ring-white/10 group-hover:ring-cyan/60 transition">
              <Image
                src="/branding/logo-brain.png"
                alt=""
                width={56}
                height={56}
                priority
                className="absolute inset-0 h-full w-full object-cover scale-[1.35]"
              />
            </span>
            <span className="hidden sm:inline text-base sm:text-lg font-bold text-text-primary font-display group-hover:text-cyan transition-colors">
              SALAZAR DUKE <span className="text-text-muted font-normal">· Impact Hub</span>
            </span>
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
