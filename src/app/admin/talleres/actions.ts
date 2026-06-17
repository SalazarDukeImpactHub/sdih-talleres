"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";

/**
 * fetchWorkshops() — Server Action para obtener lista de talleres.
 * Utilizado por /admin/talleres page para renderizar la tabla.
 * Solo accesible por usuarios con role='admin' (verificado en tiempo de servidor).
 *
 * @param filter - filtro opcional por status ('disponible'|'en vivo'|'próximamente'|'completado')
 * @returns array de Workshop objects (id, slug, title, status, date, instructor, etc)
 */
export async function fetchWorkshops(
  filter?: "disponible" | "en vivo" | "próximamente" | "completado"
) {
  await requireAdmin();

  const supabase = await createAdminClient();

  let query = supabase
    .from("workshops")
    .select("id, slug, title, status, date_live, instructor, created_at, cover_image")
    .order("created_at", { ascending: false });

  if (filter) {
    query = query.eq("status", filter);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch workshops: ${error.message}`);
  }

  return data || [];
}
