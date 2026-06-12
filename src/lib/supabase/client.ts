import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para Client Components.
 * La sesión vive en cookies gestionadas por el server client + middleware.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
