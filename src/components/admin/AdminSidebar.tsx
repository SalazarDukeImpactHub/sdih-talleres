"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

/**
 * AdminSidebar — Componente Client para navegación en panel admin.
 *
 * Renderiza:
 * - Logo/branding
 * - Nav links (Talleres, Claves)
 * - Estado de active link basado en pathname
 * - Collapse button para mobile (hamburger icon)
 *
 * Estilos: navy-900 bg, cyan highlights, responsive
 */
export function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const navItems = [
    { label: "Talleres", href: "/admin/talleres" },
    { label: "Claves", href: "/admin/claves" },
  ];

  return (
    <>
      {/* Mobile toggle button */}
      <div className="lg:hidden flex items-center justify-end p-4 bg-navy-900">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-white focus:outline-none"
          aria-label="Toggle sidebar"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative
          top-0 left-0 h-screen
          w-64 bg-navy-900
          transform transition-transform duration-300 lg:transform-none
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          z-40 flex flex-col
        `}
      >
        {/* Header con logo oficial */}
        <div className="p-5 border-b border-navy-800 flex items-center gap-3">
          <span className="relative inline-block h-10 w-10 overflow-hidden rounded-md ring-1 ring-white/10">
            <Image
              src="/branding/logo-brain.png"
              alt="Salazar Duke Impact Hub"
              width={56}
              height={56}
              className="absolute inset-0 h-full w-full object-cover scale-[1.35]"
            />
          </span>
          <div className="leading-tight">
            <p className="text-white text-sm font-bold font-display">SALAZAR DUKE</p>
            <p className="text-gray-400 text-xs">Panel Admin</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`
                block px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${
                  isActive(item.href)
                    ? "bg-cyan-500 text-white"
                    : "text-gray-200 hover:bg-navy-800"
                }
              `}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Volver al catálogo (vista alumna) */}
        <div className="px-4 pb-2">
          <Link
            href="/catalogo"
            onClick={() => setIsOpen(false)}
            className="block px-4 py-2 rounded-lg text-sm font-medium text-cyan-400 hover:bg-navy-800 transition-colors"
            data-testid="back-to-catalog-link"
          >
            ← Ver catálogo
          </Link>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-navy-800 text-xs text-gray-400">
          <p>v1.0</p>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
