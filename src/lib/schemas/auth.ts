import { z } from "zod";

/**
 * Schemas Zod para validación de formularios de autenticación.
 * Mensajes de error en español Rioplatense.
 */

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

// Audit v1 · L1 — complejidad mínima para la contraseña NUEVA:
// 8+ caracteres, al menos una letra y un número. Se aplica solo al cambio
// de contraseña (no al login, que valida contra lo ya guardado).
const strongPassword = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .regex(/[A-Za-z]/, "Debe incluir al menos una letra")
  .regex(/[0-9]/, "Debe incluir al menos un número");

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(8, "Mínimo 8 caracteres"),
    newPassword: strongPassword,
    confirmPassword: z.string().min(8, "Mínimo 8 caracteres"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas nuevas no coinciden",
    path: ["confirmPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "La nueva contraseña debe ser distinta a la actual",
    path: ["newPassword"],
  });

/**
 * Tipos inferidos de los schemas para uso en componentes y Server Actions.
 */
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
