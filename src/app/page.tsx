import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Página root "/" — Server Component que redirige según sesión y password_changed.
 *
 * Lógica:
 * 1. Si no autenticado → redirect /auth/login
 * 2. Si autenticado + password_changed = false → redirect /auth/change-password
 * 3. Si autenticado + password_changed = true → redirect /catalogo
 *
 * NO renderiza UI — es solo lógica de redirect.
 */
export default async function Home() {
  const supabase = await createClient();

  // 1. Obtener usuario actual
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 2. Si no autenticado → ir a login
  if (!user) {
    redirect("/auth/login");
  }

  // 3. Si autenticado, leer flag password_changed
  const { data: userData } = await supabase
    .from("users")
    .select("password_changed")
    .eq("id", user.id)
    .single();

  // 4. Redirigir según flag
  if (!userData?.password_changed) {
    redirect("/auth/change-password");
  } else {
    redirect("/catalogo");
  }
}
