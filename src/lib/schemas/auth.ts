import { z } from "zod";

/**
 * Schemas Zod para validación de formularios de autenticación.
 * Mensajes de error en español Rioplatense.
 */

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(8, "Mínimo 8 caracteres"),
    newPassword: z.string().min(8, "Mínimo 8 caracteres"),
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
