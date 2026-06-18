"use server";

import crypto from "crypto";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createStudentSchema } from "@/lib/schemas/user";
import { generateAccessKeyString, hashAccessKey } from "@/lib/crypto/access-key";
import { sendAccessKeyEmail } from "@/lib/email/send-access-key";

/**
 * Server Actions para student management (change 5 slice 5c).
 * Crear estudiante + generar clave de acceso + fetch lista.
 */

/**
 * Crear un estudiante nuevo en auth.users + public.users + workshop_access.
 * @param workshopId UUID del taller
 * @param email email del alumno
 * @param passwordTemp contraseña temporal (obliga cambio en primer login)
 * @returns { success, userId?, accessKey?, error? }
 */
export async function createStudent(
  workshopId: string,
  email: string,
  passwordTemp: string
): Promise<{
  success: boolean;
  userId?: string;
  accessKey?: string;
  error?: string;
}> {
  // Guard: verify admin
  await requireAdmin();

  try {
    // Validar input contra schema
    const validated = createStudentSchema.parse({
      email,
      passwordTemp,
    });

    const admin = await createAdminClient();

    // 1. Crear auth user
    const { data: authUser, error: authError } =
      await admin.auth.admin.createUser({
        email: validated.email,
        password: validated.passwordTemp,
        email_confirm: true, // skip email verification para alumnos creados por admin
      });

    if (authError || !authUser?.user) {
      return {
        success: false,
        error: authError?.message || "Error creando usuario en auth",
      };
    }

    // 2. Crear fila en public.users
    const { error: insertUserError } = await admin
      .from("users")
      .insert({
        id: authUser.user.id,
        email: validated.email,
        name: validated.email.split("@")[0], // default name = email prefix
        role: "alumno",
        password_changed: false, // forzar cambio en primer login
      });

    if (insertUserError) {
      // Rollback: borrar auth user si insert de public.users falla
      await admin.auth.admin.deleteUser(authUser.user.id);
      return {
        success: false,
        error: insertUserError.message || "Error creando usuario en DB",
      };
    }

    // 3. Generar clave de acceso
    const keyResult = await generateAccessKey(
      authUser.user.id,
      workshopId
    );

    if (!keyResult.success) {
      // Rollback: borrar auth user + public.users si falla la clave
      await admin.auth.admin.deleteUser(authUser.user.id);
      await admin.from("users").delete().eq("id", authUser.user.id);
      return {
        success: false,
        error: keyResult.error || "Error generando clave de acceso",
      };
    }

    // 4. Best-effort email con la clave de acceso. No abortar si falla —
    // el modal del admin sigue mostrando la clave como fallback manual.
    try {
      const { data: workshopRow } = await admin
        .from("workshops")
        .select("title")
        .eq("id", workshopId)
        .single();

      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      const studentName = validated.email.split("@")[0];

      const emailResult = await sendAccessKeyEmail({
        to: validated.email,
        name: studentName,
        accessKey: keyResult.key!,
        workshopTitle: workshopRow?.title || "tu taller",
        loginEmail: validated.email,
        passwordTemp: validated.passwordTemp,
        baseUrl,
      });

      if (!emailResult.ok) {
        console.warn(
          `[createStudent] Email send failed (best-effort): ${emailResult.error}`
        );
      }
    } catch (emailErr) {
      console.warn(
        `[createStudent] Email send threw (best-effort):`,
        emailErr
      );
    }

    return {
      success: true,
      userId: authUser.user.id,
      accessKey: keyResult.key, // devolver plaintext UNA VEZ
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Generar una clave de acceso para (usuario, taller).
 * Si la clave ya existe, la reemplaza (upsert).
 * @param userId UUID del alumno
 * @param workshopId UUID del taller
 * @returns { success, key?, error? }
 */
export async function generateAccessKey(
  userId: string,
  workshopId: string
): Promise<{
  success: boolean;
  key?: string;
  error?: string;
}> {
  // Guard: verify admin
  await requireAdmin();

  try {
    const key = generateAccessKeyString();
    const salt = crypto.randomUUID();
    const hash = hashAccessKey(key, salt);

    const admin = await createAdminClient();

    // 5d: hash + salt es la fuente de verdad; access_key plaintext se mantiene
    // como fallback durante v1 (column NOT NULL del change 2). Post-v1 se dropea
    // cuando todas las claves vivas hayan sido emitidas con hash.
    const { error } = await admin
      .from("workshop_access")
      .upsert(
        {
          user_id: userId,
          workshop_id: workshopId,
          access_key: key,
          access_key_hash: hash,
          access_key_salt: salt,
          expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        },
        { onConflict: "user_id,workshop_id" }
      );

    if (error) {
      return {
        success: false,
        error: error.message || "Error generando clave",
      };
    }

    return {
      success: true,
      key, // devolver plaintext para modal display (una sola vez)
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return {
      success: false,
      error: message,
    };
  }
}

interface WorkshopAccessRow {
  user_id: string;
  created_at: string;
  redeemed_at: string | null;
  expires_at: string;
  users: {
    id: string;
    email: string;
    name: string | null;
  };
}

/**
 * Fetch estudiantes de un taller con progreso + estado clave.
 * @param workshopId UUID del taller
 * @returns array de { userId, email, name, progressPercent?, accessKeyStatus, createdAt }
 */
export async function fetchStudents(workshopId: string): Promise<
  Array<{
    userId: string;
    email: string;
    name: string | null;
    progressPercent?: number;
    accessKeyStatus: "Pendiente" | "Canjeada" | "Expirada";
    createdAt: string;
  }>
> {
  // Guard: verify admin
  await requireAdmin();

  try {
    const admin = await createAdminClient();

    // Query: join users + workshop_access, filter by workshop_id
    const { data, error } = await admin
      .from("workshop_access")
      .select(
        `
        user_id,
        created_at,
        redeemed_at,
        expires_at,
        users!inner(id, email, name)
      `
      )
      .eq("workshop_id", workshopId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    // Transform response
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const students = ((data as any) || [])
      .map((row: WorkshopAccessRow) => {
        const now = new Date();
        const expiresAt = new Date(row.expires_at);
        const redeemedAt = row.redeemed_at ? new Date(row.redeemed_at) : null;

        let status: "Pendiente" | "Canjeada" | "Expirada" = "Pendiente";
        if (redeemedAt) {
          status = "Canjeada";
        } else if (expiresAt < now) {
          status = "Expirada";
        }

        return {
          userId: row.user_id,
          email: row.users.email,
          name: row.users.name,
          progressPercent: 0, // TODO: call getExerciseAwareProgress (from change 4)
          accessKeyStatus: status,
          createdAt: row.created_at,
        };
      });

    return students;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    console.error("fetchStudents error:", message);
    return [];
  }
}
