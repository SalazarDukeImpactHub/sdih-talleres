"use client";

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
    { label: "Claves", href: "/admin/claves", disabled: true },
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
        {/* Header */}
        <div className="p-6 border-b border-navy-800">
          <h1 className="text-white text-xl font-bold">Panel Admin</h1>
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
                ${item.disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}
                ${
                  isActive(item.href)
                    ? "bg-cyan-500 text-white"
                    : "text-gray-200 hover:bg-navy-800"
                }
              `}
              aria-disabled={item.disabled}
            >
              {item.label}
            </Link>
          ))}
        </nav>

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
