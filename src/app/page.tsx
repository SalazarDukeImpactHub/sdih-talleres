import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Página root "/" — Server Component que redirige según sesión y password_changed.
 *
 * Lógica:
 * 1. Si no autenticado → redirect /auth/login
 * 2. Si autenticado + password_changed = false → redirect /auth/change-password
 * 3. Si autenticado + role = admin → redirect /admin/talleres
 * 4. Si autenticado + role = alumno → redirect /catalogo
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

  // 3. Si autenticado, leer flag password_changed + role
  const { data: userData } = await supabase
    .from("users")
    .select("password_changed, role")
    .eq("id", user.id)
    .single();

  // 4. Redirigir según flag y rol: admins van directo a su panel
  if (!userData?.password_changed) {
    redirect("/auth/change-password");
  } else if (userData.role === "admin") {
    redirect("/admin/talleres");
  } else {
    redirect("/catalogo");
  }
}
