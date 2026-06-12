import { describe, it, expect } from "vitest";
import { accessKeySchema } from "@/lib/schemas/workshop";

/**
 * Unit tests para accessKeySchema (Zod validation).
 * Valida normalization (case-insensitive, trimming) y constraints.
 */

describe("accessKeySchema", () => {
  describe("valid keys", () => {
    it("válida clave simple en mayúscula", () => {
      const result = accessKeySchema.safeParse({
        key: "FUTURE-2024",
        workshopId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.key).toBe("FUTURE-2024");
      }
    });

    it("normaliza clave minúscula a mayúscula", () => {
      const result = accessKeySchema.safeParse({
        key: "future-2024",
        workshopId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.key).toBe("FUTURE-2024");
      }
    });

    it("normaliza clave mixta a mayúscula", () => {
      const result = accessKeySchema.safeParse({
        key: "FuTuRe-2024",
        workshopId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.key).toBe("FUTURE-2024");
      }
    });

    it("trim whitespace", () => {
      const result = accessKeySchema.safeParse({
        key: "  FUTURE-2024  ",
        workshopId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.key).toBe("FUTURE-2024");
      }
    });

    it("acepta números y guiones", () => {
      const result = accessKeySchema.safeParse({
        key: "RAG-STARTER-2024",
        workshopId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.key).toBe("RAG-STARTER-2024");
      }
    });
  });

  describe("invalid keys", () => {
    it("rechaza clave muy corta", () => {
      const result = accessKeySchema.safeParse({
        key: "AB",
        workshopId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("mínimo 3");
      }
    });

    it("rechaza clave muy larga", () => {
      const result = accessKeySchema.safeParse({
        key: "A".repeat(21),
        workshopId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("máximo 20");
      }
    });

    it("rechaza caracteres inválidos", () => {
      const result = accessKeySchema.safeParse({
        key: "future@2024!",
        workshopId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Solo letras");
      }
    });

    it("rechaza espacios en la clave", () => {
      const result = accessKeySchema.safeParse({
        key: "FUTURE 2024",
        workshopId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("workshopId validation", () => {
    it("acepta UUID válido", () => {
      const result = accessKeySchema.safeParse({
        key: "FUTURE-2024",
        workshopId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(true);
    });

    it("rechaza UUID inválido", () => {
      const result = accessKeySchema.safeParse({
        key: "FUTURE-2024",
        workshopId: "not-a-uuid",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("inválido");
      }
    });

    it("rechaza workshopId vacío", () => {
      const result = accessKeySchema.safeParse({
        key: "FUTURE-2024",
        workshopId: "",
      });
      expect(result.success).toBe(false);
    });
  });
});
