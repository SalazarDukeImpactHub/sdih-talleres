import { createClient } from "@supabase/supabase-js";

/**
 * Crea un cliente Supabase con la clave service_role.
 * Se usa en Server Actions admin para bypassear RLS.
 * NUNCA exponer esta clave al cliente.
 *
 * @returns Cliente Supabase con autenticación service_role
 */
export async function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase credentials for admin client");
  }

  return createClient(url, serviceRoleKey);
}
