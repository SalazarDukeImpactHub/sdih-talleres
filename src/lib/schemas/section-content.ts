import { z } from "zod";

/**
 * Section Content Schema — Discriminated Union per ADR-001
 * All sections store content in a JSONB field with runtime validation via Zod.
 * Each section type has a fixed schema; no markdown parsing in v1.
 *
 * Types: inicio, aprendizaje, taller, instalacion, glosario
 */

// ============================================================
// Shared schemas (used in multiple section types)
// ============================================================

const SlideSchema = z.object({
  kicker: z.string().describe("Subtitle or topic label (e.g., 'Enfoque 1')"),
  title: z.string().describe("Slide title"),
  body: z.string().describe("Main content paragraph"),
  // nullable: fixtures y contenido real traen notes: null desde JSONB
  notes: z.string().nullable().optional().describe("Optional instructor notes"),
});

const StepSchema = z.object({
  order: z.number().int().min(1).describe("Step number in sequence"),
  title: z.string().describe("Step title"),
  description: z.string().describe("Step description"),
  code: z.string().describe("Code snippet to display"),
  language: z
    .enum(["bash", "python", "javascript", "typescript", "sql", "html", "css", "json", "yaml"])
    .describe("Programming language for syntax highlighting"),
});

const QuickLinkSchema = z.object({
  label: z.string().describe("Link label (e.g., 'Aprendizaje')"),
  target_section: z
    .enum(["aprendizaje", "taller", "instalacion", "glosario"])
    .describe("Target section type to navigate to"),
});

// ============================================================
// Section-specific schemas
// ============================================================

/**
 * InicioContentSchema — Welcome/hero section
 * Provides title, description, and quick links to jump to other sections
 */
const InicioContentSchema = z.object({
  type: z.literal("inicio"),
  title: z.string().describe("Workshop title or welcome heading"),
  description: z.string().describe("Brief description of workshop"),
  quick_links: z.array(QuickLinkSchema).describe("4 quick-link cards to jump to sections"),
});

/**
 * AprendizajeContentSchema — Learning/carousel section
 * Carousel with slides, optional notes per slide, and optional PDF download
 */
const AprendizajeContentSchema = z.object({
  type: z.literal("aprendizaje"),
  title: z.string().describe("Section title"),
  slides: z.array(SlideSchema).min(1).describe("Array of carousel slides"),
  pdf_url: z.string().url().optional().describe("Optional PDF download link"),
});

/**
 * TallerContentSchema — Exercises section (placeholder in change 3, extended in change 4)
 * Structure for exercises; actual Exercise table wired in later changes
 */
const TallerContentSchema = z.object({
  type: z.literal("taller"),
  title: z.string().describe("Section title"),
  instructions: z.string().describe("Instructions for exercises"),
  placeholder: z.string().optional().describe("Placeholder message if no exercises available"),
});

/**
 * InstalacionContentSchema — Installation/setup section
 * Numbered steps with code blocks and language labels
 */
const InstalacionContentSchema = z.object({
  type: z.literal("instalacion"),
  title: z.string().describe("Section title"),
  steps: z.array(StepSchema).min(1).describe("Array of installation steps"),
  success_message: z.string().optional().describe("Message shown after all steps completed"),
});

/**
 * GlosarioContentSchema — Glossary section
 * Metadata for glossary display; terms are fetched from glossary_terms table
 */
const GlosarioContentSchema = z.object({
  type: z.literal("glosario"),
  title: z.string().describe("Section title"),
  search_placeholder: z.string().describe("Placeholder text for search input"),
});

// ============================================================
// Discriminated Union
// ============================================================

/**
 * SectionContentSchema — Union of all possible section content types
 * Used to validate Section.content_json at runtime
 *
 * Example usage:
 *   const content = SectionContentSchema.parse(section.content_json);
 *   switch (content.type) {
 *     case 'inicio': return <InicioSection data={content} />;
 *     // ...
 *   }
 */
export const SectionContentSchema = z.discriminatedUnion("type", [
  InicioContentSchema,
  AprendizajeContentSchema,
  TallerContentSchema,
  InstalacionContentSchema,
  GlosarioContentSchema,
]);

export type SectionContent = z.infer<typeof SectionContentSchema>;

// Export individual types for component props
export type InicioContent = z.infer<typeof InicioContentSchema>;
export type AprendizajeContent = z.infer<typeof AprendizajeContentSchema>;
export type TallerContent = z.infer<typeof TallerContentSchema>;
export type InstalacionContent = z.infer<typeof InstalacionContentSchema>;
export type GlosarioContent = z.infer<typeof GlosarioContentSchema>;

// Export helper for type narrowing in components
export function parseAndNarrowSectionContent(json: unknown): SectionContent {
  return SectionContentSchema.parse(json);
}
