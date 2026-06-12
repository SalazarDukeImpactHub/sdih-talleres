"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";

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
 * (2b) Server Action redeemKey — valida y canjea una clave de acceso.
 * Será implementado en bloque 14 (slice 2b).
 */
