import { describe, it, expect } from "vitest";
import { loginSchema, changePasswordSchema } from "@/lib/schemas/auth";

describe("Schemas de autenticación", () => {
  describe("loginSchema", () => {
    it("debe validar input válido con email y password correctos", () => {
      const input = {
        email: "alumna@test.com",
        password: "Talleres2026!",
      };
      const result = loginSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(input);
      }
    });

    it("debe rechazar email malformado con mensaje 'Email inválido'", () => {
      const input = {
        email: "not-an-email",
        password: "Talleres2026!",
      };
      const result = loginSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        const emailError = result.error.flatten().fieldErrors.email?.[0];
        expect(emailError).toBe("Email inválido");
      }
    });

    it("debe rechazar password con < 8 caracteres con mensaje 'Mínimo 8 caracteres'", () => {
      const input = {
        email: "alumna@test.com",
        password: "corto",
      };
      const result = loginSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.flatten().fieldErrors.password?.[0];
        expect(passwordError).toBe("Mínimo 8 caracteres");
      }
    });
  });

  describe("changePasswordSchema", () => {
    it("debe validar input válido con todas las refines pasando", () => {
      const input = {
        currentPassword: "Talleres2026!",
        newPassword: "NuevaPass456!",
        confirmPassword: "NuevaPass456!",
      };
      const result = changePasswordSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(input);
      }
    });

    it("debe rechazar cuando new y confirm no coinciden", () => {
      const input = {
        currentPassword: "Talleres2026!",
        newPassword: "NuevaPass456!",
        confirmPassword: "OtroPass123!",
      };
      const result = changePasswordSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        const confirmError = result.error.flatten().fieldErrors.confirmPassword?.[0];
        expect(confirmError).toBe("Las contraseñas nuevas no coinciden");
      }
    });

    it("debe rechazar cuando new === current", () => {
      const input = {
        currentPassword: "Talleres2026!",
        newPassword: "Talleres2026!",
        confirmPassword: "Talleres2026!",
      };
      const result = changePasswordSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        const newError = result.error.flatten().fieldErrors.newPassword?.[0];
        expect(newError).toBe("La nueva contraseña debe ser distinta a la actual");
      }
    });

    it("debe rechazar currentPassword con < 8 caracteres", () => {
      const input = {
        currentPassword: "corto",
        newPassword: "NuevaPass456!",
        confirmPassword: "NuevaPass456!",
      };
      const result = changePasswordSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        const currentError = result.error.flatten().fieldErrors.currentPassword?.[0];
        expect(currentError).toBe("Mínimo 8 caracteres");
      }
    });

    it("debe rechazar newPassword con < 8 caracteres", () => {
      const input = {
        currentPassword: "Talleres2026!",
        newPassword: "corto",
        confirmPassword: "corto",
      };
      const result = changePasswordSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        const newError = result.error.flatten().fieldErrors.newPassword?.[0];
        expect(newError).toBe("Mínimo 8 caracteres");
      }
    });
  });
});
