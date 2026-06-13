import React from "react";
import { InicioContent } from "@/lib/schemas/section-content";

/**
 * InicioSection Component — Welcome/hero section with quick-links grid
 *
 * Design: D-4 (Server Component)
 * - Renders hero title + description
 * - 4 quick-link cards (2x2 responsive grid)
 * - Each card clickable to navigate to target section
 *
 * Props:
 * @param content Parsed InicioContent from Zod schema
 * @param onLinkClick Callback when quick-link card is clicked
 */

interface InitioSectionProps {
  content: InicioContent;
  onLinkClick?: (section: "aprendizaje" | "taller" | "instalacion" | "glosario") => void;
}

const LINK_ICONS: Record<string, string> = {
  aprendizaje: "📚",
  taller: "🛠️",
  instalacion: "⚙️",
  glosario: "📖",
};

export function InicioSection({ content, onLinkClick }: InitioSectionProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      {/* Hero Section */}
      <div className="mb-12 text-center md:text-left">
        <h1 className="text-4xl md:text-5xl font-bold font-display text-text-primary mb-4">
          {content.title}
        </h1>
        <p className="text-lg text-text-secondary max-w-2xl">
          {content.description}
        </p>
      </div>

      {/* Quick Links Grid */}
      <div className="grid grid-cols-2 gap-4 md:gap-6">
        {content.quick_links.map((link, idx) => {
          const icon = LINK_ICONS[link.target_section] || "→";

          return (
            <button
              key={idx}
              onClick={() => onLinkClick?.(link.target_section)}
              className="group relative p-6 bg-gradient-to-br from-navy-700 to-navy-800 border border-navy-600 rounded-lg hover:border-cyan transition-all duration-300 overflow-hidden"
              aria-label={`Ir a ${link.label}`}
            >
              {/* Gradient glow on hover */}
              <div
                className="absolute inset-0 bg-gradient-to-br from-cyan/0 to-magenta/0 group-hover:from-cyan/10 group-hover:to-magenta/10 transition-all duration-300"
                aria-hidden="true"
              />

              {/* Content */}
              <div className="relative z-10 flex flex-col items-center justify-center text-center gap-2">
                <div className="text-3xl md:text-4xl">{icon}</div>
                <h3 className="text-base md:text-lg font-semibold text-text-primary group-hover:text-cyan transition-colors">
                  {link.label}
                </h3>
              </div>

              {/* Bottom accent line */}
              <div
                className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan to-magenta transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
