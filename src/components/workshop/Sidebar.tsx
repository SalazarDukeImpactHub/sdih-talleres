"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ProgressBar } from "./ProgressBar";
import { SocialFooter } from "./SocialFooter";
import { SectionIcon } from "./SectionIcon";

/**
 * Sidebar Component — Client-side navigation for workshop sections
 *
 * Design Decision D-2:
 * - Sticky on desktop (768px+), hamburger drawer on mobile (max-width 767px)
 * - 256px width on desktop
 * - Active tab has cyan glow + underline animation
 * - Footer: progress bar + social links
 *
 * Props:
 * @param activeSection Current active section type
 * @param progressPercent 0-100 progress value
 * @param onSectionChange Callback when tab is clicked
 * @param sections Array of section metadata (for rendering tabs)
 */

type SectionType = "inicio" | "aprendizaje" | "taller" | "instalacion" | "glosario";

export interface SidebarProps {
  activeSection: SectionType;
  progressPercent: number;
  onSectionChange: (section: SectionType) => void;
  sections?: Array<{
    id: string;
    type: SectionType;
    title: string;
  }>;
}

// SECTION_ICONS removido — ahora se usa el componente <SectionIcon type={type} />
// que renderiza SVG inline oficiales de cada sección.

const SECTION_LABELS: Record<string, string> = {
  inicio: "Inicio",
  aprendizaje: "Aprendizaje",
  taller: "Taller",
  instalacion: "Instalación",
  glosario: "Glosario",
};

export function Sidebar({
  activeSection,
  progressPercent,
  onSectionChange,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  sections = [],
}: SidebarProps) {
  const [showDrawer, setShowDrawer] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile breakpoint (768px)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleSectionClick = (sectionType: typeof activeSection) => {
    onSectionChange(sectionType);
    // Cerrar SIEMPRE si está abierto. El antiguo `if (isMobile)` fallaba en
    // race condition: isMobile se setea en useEffect post-mount y el primer
    // click puede llegar antes. El drawer sólo existe en mobile (md:hidden),
    // así que cerrarlo en desktop es no-op pero seguro.
    if (showDrawer) {
      setShowDrawer(false);
    }
  };

  const handleBackdropClick = () => {
    setShowDrawer(false);
  };

  const sectionTypes: SectionType[] = [
    "inicio",
    "aprendizaje",
    "taller",
    "instalacion",
    "glosario",
  ];

  // Desktop sidebar
  const desktopSidebar = (
    <div
      className="hidden md:flex flex-col w-64 bg-navy-800 border-r border-navy-700 sticky top-0 h-screen overflow-y-auto"
      role="navigation"
      aria-label="Workshop sections"
    >
      {/* Header */}
      <div className="p-6 border-b border-navy-700">
        <Link
          href="/catalogo"
          className="flex items-center gap-2 text-text-secondary hover:text-cyan transition-colors"
          title="Volver al catálogo"
        >
          <span className="text-lg">←</span>
          <span className="text-sm">Volver</span>
        </Link>
      </div>

      {/* Section Tabs */}
      <nav className="flex-1 p-4 space-y-2">
        {sectionTypes.map((type) => (
          <button
            key={type}
            onClick={() => handleSectionClick(type)}
            className={`w-full px-4 py-3 rounded-md flex items-center gap-3 transition-all duration-200 ${
              activeSection === type
                ? "bg-navy-700 text-cyan shadow-[0_0_20px_rgba(25,198,230,0.3)]"
                : "text-text-secondary hover:text-text-primary hover:bg-navy-700"
            }`}
            aria-current={activeSection === type ? "page" : undefined}
          >
            <SectionIcon type={type as "inicio" | "aprendizaje" | "taller" | "instalacion" | "glosario"} className="h-5 w-5" />
            <span className="font-medium">{SECTION_LABELS[type]}</span>
          </button>
        ))}
      </nav>

      {/* Progress Bar */}
      <div className="p-4 border-t border-navy-700">
        <ProgressBar progressPercent={progressPercent} />
      </div>

      {/* Social Footer */}
      <div className="p-4 border-t border-navy-700">
        <SocialFooter />
      </div>
    </div>
  );

  // Mobile drawer
  const mobileDrawer = (
    <>
      {/* Hamburger button (top-left, visible only on mobile) */}
      <div className="md:hidden fixed top-16 left-0 z-40 p-4">
        <button
          onClick={() => setShowDrawer(!showDrawer)}
          className="p-2 rounded-md bg-navy-800 text-cyan hover:bg-navy-700 transition-colors"
          aria-label={showDrawer ? "Cerrar menú" : "Abrir menú"}
        >
          <span className="text-2xl">{showDrawer ? "✕" : "☰"}</span>
        </button>
      </div>

      {/* Drawer overlay */}
      {showDrawer && (
        <div
          className="fixed inset-0 z-[55] bg-black/50 md:hidden"
          onClick={handleBackdropClick}
          role="presentation"
          aria-hidden="true"
        />
      )}

      {/* Drawer sidebar */}
      {showDrawer && (
        <div
          className="md:hidden fixed left-0 top-0 h-screen w-64 bg-navy-800 z-[60] overflow-y-auto border-r border-navy-700 flex flex-col"
          role="navigation"
          aria-label="Workshop sections mobile"
        >
          {/* Close button */}
          <div className="p-4 flex justify-between items-center border-b border-navy-700">
            <h2 className="text-lg font-bold text-text-primary">Secciones</h2>
            <button
              onClick={handleBackdropClick}
              className="p-1 text-cyan hover:text-magenta transition-colors"
              aria-label="Cerrar"
            >
              <span className="text-2xl">✕</span>
            </button>
          </div>

          {/* Section Tabs */}
          <nav className="flex-1 p-4 space-y-2">
            {sectionTypes.map((type) => (
              <button
                key={type}
                onClick={() => handleSectionClick(type)}
                className={`w-full px-4 py-3 rounded-md flex items-center gap-3 transition-all duration-200 ${
                  activeSection === type
                    ? "bg-navy-700 text-cyan shadow-[0_0_20px_rgba(25,198,230,0.3)]"
                    : "text-text-secondary hover:text-text-primary hover:bg-navy-700"
                }`}
                aria-current={activeSection === type ? "page" : undefined}
              >
                <SectionIcon type={type as "inicio" | "aprendizaje" | "taller" | "instalacion" | "glosario"} className="h-5 w-5" />
                <span className="font-medium">{SECTION_LABELS[type]}</span>
              </button>
            ))}
          </nav>

          {/* Progress Bar */}
          <div className="p-4 border-t border-navy-700">
            <ProgressBar progressPercent={progressPercent} />
          </div>

          {/* Social Footer */}
          <div className="p-4 border-t border-navy-700">
            <SocialFooter />
          </div>

          {/* Back Button */}
          <div className="p-4 border-t border-navy-700">
            <Link
              href="/catalogo"
              className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-md bg-navy-700 text-text-secondary hover:text-cyan transition-colors"
            >
              <span>←</span>
              <span>Volver al Catálogo</span>
            </Link>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      {desktopSidebar}
      {mobileDrawer}
    </>
  );
}
