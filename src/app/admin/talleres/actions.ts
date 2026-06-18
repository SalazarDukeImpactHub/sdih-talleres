"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createWorkshopSchema, updateWorkshopSchema } from "@/lib/schemas/workshop";
import { getPublicUrl } from "@/lib/storage";

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

/**
 * fetchWorkshopById() — Obtiene un taller específico por ID.
 * @param id - UUID del workshop
 * @returns Workshop object or null if not found
 */
export async function fetchWorkshopById(id: string) {
  await requireAdmin();

  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from("workshops")
    .select("*")
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") {
    throw new Error(`Failed to fetch workshop: ${error.message}`);
  }

  return data || null;
}

/**
 * uploadCover() — Sube imagen de portada a Supabase Storage bucket 'workshops'.
 * Path: {workshopId}/cover.{ext}
 * Requiere role='admin'.
 *
 * @param workshopId - UUID del workshop
 * @param formData - FormData con 'cover' file
 * @returns { success, url } or { success: false, error }
 */
export async function uploadCover(
  workshopId: string,
  formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
  await requireAdmin();

  const file = formData.get("cover") as File | null;

  if (!file) {
    return { success: false, error: "No file provided" };
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return {
      success: false,
      error: "Unsupported file type. Only JPG, PNG, and WebP are allowed.",
    };
  }

  // Validate file size (5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return { success: false, error: "File too large. Maximum 5MB." };
  }

  try {
    const supabase = await createAdminClient();

    // Determine file extension
    const ext = file.type.split("/")[1];
    const path = `${workshopId}/cover.${ext}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from("workshops")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const url = await getPublicUrl("workshops", path);

    return { success: true, url };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Failed to upload cover";
    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * createWorkshop() — Crea un nuevo taller con validación Zod.
 * Opcionalmente sube imagen de portada.
 * Requiere role='admin'.
 *
 * @param formData - FormData con fields: title, description, instructor, date_live, duration, prerequisites, status, content_json, cover (optional)
 * @returns { success, workshopId } or { success: false, error }
 */
export async function createWorkshop(
  formData: FormData
): Promise<{ success: boolean; workshopId?: string; error?: string }> {
  await requireAdmin();

  try {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const instructor = formData.get("instructor") as string;
    const dateRaw = formData.get("date_live") as string;
    const duration = parseInt(formData.get("duration") as string, 10);
    const prerequisites = formData.get("prerequisites") as string | undefined;
    const status = formData.get("status") as string;

    let date_live = dateRaw;
    if (dateRaw && !dateRaw.endsWith("Z") && !dateRaw.includes("+")) {
      const parsed = new Date(dateRaw);
      if (!isNaN(parsed.getTime())) date_live = parsed.toISOString();
    }

    const input = {
      title,
      description,
      instructor,
      date_live,
      duration,
      prerequisites: prerequisites || undefined,
      status,
    };

    const validation = createWorkshopSchema.safeParse(input);
    if (!validation.success) {
      const errorMsg = validation.error.issues
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join("; ");
      return { success: false, error: errorMsg };
    }

    const supabase = await createAdminClient();

    const slug = title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const { data, error: insertError } = await supabase
      .from("workshops")
      .insert([
        {
          title,
          slug,
          description,
          instructor,
          date_live,
          duration_min: duration,
          prerequisites,
          status,
        },
      ])
      .select("id")
      .single();

    if (insertError || !data) {
      throw insertError || new Error("Failed to insert workshop");
    }

    const workshopId = data.id;

    // Upload cover if provided
    const cover = formData.get("cover") as File | null;
    if (cover && cover.size > 0) {
      const coverFormData = new FormData();
      coverFormData.set("cover", cover);
      const uploadResult = await uploadCover(workshopId, coverFormData);

      if (uploadResult.success && uploadResult.url) {
        // Update workshop with cover_image URL
        await supabase
          .from("workshops")
          .update({ cover_image: uploadResult.url })
          .eq("id", workshopId);
      }
    }

    return { success: true, workshopId };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Failed to create workshop";
    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * updateWorkshop() — Actualiza un taller existente.
 * Opcionalmente actualiza imagen de portada.
 * Requiere role='admin'.
 *
 * @param id - UUID del workshop
 * @param formData - FormData con campos a actualizar
 * @returns { success: true } or { success: false, error }
 */
export async function updateWorkshop(
  id: string,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();

  try {
    const title = formData.get("title") as string | undefined;
    const description = formData.get("description") as string | undefined;
    const instructor = formData.get("instructor") as string | undefined;
    const dateRaw = formData.get("date_live") as string | undefined;
    const duration = formData.get("duration") as string | undefined;
    const prerequisites = formData.get("prerequisites") as string | undefined;
    const status = formData.get("status") as string | undefined;

    let date_live = dateRaw;
    if (dateRaw && !dateRaw.endsWith("Z") && !dateRaw.includes("+")) {
      const parsed = new Date(dateRaw);
      if (!isNaN(parsed.getTime())) date_live = parsed.toISOString();
    }

    const input: Record<string, unknown> = { id };
    if (title !== undefined) input.title = title;
    if (description !== undefined) input.description = description;
    if (instructor !== undefined) input.instructor = instructor;
    if (date_live !== undefined) input.date_live = date_live;
    if (duration !== undefined) input.duration = parseInt(duration, 10);
    if (prerequisites !== undefined) input.prerequisites = prerequisites;
    if (status !== undefined) input.status = status;

    const validation = updateWorkshopSchema.safeParse(input);
    if (!validation.success) {
      const errorMsg = validation.error.issues
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join("; ");
      return { success: false, error: errorMsg };
    }

    const supabase = await createAdminClient();

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) {
      updateData.title = title;
      updateData.slug = title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }
    if (description !== undefined) updateData.description = description;
    if (instructor !== undefined) updateData.instructor = instructor;
    if (date_live !== undefined) updateData.date_live = date_live;
    if (duration !== undefined) updateData.duration_min = parseInt(duration as string, 10);
    if (prerequisites !== undefined) updateData.prerequisites = prerequisites;
    if (status !== undefined) updateData.status = status;

    // Update workshop
    const { error: updateError } = await supabase
      .from("workshops")
      .update(updateData)
      .eq("id", id);

    if (updateError) {
      throw updateError;
    }

    // Upload new cover if provided
    const cover = formData.get("cover") as File | null;
    if (cover && cover.size > 0) {
      const coverFormData = new FormData();
      coverFormData.set("cover", cover);
      const uploadResult = await uploadCover(id, coverFormData);

      if (uploadResult.success && uploadResult.url) {
        // Update workshop with new cover_image URL
        await supabase
          .from("workshops")
          .update({ cover_image: uploadResult.url })
          .eq("id", id);
      }
    }

    return { success: true };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Failed to update workshop";
    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * deleteWorkshop() — Elimina un taller.
 * Requiere role='admin'.
 *
 * @param id - UUID del workshop
 * @returns { success: true } or { success: false, error }
 */
export async function deleteWorkshop(
  id: string
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();

  try {
    const supabase = await createAdminClient();

    const { error } = await supabase
      .from("workshops")
      .delete()
      .eq("id", id);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Failed to delete workshop";
    return {
      success: false,
      error: errorMsg,
    };
  }
}
