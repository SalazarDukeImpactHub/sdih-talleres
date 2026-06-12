import { describe, it, expect } from "vitest";
import { SectionContentSchema } from "@/lib/schemas/section-content";

/**
 * Unit Tests for Section Content Discriminated Union (3a.16)
 *
 * Validates Zod discriminated union schema for all 5 section types.
 * For each type: valid content passes, invalid content fails, wrong type rejected.
 */

describe("SectionContentSchema — Discriminated Union", () => {
  // ============================================================
  // INICIO SECTION
  // ============================================================

  describe("Inicio Section", () => {
    it("should parse valid inicio content", () => {
      const validInicio = {
        type: "inicio",
        title: "Welcome to the Workshop",
        description: "Learn everything about memory systems",
        quick_links: [
          { label: "Learning", target_section: "aprendizaje" },
          { label: "Exercises", target_section: "taller" },
          { label: "Setup", target_section: "instalacion" },
          { label: "Glossary", target_section: "glosario" },
        ],
      };

      const result = SectionContentSchema.parse(validInicio);
      expect(result.type).toBe("inicio");
      expect(result.title).toBe("Welcome to the Workshop");
      expect(result.quick_links).toHaveLength(4);
    });

    it("should reject inicio without quick_links", () => {
      const invalidInicio = {
        type: "inicio",
        title: "Welcome",
        description: "A workshop",
        // missing quick_links
      };

      expect(() => SectionContentSchema.parse(invalidInicio)).toThrow();
    });

    it("should reject inicio with wrong quick_link target", () => {
      const invalidInicio = {
        type: "inicio",
        title: "Welcome",
        description: "A workshop",
        quick_links: [
          { label: "Invalid", target_section: "unknown_section" },
        ],
      };

      expect(() => SectionContentSchema.parse(invalidInicio)).toThrow();
    });
  });

  // ============================================================
  // APRENDIZAJE SECTION (Learning / Carousel)
  // ============================================================

  describe("Aprendizaje Section", () => {
    it("should parse valid aprendizaje content with slides", () => {
      const validAprendizaje = {
        type: "aprendizaje",
        title: "Learning Module",
        slides: [
          {
            kicker: "Concept 1",
            title: "Introduction to Memory",
            body: "Memory is important for AI agents...",
            notes: "Ask students about their use cases",
          },
          {
            kicker: "Concept 2",
            title: "Vector Embeddings",
            body: "Embeddings capture semantic meaning...",
          },
        ],
        pdf_url: "https://example.com/slides.pdf",
      };

      const result = SectionContentSchema.parse(validAprendizaje);
      expect(result.type).toBe("aprendizaje");
      expect(result.slides).toHaveLength(2);
      expect(result.slides[0].notes).toBe("Ask students about their use cases");
    });

    it("should parse aprendizaje without pdf_url", () => {
      const validAprendizaje = {
        type: "aprendizaje",
        title: "Learning Module",
        slides: [
          {
            kicker: "Concept",
            title: "Title",
            body: "Content here",
          },
        ],
        // no pdf_url
      };

      const result = SectionContentSchema.parse(validAprendizaje);
      expect(result.type).toBe("aprendizaje");
      expect(result.pdf_url).toBeUndefined();
    });

    it("should reject aprendizaje with no slides", () => {
      const invalidAprendizaje = {
        type: "aprendizaje",
        title: "Learning Module",
        slides: [], // empty array
      };

      expect(() =>
        SectionContentSchema.parse(invalidAprendizaje)
      ).toThrow();
    });

    it("should reject aprendizaje with invalid pdf_url", () => {
      const invalidAprendizaje = {
        type: "aprendizaje",
        title: "Learning Module",
        slides: [
          {
            kicker: "Concept",
            title: "Title",
            body: "Content",
          },
        ],
        pdf_url: "not-a-valid-url",
      };

      expect(() =>
        SectionContentSchema.parse(invalidAprendizaje)
      ).toThrow();
    });
  });

  // ============================================================
  // TALLER SECTION (Exercises)
  // ============================================================

  describe("Taller Section", () => {
    it("should parse valid taller content", () => {
      const validTaller = {
        type: "taller",
        title: "Exercises",
        instructions: "Complete all exercises and submit your work",
        placeholder: "No exercises available yet",
      };

      const result = SectionContentSchema.parse(validTaller);
      expect(result.type).toBe("taller");
      expect(result.instructions).toBe(
        "Complete all exercises and submit your work"
      );
    });

    it("should reject taller without instructions", () => {
      const invalidTaller = {
        type: "taller",
        title: "Exercises",
        // missing instructions
      };

      expect(() => SectionContentSchema.parse(invalidTaller)).toThrow();
    });
  });

  // ============================================================
  // INSTALACION SECTION (Installation / Setup)
  // ============================================================

  describe("Instalacion Section", () => {
    it("should parse valid instalacion content with steps", () => {
      const validInstalacion = {
        type: "instalacion",
        title: "Installation Guide",
        steps: [
          {
            order: 1,
            title: "Install package",
            description: "Download from PyPI",
            code: "pip install my-package",
            language: "bash",
          },
          {
            order: 2,
            title: "Configure",
            description: "Set up API key",
            code: 'export API_KEY="sk-..."',
            language: "bash",
          },
        ],
        success_message: "Installation complete!",
      };

      const result = SectionContentSchema.parse(validInstalacion);
      expect(result.type).toBe("instalacion");
      expect(result.steps).toHaveLength(2);
      expect(result.steps[0].language).toBe("bash");
    });

    it("should reject instalacion with no steps", () => {
      const invalidInstalacion = {
        type: "instalacion",
        title: "Installation",
        steps: [], // empty
      };

      expect(() =>
        SectionContentSchema.parse(invalidInstalacion)
      ).toThrow();
    });

    it("should reject instalacion with invalid language", () => {
      const invalidInstalacion = {
        type: "instalacion",
        title: "Installation",
        steps: [
          {
            order: 1,
            title: "Install",
            description: "Setup",
            code: "echo 'hello'",
            language: "unknown_language", // invalid
          },
        ],
      };

      expect(() =>
        SectionContentSchema.parse(invalidInstalacion)
      ).toThrow();
    });
  });

  // ============================================================
  // GLOSARIO SECTION (Glossary)
  // ============================================================

  describe("Glosario Section", () => {
    it("should parse valid glosario content", () => {
      const validGlosario = {
        type: "glosario",
        title: "Glossary",
        search_placeholder: "Search for terms...",
      };

      const result = SectionContentSchema.parse(validGlosario);
      expect(result.type).toBe("glosario");
      expect(result.search_placeholder).toBe("Search for terms...");
    });

    it("should reject glosario without search_placeholder", () => {
      const invalidGlosario = {
        type: "glosario",
        title: "Glossary",
        // missing search_placeholder
      };

      expect(() => SectionContentSchema.parse(invalidGlosario)).toThrow();
    });
  });

  // ============================================================
  // DISCRIMINATED UNION EDGE CASES
  // ============================================================

  describe("Discriminated Union", () => {
    it("should reject unknown type", () => {
      const unknownType = {
        type: "unknown_section_type",
        title: "Unknown",
      };

      expect(() => SectionContentSchema.parse(unknownType)).toThrow();
    });

    it("should correctly discriminate between similar content", () => {
      const inicioData = {
        type: "inicio",
        title: "Welcome",
        description: "Welcome message",
        quick_links: [],
      };

      const tallerData = {
        type: "taller",
        title: "Exercises",
        instructions: "Do the exercises",
      };

      const parsedInicio = SectionContentSchema.parse(inicioData);
      const parsedTaller = SectionContentSchema.parse(tallerData);

      expect(parsedInicio.type).toBe("inicio");
      expect(parsedTaller.type).toBe("taller");
      expect(
        "quick_links" in parsedInicio &&
          !("quick_links" in parsedTaller)
      ).toBe(true);
    });

    it("should preserve type narrowing", () => {
      const aprendizajeData = {
        type: "aprendizaje" as const,
        title: "Learning",
        slides: [
          {
            kicker: "Concept",
            title: "Title",
            body: "Body text",
          },
        ],
      };

      const parsed = SectionContentSchema.parse(aprendizajeData);

      // Type guard to narrow to AprendizajeContent
      if (parsed.type === "aprendizaje") {
        expect(parsed.slides).toBeDefined();
        expect(Array.isArray(parsed.slides)).toBe(true);
      }
    });
  });
});
