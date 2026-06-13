"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";

/**
 * Server Action: recordSectionVisit
 *
 * Idempotent insertion into section_visits table.
 * Called when user views a section (via SectionRenderer on mount).
 *
 * Design Decision D-3:
 * - Triggered on section render (implicit interaction)
 * - Uses UNIQUE constraint for idempotency (ON CONFLICT DO NOTHING)
 * - No client state needed; server owns progress
 *
 * @param sectionId UUID of the section being visited
 * @returns success: true if insert succeeded; false if error
 */
export async function recordSectionVisit(sectionId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return {
        success: false,
        error: "Usuario no autenticado",
      };
    }

    const supabase = await createClient();

    // Insert visit record; idempotent via UNIQUE constraint
    // If user has already visited this section, the DB constraint prevents duplicate
    // We use upsert to handle the conflict gracefully
    // ignoreDuplicates: true → ON CONFLICT DO NOTHING. Sin esto, upsert genera
    // ON CONFLICT DO UPDATE, que exige una policy UPDATE en section_visits
    // (no existe — solo SELECT/INSERT) y falla con RLS 42501 en re-visitas.
    const { error } = await supabase.from("section_visits").upsert(
      {
        user_id: user.id,
        section_id: sectionId,
        // visited_at defaults to now() in DB
      },
      {
        onConflict: "user_id,section_id",
        ignoreDuplicates: true,
      }
    );

    if (error) {
      console.error("[recordSectionVisit] Error inserting visit:", error);
      return {
        success: false,
        error: "Error registrando visita",
      };
    }

    return { success: true };
  } catch (err) {
    console.error("[recordSectionVisit] Exception:", err);
    return {
      success: false,
      error: "Error al procesar",
    };
  }
}

/**
 * Helper: Get progress percentage for a workshop
 *
 * Calculates progress as: (count of visited sections / 5) * 100
 * Called from route handler to compute progress bar value
 *
 * @param userId UUID of the user
 * @param workshopId UUID of the workshop
 * @returns progressPercent: 0-100
 */
export async function getWorkshopProgress(
  userId: string,
  workshopId: string
): Promise<number> {
  try {
    const supabase = await createClient();

    // Count distinct sections visited in this workshop
    const { data, error } = await supabase
      .from("section_visits")
      .select("section_id")
      .eq("user_id", userId)
      .in(
        "section_id",
        // Subquery: get section IDs for this workshop
        await supabase
          .from("sections")
          .select("id")
          .eq("workshop_id", workshopId)
          .then((res) => res.data?.map((s) => s.id) || [])
      );

    if (error) {
      console.error("[getWorkshopProgress] Error querying visits:", error);
      return 0;
    }

    const visitedCount = new Set(data?.map((v) => v.section_id)).size;
    const progressPercent = (visitedCount / 5) * 100;

    return Math.min(100, Math.round(progressPercent));
  } catch (err) {
    console.error("[getWorkshopProgress] Exception:", err);
    return 0;
  }
}
