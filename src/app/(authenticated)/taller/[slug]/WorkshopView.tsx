"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/workshop/Sidebar";
import { SectionRenderer } from "@/components/workshop/SectionRenderer";

type SectionType = "inicio" | "aprendizaje" | "taller" | "instalacion" | "glosario";

export interface WorkshopViewProps {
  workshop: {
    id: string;
    title: string;
    slug: string;
    description: string;
  };
  sections: Array<{
    id: string;
    type: SectionType;
    content_json: unknown;
    section_order: number;
  }>;
  glossaryTerms: Array<{
    id: string;
    term: string;
    definition: string;
    category: string;
  }>;
  progressPercent: number;
}

/**
 * WorkshopView — Client Component for workshop detail page
 *
 * Manages:
 * - Active section state
 * - Responsive layout (desktop sidebar + mobile drawer)
 * - Section navigation + rendering
 *
 * Props are all serializable (no functions from server).
 * recordSectionVisit is called from SectionRenderer via Server Action.
 */
export function WorkshopView({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  workshop,
  sections,
  glossaryTerms,
  progressPercent,
}: WorkshopViewProps) {
  // Find the first section (should be 'inicio')
  const firstSection = sections[0];
  const [activeSection, setActiveSection] = useState<SectionType>(
    (firstSection?.type as SectionType) || "inicio"
  );

  // Find section data by type
  const currentSectionData = sections.find(
    (s) => (s.type as SectionType) === activeSection
  );

  if (!currentSectionData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-navy-900">
        <div className="text-center text-text-secondary">
          <p>No se encontró la sección solicitada.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-navy-900">
      {/* Sidebar */}
      <Sidebar
        activeSection={activeSection}
        progressPercent={progressPercent}
        onSectionChange={setActiveSection}
        sections={sections.map((s) => ({
          id: s.id,
          type: s.type as SectionType,
          title: s.type.charAt(0).toUpperCase() + s.type.slice(1),
        }))}
      />

      {/* Main Content */}
      <main className="flex-1 p-8">
        <SectionRenderer
          section={currentSectionData}
          glossaryTerms={glossaryTerms}
          onSectionChange={setActiveSection}
        />
      </main>
    </div>
  );
}
