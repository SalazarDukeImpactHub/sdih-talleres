"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { SaveExerciseProgressSchema } from "@/lib/schemas/exercise";

/**
 * Server Action: saveExerciseProgress
 *
 * Idempotent upsert into exercise_progress table.
 * Called from ExerciseCard on autosave or explicit "Listo" click.
 *
 * Design Decision D-4:
 * - Validates input with Zod SaveExerciseProgressSchema
 * - Gets current user, checks authorization via workshop_access
 * - Upserts with ignoreDuplicates: false to allow UPDATE on conflict
 * - RLS policies (SELECT, INSERT, UPDATE) provide second line of defense
 * - Returns success/error + updated_at for UI sync
 *
 * @param exerciseId UUID of the exercise
 * @param userResponse User's response text (max 10000 chars)
 * @param status Optional status ('in_progress' | 'done'), defaults to 'in_progress'
 * @returns { success: boolean, updated_at?: string, error?: string }
 */
export async function saveExerciseProgress(
  exerciseId: string,
  userResponse: string,
  status?: "in_progress" | "done"
): Promise<{
  success: boolean;
  updated_at?: string;
  error?: string;
}> {
  try {
    // 1. Validate inputs with Zod
    const parsed = SaveExerciseProgressSchema.safeParse({
      exerciseId,
      userResponse,
      status: status || "in_progress",
    });

    if (!parsed.success) {
      return {
        success: false,
        error: "Datos de entrada inválidos",
      };
    }

    // 2. Get current user
    const user = await getCurrentUser();

    if (!user) {
      return {
        success: false,
        error: "Usuario no autenticado",
      };
    }

    // 3. Create server client
    const supabase = await createClient();

    // 4. Verify exercise exists and get its workshop_id
    const { data: exercise, error: exerciseError } = await supabase
      .from("exercises")
      .select("workshop_id")
      .eq("id", exerciseId)
      .single();

    if (exerciseError || !exercise) {
      return {
        success: false,
        error: "Ejercicio no encontrado",
      };
    }

    // 5. Verify user has redeemed access to this workshop (explicit check before upsert)
    const { data: access, error: accessError } = await supabase
      .from("workshop_access")
      .select("redeemed_at")
      .eq("workshop_id", exercise.workshop_id)
      .eq("user_id", user.id)
      .single();

    if (accessError || !access?.redeemed_at) {
      return {
        success: false,
        error: "No tenés acceso a este taller",
      };
    }

    // 6. Idempotent upsert (ON CONFLICT DO UPDATE)
    // ignoreDuplicates: false allows UPDATE on UNIQUE(user_id, exercise_id) conflict
    // RLS policy UPDATE checks user_id = auth.uid() as second defense
    const now = new Date().toISOString();
    const { error: upsertError } = await supabase
      .from("exercise_progress")
      .upsert(
        [
          {
            user_id: user.id,
            exercise_id: exerciseId,
            user_response_text: userResponse,
            status: parsed.data.status,
            updated_at: now,
          },
        ],
        {
          onConflict: "user_id,exercise_id",
          ignoreDuplicates: false,
        }
      );

    if (upsertError) {
      console.error("[saveExerciseProgress] Upsert error:", upsertError);
      return {
        success: false,
        error: `Error guardando progreso: ${upsertError.message}`,
      };
    }

    return {
      success: true,
      updated_at: now,
    };
  } catch (err) {
    console.error("[saveExerciseProgress] Exception:", err);
    return {
      success: false,
      error: "Error al procesar",
    };
  }
}
