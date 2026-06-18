import { z } from "zod";

/**
 * Schemas Zod para user/student CRUD del admin panel (change 5 slice 5c).
 * Student creation: email unique + temporal password que obliga cambio en primer login.
 */

export const createStudentSchema = z.object({
  email: z
    .string()
    .email("Email inválido")
    .min(1, "Email es requerido"),
  passwordTemp: z
    .string()
    .min(8, "Contraseña temporal mínimo 8 caracteres")
    .max(128, "Contraseña máximo 128 caracteres"),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
