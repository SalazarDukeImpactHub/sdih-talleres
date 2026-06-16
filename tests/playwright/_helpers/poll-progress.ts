import { supabaseAdmin } from "./supabase-admin";

/**
 * Espera (poll) a que exista una fila de exercise_progress para
 * (userId, exerciseId) que cumpla el predicado dado.
 *
 * El autosave es asíncrono: debounce 1s + Server Action con round-trip a
 * sa-east-1 (~1-2s) + posible retry. Un waitForTimeout fijo (1.5s) pierde
 * contra esa latencia. Polling hasta 12s con intervalo de 500ms es robusto
 * sin ser frágil.
 */
export async function pollExerciseProgress(
  userId: string,
  exerciseId: string,
  predicate: (row: {
    user_response_text: string | null;
    status: string;
    updated_at: string;
  }) => boolean,
  timeoutMs = 12000
): Promise<{
  user_response_text: string | null;
  status: string;
  updated_at: string;
}> {
  const start = Date.now();
  let last: {
    user_response_text: string | null;
    status: string;
    updated_at: string;
  } | null = null;

  while (Date.now() - start < timeoutMs) {
    const { data } = await supabaseAdmin
      .from("exercise_progress")
      .select("user_response_text, status, updated_at")
      .eq("user_id", userId)
      .eq("exercise_id", exerciseId)
      .maybeSingle();

    if (data) {
      last = data;
      if (predicate(data)) return data;
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  throw new Error(
    `pollExerciseProgress timeout (${timeoutMs}ms). Última fila vista: ${JSON.stringify(last)}`
  );
}
