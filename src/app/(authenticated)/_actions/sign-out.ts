"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Server Action signOut — cierra sesión y redirige a login.
 * Llama a supabase.auth.signOut() y redirige a /auth/login.
 */
export async function signOut() {
  const supabase = await createClient();

  await supabase.auth.signOut();

  redirect("/auth/login");
}
