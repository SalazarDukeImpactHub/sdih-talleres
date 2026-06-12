import React from "react";
import { TallerContent } from "@/lib/schemas/section-content";

/**
 * TallerSection Component — Exercises section (placeholder in change 3)
 *
 * Design: D-4 (Server Component)
 * - Change 3: Placeholder only (title + instructions + placeholder message)
 * - Change 4: Extends with Exercise table + interactivity
 * - Current state: read-only, no user interaction
 *
 * Props:
 * @param content Parsed TallerContent from Zod schema
 */

interface TallerSectionProps {
  content: TallerContent;
}

export function TallerSection({ content }: TallerSectionProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      {/* Header */}
      <h1 className="text-4xl md:text-5xl font-bold font-display text-text-primary mb-4">
        {content.title}
      </h1>

      {/* Instructions */}
      <div className="bg-navy-700 border border-navy-600 rounded-lg p-6 md:p-8 mb-8">
        <p className="text-text-secondary text-base md:text-lg leading-relaxed">
          {content.instructions}
        </p>
      </div>

      {/* Placeholder Message */}
      <div className="bg-gradient-to-br from-magenta/10 to-cyan/10 border border-magenta/30 rounded-lg p-8 md:p-12 text-center">
        <div className="text-5xl mb-4">🚀</div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          Ejercicios próximamente
        </h2>
        <p className="text-text-secondary">
          {content.placeholder ||
            "Los ejercicios estarán disponibles en la siguiente actualización. Mientras tanto, practica con los materiales del Aprendizaje."}
        </p>
      </div>
    </div>
  );
}
