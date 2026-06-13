"use client";

import React, { useEffect } from "react";
import { recordSectionVisit } from "@/lib/actions/workshop-sections";
import { SectionContentSchema } from "@/lib/schemas/section-content";
import { InicioSection } from "./sections/InicioSection";
import { AprendizajeSection } from "./sections/AprendizajeSection";
import { TallerSection } from "./sections/TallerSection";
import { InstalacionSection } from "./sections/InstalacionSection";
import { GlosarioSection } from "./sections/GlosarioSection";

/**
 * SectionRenderer Component — Routes to the correct section component based on type
 *
 * Design Decision D-4 & D-5:
 * - Discriminated union switch based on section type
 * - Calls recordSectionVisit(sectionId) on mount (Server Action)
 * - Parses content_json via Zod; shows error if invalid
 * - Each section component receives parsed content
 *
 * Props:
 * @param section Section data with id, type, content_json
 * @param glossaryTerms Optional array of glossary terms (for glosario section)
 * @param onSectionChange Callback to navigate to another section
 */

type SectionType = "inicio" | "aprendizaje" | "taller" | "instalacion" | "glosario";

export interface SectionRendererProps {
  section: {
    id: string;
    type: SectionType;
    content_json: unknown;
  };
  glossaryTerms?: Array<{
    id: string;
    term: string;
    definition: string;
    category: string;
  }>;
  onSectionChange?: (sectionType: SectionType) => void;
  onVisitRecorded?: (sectionId: string) => void;
}

export function SectionRenderer({
  section,
  glossaryTerms = [],
  onSectionChange,
  onVisitRecorded,
}: SectionRendererProps) {
  // Record visit on mount + avisar al wrapper para el update optimista del progreso
  useEffect(() => {
    const recordVisit = async () => {
      const result = await recordSectionVisit(section.id);
      if (result.success) {
        onVisitRecorded?.(section.id);
      } else {
        console.warn("[SectionRenderer] Failed to record visit:", result.error);
      }
    };

    recordVisit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section.id]);

  // Parse and validate content
  let content;
  let parseError: string | null = null;

  try {
    content = SectionContentSchema.parse(section.content_json);
  } catch (err) {
    parseError = err instanceof Error ? err.message : "Invalid section content";
  }

  if (parseError) {
    return (
      <div className="p-8 bg-red-950/30 border border-red-700 rounded-lg text-red-200">
        <h2 className="text-lg font-bold mb-2">Error al cargar la sección</h2>
        <p className="text-sm">{parseError}</p>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="p-8 bg-navy-700 border border-navy-600 rounded-lg text-text-secondary text-center">
        Cargando sección…
      </div>
    );
  }

  // Route to correct component based on type
  switch (content.type) {
    case "inicio":
      return (
        <InicioSection
          content={content}
          onLinkClick={onSectionChange}
        />
      );

    case "aprendizaje":
      return <AprendizajeSection content={content} />;

    case "taller":
      return <TallerSection content={content} />;

    case "instalacion":
      return <InstalacionSection content={content} />;

    case "glosario":
      return (
        <GlosarioSection
          content={content}
          glossaryTerms={glossaryTerms}
        />
      );

    default:
      const _exhaustive: never = content;
      return _exhaustive;
  }
}
