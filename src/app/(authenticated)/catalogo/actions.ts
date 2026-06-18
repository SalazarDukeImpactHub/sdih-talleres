"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { accessKeySchema } from "@/lib/schemas/workshop";
import { verifyAccessKey } from "@/lib/crypto/access-key";

/**
 * Server Action fetchWorkshops — obtiene todos los talleres con estado de desbloqueo del usuario actual.
 * Query: LEFT JOIN workshops × workshop_access (filtered by user_id)
 * Returns: array de workshops con boolean is_unlocked
 */
export async function fetchWorkshops() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      console.error("[fetchWorkshops] Usuario no autenticado");
      return { success: false, error: "Usuario no autenticado", workshops: [] };
    }

    const supabase = await createClient();

    // LEFT JOIN: todos los workshops, status de acceso por usuario
    // RLS en workshop_access filtra automáticamente a rows del usuario actual
    const { data: workshops, error } = await supabase
      .from("workshops")
      .select(`
        id,
        slug,
        title,
        description,
        instructor,
        date_live,
        duration_min,
        prerequisites,
        status,
        cover_image,
        whatsapp_message_template,
        price_display,
        workshop_access:workshop_access!left (
          id,
          redeemed_at,
          expires_at
        )
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("[fetchWorkshops] Error en query:", error);
      return { success: false, error: "Error al cargar talleres", workshops: [] };
    }

    // Procesar resultado: añadir is_unlocked basado en workshop_access
    interface WorkshopRow {
      id: string;
      slug: string;
      title: string;
      description: string;
      instructor: string;
      date_live: string | null;
      duration_min: number | null;
      prerequisites: string | null;
      status: string;
      cover_image: string | null;
      whatsapp_message_template: string | null;
      price_display: string | null;
      workshop_access?: Array<{ id: string; redeemed_at: string | null; expires_at: string }>;
    }

    const workshopsWithAccess = (workshops || []).map((w: WorkshopRow) => ({
      id: w.id,
      slug: w.slug,
      title: w.title,
      description: w.description,
      instructor: w.instructor,
      date_live: w.date_live,
      duration_min: w.duration_min,
      prerequisites: w.prerequisites,
      status: w.status,
      cover_image: w.cover_image,
      whatsapp_message_template: w.whatsapp_message_template,
      price_display: w.price_display,
      is_unlocked:
        Array.isArray(w.workshop_access) &&
        w.workshop_access.length > 0 &&
        w.workshop_access[0]?.redeemed_at !== null,
    }));

    return {
      success: true,
      workshops: workshopsWithAccess,
    };
  } catch (err) {
    console.error("[fetchWorkshops] Excepción:", err);
    return { success: false, error: "Error al procesar", workshops: [] };
  }
}

/**
 * Server Action redeemKey — valida y canjea una clave de acceso.
 * Validación Zod + busca workshop_access del usuario actual
 * RLS filtra automáticamente (authenticated user solo ve sus propias rows)
 * Chequeos: clave existe, coincide (case-insensitive), no expirada, no canjeada
 * Response: { success: true } o { success: false, error: "..." }
 */
export async function redeemKey(
  input: { key: string; workshopId: string }
): Promise<{ status: string; error?: string }> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return {
        status: "error",
        error: "Usuario no autenticado",
      };
    }

    // 1. Validar schema
    const parsed = accessKeySchema.safeParse(input);
    if (!parsed.success) {
      const errorMsg =
        parsed.error.issues[0]?.message || "Clave inválida";
      return {
        status: "error",
        error: errorMsg,
      };
    }

    const { key, workshopId } = parsed.data;
    const supabase = await createClient();

    // 2. Buscar workshop_access para este usuario + workshop
    // RLS filtra automáticamente (authenticated user solo ve sus rows)
    const { data: accessRow, error: selectError } = await supabase
      .from("workshop_access")
      .select("id, access_key, access_key_hash, access_key_salt, redeemed_at, expires_at")
      .eq("user_id", user.id)
      .eq("workshop_id", workshopId)
      .single();

    if (selectError && selectError.code !== "PGRST116") {
      // PGRST116 = no rows found (esperado si no existe yet)
      console.error("[redeemKey] Error en SELECT:", selectError);
      return {
        status: "error",
        error: "Error al verificar acceso",
      };
    }

    // 3. Si ya tiene acceso canjeado, rechazar
    if (accessRow && accessRow.redeemed_at !== null) {
      return {
        status: "error",
        error: "Ya tenés acceso a este taller",
      };
    }

    // 4. Si existe pero no canjeado: validar clave + expiración
    // 5d: hash primero (path principal), plaintext como fallback legacy.
    if (accessRow) {
      const normalized = key.toUpperCase();
      let isKeyValid = false;

      if (accessRow.access_key_hash && accessRow.access_key_salt) {
        isKeyValid = verifyAccessKey(
          normalized,
          accessRow.access_key_hash,
          accessRow.access_key_salt
        );
      }
      if (!isKeyValid && accessRow.access_key) {
        isKeyValid = accessRow.access_key.toUpperCase() === normalized;
      }

      const isExpired = new Date(accessRow.expires_at) < new Date();

      if (!isKeyValid || isExpired) {
        return {
          status: "error",
          error: "Clave inválida o expirada",
        };
      }

      // 5. UPDATE: set redeemed_at = now()
      const { error: updateError } = await supabase
        .from("workshop_access")
        .update({ redeemed_at: new Date().toISOString() })
        .eq("id", accessRow.id)
        .eq("user_id", user.id);

      if (updateError) {
        console.error("[redeemKey] Error en UPDATE:", updateError);
        return {
          status: "error",
          error: "Error al canjear acceso",
        };
      }

      return {
        status: "success",
      };
    }

    // 6. Si no existe row en absoluto, error
    return {
      status: "error",
      error: "Clave no válida para este taller",
    };
  } catch (err) {
    console.error("[redeemKey] Excepción:", err);
    return {
      status: "error",
      error: "Error al procesar solicitud",
    };
  }
}
