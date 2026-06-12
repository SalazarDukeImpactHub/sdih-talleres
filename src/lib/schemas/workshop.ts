import { z } from "zod";

/**
 * Schemas Zod para validación de workshops y acceso a claves.
 * Mensajes de error en español Rioplatense.
 */

export const accessKeySchema = z.object({
  key: z
    .string()
    .transform((val) => val.trim().toUpperCase())
    .pipe(
      z
        .string()
        .min(3, "Clave mínimo 3 caracteres")
        .max(20, "Clave máximo 20 caracteres")
        .regex(/^[A-Z0-9\-]+$/, "Solo letras, números y guiones")
    ),
  workshopId: z.string().uuid("Workshop ID inválido"),
});

/**
 * Tipos inferidos de los schemas para uso en componentes y Server Actions.
 */
export type AccessKeyInput = z.infer<typeof accessKeySchema>;
