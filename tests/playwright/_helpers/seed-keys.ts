import { supabaseAdmin } from "./supabase-admin";
import { generateAccessKeyString, hashAccessKey } from "@/lib/crypto/access-key";
import { randomUUID } from "crypto";

/**
 * Test helpers para crear claves de acceso (plaintext y hasheadas).
 * Usadas en e2e tests para fixture setup.
 * 5c: createPlaintextKey (legacy) y createHashedKey (placeholder)
 * 5d: extender createHashedKey con hash/salt reales
 */

/**
 * Crear una clave de acceso en plaintext (legacy, sin hash).
 * Usada en tests de backward-compat (5d).
 * @param userId UUID del alumno
 * @param workshopId UUID del taller
 * @returns plaintext key para test setup
 */
export async function createPlaintextKey(
  userId: string,
  workshopId: string
): Promise<string> {
  // Generar clave
  const key = generateAccessKeyString();

  // Borrar si ya existe (idempotent)
  await supabaseAdmin
    .from("workshop_access")
    .delete()
    .eq("user_id", userId)
    .eq("workshop_id", workshopId);

  // Insert plaintext (no hash/salt)
  const { error } = await supabaseAdmin
    .from("workshop_access")
    .insert({
      user_id: userId,
      workshop_id: workshopId,
      access_key: key,
      // access_key_salt: null, // 5d agrega esto
      // access_key_hash: null, // 5d agrega esto
      expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    });

  if (error) {
    throw new Error(`createPlaintextKey failed: ${error.message}`);
  }

  return key;
}

/**
 * Crear una clave de acceso hasheada (SHA-256 + salt).
 * En 5c: placeholder (sin hash real)
 * En 5d: implementar con hash/salt reales
 * @param userId UUID del alumno
 * @param workshopId UUID del taller
 * @returns plaintext key para test setup (no se usa en app, solo en tests)
 */
export async function createHashedKey(
  userId: string,
  workshopId: string
): Promise<string> {
  // Generar clave plaintext
  const plaintext = generateAccessKeyString();

  // Generar salt
  const salt = randomUUID();

  // Calcular hash (5d: implementado; 5c: placeholder con return plaintext)
  const hash = hashAccessKey(plaintext, salt);

  // Borrar si ya existe (idempotent)
  await supabaseAdmin
    .from("workshop_access")
    .delete()
    .eq("user_id", userId)
    .eq("workshop_id", workshopId);

  // Insert con hash + salt (5d: columnas existen post-migration)
  // En 5c: estas columnas no existen aún; usar fallback
  try {
    const { error } = await supabaseAdmin
      .from("workshop_access")
      .insert({
        user_id: userId,
        workshop_id: workshopId,
        access_key: plaintext, // 5c: guardar plaintext; 5d: remover
        access_key_salt: salt, // 5d: agrega post-migration
        access_key_hash: hash, // 5d: agrega post-migration
        expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      });

    if (error) {
      throw new Error(`createHashedKey failed: ${error.message}`);
    }
  } catch (err) {
    // 5c fallback: si no existen columnas de hash, insertar plaintext nomas
    if (err instanceof Error && err.message.includes("no column")) {
      const { error: fallbackError } = await supabaseAdmin
        .from("workshop_access")
        .insert({
          user_id: userId,
          workshop_id: workshopId,
          access_key: plaintext,
          expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        });

      if (fallbackError) {
        throw new Error(`createHashedKey (fallback) failed: ${fallbackError.message}`);
      }
    } else {
      throw err;
    }
  }

  return plaintext;
}
