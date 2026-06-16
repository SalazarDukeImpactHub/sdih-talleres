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

/**
 * Helper: Get exercise-aware progress for a workshop
 *
 * Design Decision D-8:
 * - Formula: (sections_visited + exercises_done) / (5 + total_exercises) * 100
 * - Edge case: if total_exercises = 0, fallback to visitadas / 5 (backward compatible)
 * - Returns full breakdown for ProgressBar display
 *
 * @param userId UUID of the user
 * @param workshopId UUID of the workshop
 * @returns { progressPercent: 0-100, sectionsVisited: number, exercisesDone: number, totalExercises: number }
 */
export async function getExerciseAwareProgress(
  userId: string,
  workshopId: string
): Promise<{
  progressPercent: number;
  sectionsVisited: number;
  exercisesDone: number;
  totalExercises: number;
}> {
  try {
    const supabase = await createClient();

    // 1. Count distinct sections visited in this workshop
    const { data: visits, error: visitsError } = await supabase
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

    if (visitsError) {
      console.error(
        "[getExerciseAwareProgress] Error querying visits:",
        visitsError
      );
      return {
        progressPercent: 0,
        sectionsVisited: 0,
        exercisesDone: 0,
        totalExercises: 0,
      };
    }

    const sectionsVisited = new Set(visits?.map((v) => v.section_id)).size;

    // 2. Count total exercises in this workshop.
    // BUG fixeado: usar { count: 'exact', head: true } devuelve data=null y el
    // count en el campo `count` — NO en data.length. Leer data.length daba
    // siempre 0 → el cálculo caía SIEMPRE al fallback visitadas/5 y nunca
    // aplicaba la fórmula exercise-aware. Traemos los ids y contamos el array.
    const { data: exercisesData, error: exercisesError } = await supabase
      .from("exercises")
      .select("id")
      .eq("workshop_id", workshopId);

    if (exercisesError) {
      console.error(
        "[getExerciseAwareProgress] Error counting exercises:",
        exercisesError
      );
      // Fallback to section-only progress
      const progressPercent = (sectionsVisited / 5) * 100;
      return {
        progressPercent: Math.min(100, Math.round(progressPercent)),
        sectionsVisited,
        exercisesDone: 0,
        totalExercises: 0,
      };
    }

    const totalExercises = exercisesData?.length || 0;

    // 3. If no exercises, use fallback formula
    if (totalExercises === 0) {
      const progressPercent = (sectionsVisited / 5) * 100;
      return {
        progressPercent: Math.min(100, Math.round(progressPercent)),
        sectionsVisited,
        exercisesDone: 0,
        totalExercises: 0,
      };
    }

    // 4. Count exercises marked as 'done' by this user
    const { data: doneExercises, error: doneError } = await supabase
      .from("exercise_progress")
      .select("exercise_id")
      .eq("user_id", userId)
      .eq("status", "done")
      .in(
        "exercise_id",
        // Subquery: get exercise IDs for this workshop
        await supabase
          .from("exercises")
          .select("id")
          .eq("workshop_id", workshopId)
          .then((res) => res.data?.map((e) => e.id) || [])
      );

    if (doneError) {
      console.error(
        "[getExerciseAwareProgress] Error counting done exercises:",
        doneError
      );
      // Fallback to section-only progress
      const progressPercent = (sectionsVisited / 5) * 100;
      return {
        progressPercent: Math.min(100, Math.round(progressPercent)),
        sectionsVisited,
        exercisesDone: 0,
        totalExercises,
      };
    }

    const exercisesDone = new Set(doneExercises?.map((d) => d.exercise_id))
      .size;

    // 5. Calculate exercise-aware progress
    const doneItems = sectionsVisited + exercisesDone;
    const totalItems = 5 + totalExercises;
    const progressPercent = (doneItems / totalItems) * 100;

    return {
      progressPercent: Math.min(100, Math.round(progressPercent)),
      sectionsVisited,
      exercisesDone,
      totalExercises,
    };
  } catch (err) {
    console.error("[getExerciseAwareProgress] Exception:", err);
    return {
      progressPercent: 0,
      sectionsVisited: 0,
      exercisesDone: 0,
      totalExercises: 0,
    };
  }
}
