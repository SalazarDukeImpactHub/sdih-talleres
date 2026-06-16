import { saveExerciseProgress } from "@/lib/actions/exercises";

/**
 * saveWithRetry — Client-side retry wrapper with exponential backoff
 *
 * Design Decision D-5:
 * - Wraps saveExerciseProgress Server Action with retry logic
 * - Exponential backoff: 3s, 6s, 9s (total ~18s max)
 * - Up to 3 attempts (0 immediate, then 2 retries)
 * - Silent retries: no UI feedback until exhaustion (error toast handled in component)
 * - Returns success/error object (no throw) for graceful error handling
 *
 * @param exerciseId UUID of exercise to save
 * @param userResponse User's response text
 * @param status Optional status ('in_progress' | 'done')
 * @returns { success: boolean, error?: string }
 */
export async function saveWithRetry(
  exerciseId: string,
  userResponse: string,
  status?: "in_progress" | "done"
): Promise<{ success: boolean; error?: string }> {
  const maxAttempts = 3;
  const backoffMs = [3000, 6000, 9000]; // exponential: 3s, 6s, 9s

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const result = await saveExerciseProgress(
        exerciseId,
        userResponse,
        status
      );

      if (result.success) {
        return { success: true };
      }

      // Server Action returned error, log and continue to retry
      console.warn(
        `[saveWithRetry] Attempt ${attempt + 1}/${maxAttempts} failed:`,
        result.error
      );

      // If this was the last attempt, return the error
      if (attempt === maxAttempts - 1) {
        return {
          success: false,
          error:
            result.error ||
            "No pudimos guardar tu respuesta después de varios intentos",
        };
      }

      // Wait before next attempt
      const delayMs = backoffMs[attempt];
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    } catch (error) {
      // Catch exceptions from Server Action
      const errorMsg =
        error instanceof Error ? error.message : "Error desconocido";
      console.error(
        `[saveWithRetry] Attempt ${attempt + 1}/${maxAttempts} exception:`,
        error
      );

      if (attempt === maxAttempts - 1) {
        return {
          success: false,
          error: `Error al guardar: ${errorMsg}`,
        };
      }

      // Wait before retry
      const delayMs = backoffMs[attempt];
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return {
    success: false,
    error: "Agotados los intentos de guardado",
  };
}
