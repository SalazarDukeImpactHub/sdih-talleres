"use server";

import { createClient } from "@/lib/supabase/server";

export interface PublicWorkshop {
  id: string;
  slug: string;
  title: string;
  description: string;
  instructor: string;
  duration_min: number | null;
  status: string;
  category: string | null;
  cover_image: string | null;
  price_display: string | null;
}

/**
 * fetchPublicWorkshops — talleres visibles en la vitrina pública (sin login).
 * Selecciona SOLO metadata de marketing. El contenido (sections/exercises/
 * glossary) queda protegido por sus propias policies — nunca se expone acá.
 * Usa el cliente anon; la policy workshops_select_public habilita la lectura.
 */
export async function fetchPublicWorkshops(): Promise<PublicWorkshop[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("workshops")
      .select(
        "id, slug, title, description, instructor, duration_min, status, category, cover_image, price_display"
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("[fetchPublicWorkshops] Error:", error.message);
      return [];
    }
    return (data as PublicWorkshop[]) || [];
  } catch (err) {
    console.error("[fetchPublicWorkshops] Excepción:", err);
    return [];
  }
}
