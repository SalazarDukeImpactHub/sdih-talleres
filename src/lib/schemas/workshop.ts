import { z } from "zod";

/**
 * Schemas Zod para workshop CRUD del admin panel.
 * Solo metadata. Sections/exercises/glossary viven en tablas relacionales propias
 * (changes 3 y 4) y se administran en una UI separada (ADR D-15).
 */

export const createWorkshopSchema = z.object({
  title: z
    .string()
    .min(1, "Título es requerido")
    .max(200, "Título máximo 200 caracteres"),
  description: z
    .string()
    .min(1, "Descripción es requerida"),
  instructor: z
    .string()
    .min(1, "Instructor es requerido"),
  date_live: z
    .string()
    .datetime()
    .describe("ISO 8601 datetime"),
  duration: z
    .number()
    .int()
    .min(1, "Duración mínimo 1 minuto"),
  prerequisites: z
    .string()
    .optional(),
  status: z
    .enum(["disponible", "en vivo", "próximamente", "completado"]),
  category: z
    .string()
    .max(60, "Categoría máximo 60 caracteres")
    .optional(),
  // Precio como texto libre para display: "$50.000 COP", "USD 30", "Gratis", etc.
  price_display: z
    .string()
    .max(40, "Precio máximo 40 caracteres")
    .optional(),
});

export const updateWorkshopSchema = createWorkshopSchema.partial().extend({
  id: z.string().uuid("Workshop ID inválido"),
});

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

export type AccessKeyInput = z.infer<typeof accessKeySchema>;
export type CreateWorkshopInput = z.infer<typeof createWorkshopSchema>;
export type UpdateWorkshopInput = z.infer<typeof updateWorkshopSchema>;
