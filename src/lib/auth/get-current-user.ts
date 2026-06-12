import { createClient } from "@/lib/supabase/server";

/**
 * Obtiene el usuario actual de la sesión Supabase.
 * Solo se usa en Server Components o Server Actions.
 *
 * @returns El usuario autenticado o null si no hay sesión
 */
export async function getCurrentUser() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    // Obtener datos adicionales del usuario desde public.users
    const { data: userData } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    return {
      id: user.id,
      email: user.email || "",
      name: userData?.name || null,
      role: userData?.role || "alumno",
      password_changed: userData?.password_changed || false,
    };
  } catch {
    return null;
  }
}
