"use server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateAccessKey } from "@/app/admin/talleres/[id]/alumnos/actions";

/**
 * Server Actions para el panel global de claves (/admin/claves).
 * Vista transversal: todas las claves de todos los talleres, más
 * asignación de clave a un alumno existente sin pasar por el taller.
 */

export type KeyStatus = "Pendiente" | "Canjeada" | "Expirada";

export interface AccessKeyRow {
  accessId: string;
  userId: string;
  email: string;
  name: string | null;
  workshopId: string;
  workshopTitle: string;
  status: KeyStatus;
  redeemedAt: string | null;
  expiresAt: string;
  createdAt: string;
}

interface RawAccessRow {
  id: string;
  user_id: string;
  workshop_id: string;
  redeemed_at: string | null;
  expires_at: string;
  created_at: string;
  users: { email: string; name: string | null };
  workshops: { title: string };
}

/**
 * Todas las claves emitidas, de todos los talleres, con alumno y estado.
 * Ordenadas por creación descendente.
 */
export async function fetchAllKeys(): Promise<AccessKeyRow[]> {
  await requireAdmin();

  try {
    const admin = await createAdminClient();

    const { data, error } = await admin
      .from("workshop_access")
      .select(
        `
        id,
        user_id,
        workshop_id,
        redeemed_at,
        expires_at,
        created_at,
        users!inner(email, name),
        workshops!inner(title)
      `
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    const now = new Date();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (((data as any) || []) as RawAccessRow[]).map((row) => {
      let status: KeyStatus = "Pendiente";
      if (row.redeemed_at) {
        status = "Canjeada";
      } else if (new Date(row.expires_at) < now) {
        status = "Expirada";
      }

      return {
        accessId: row.id,
        userId: row.user_id,
        email: row.users.email,
        name: row.users.name,
        workshopId: row.workshop_id,
        workshopTitle: row.workshops.title,
        status,
        redeemedAt: row.redeemed_at,
        expiresAt: row.expires_at,
        createdAt: row.created_at,
      };
    });
  } catch (err) {
    console.error(
      "fetchAllKeys error:",
      err instanceof Error ? err.message : err
    );
    return [];
  }
}

export interface AssignOption {
  id: string;
  label: string;
}

/**
 * Opciones para el formulario de asignación: alumnos y talleres activos.
 */
export async function fetchAssignOptions(): Promise<{
  students: AssignOption[];
  workshops: AssignOption[];
}> {
  await requireAdmin();

  try {
    const admin = await createAdminClient();

    const [studentsRes, workshopsRes] = await Promise.all([
      admin
        .from("users")
        .select("id, email, name")
        .eq("role", "alumno")
        .order("email"),
      admin.from("workshops").select("id, title").order("title"),
    ]);

    if (studentsRes.error) throw studentsRes.error;
    if (workshopsRes.error) throw workshopsRes.error;

    return {
      students: (studentsRes.data || []).map((u) => ({
        id: u.id,
        label: u.name ? `${u.name} (${u.email})` : u.email,
      })),
      workshops: (workshopsRes.data || []).map((w) => ({
        id: w.id,
        label: w.title,
      })),
    };
  } catch (err) {
    console.error(
      "fetchAssignOptions error:",
      err instanceof Error ? err.message : err
    );
    return { students: [], workshops: [] };
  }
}

/**
 * Asignar (o regenerar) una clave para un alumno existente + taller.
 * Delegación directa a generateAccessKey — mismo upsert, misma expiración de 90 días.
 * La clave plaintext se devuelve UNA sola vez para que el admin la copie.
 */
export async function assignKeyToStudent(
  userId: string,
  workshopId: string
): Promise<{ success: boolean; key?: string; error?: string }> {
  // requireAdmin ya corre dentro de generateAccessKey
  if (!userId || !workshopId) {
    return { success: false, error: "Alumno y taller son obligatorios" };
  }
  return generateAccessKey(userId, workshopId);
}
