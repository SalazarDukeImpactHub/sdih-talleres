"use server";

import { loginSchema } from "@/lib/schemas/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Server Action signIn — valida credenciales y redirige según password_changed.
 *
 * Flujo:
 * 1. Validar input con Zod (loginSchema)
 * 2. Llamar a supabase.auth.signInWithPassword()
 * 3. Si OK: leer flag password_changed de public.users
 *    - false → redirect /auth/change-password
 *    - true → redirect /catalogo
 * 4. Si falla Zod → devolver errores por campo
 * 5. Si falla Supabase → devolver error genérico "Credenciales inválidas"
 */
export async function signIn(
  _prevState: { errors?: Record<string, string | string[]> },
  formData: FormData
): Promise<{ errors?: Record<string, string | string[]> }> {
  // 1. Validar input con Zod
  const result = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
    };
  }

  try {
    // 2. Crear cliente Supabase de servidor
    const supabase = await createClient();

    // 3. Intentar login con Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: result.data.email,
      password: result.data.password,
    });

    if (error || !data.user?.id) {
      return {
        errors: { submit: "Credenciales inválidas" },
      };
    }

    // 4. Login exitoso — leer flag password_changed de public.users
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("password_changed")
      .eq("id", data.user.id)
      .single();

    if (userError) {
      return {
        errors: { submit: "Error al cargar perfil de usuario" },
      };
    }

    // 5. Redirigir según flag password_changed
    if (!userData?.password_changed) {
      redirect("/auth/change-password");
    } else {
      redirect("/catalogo");
    }
  } catch (err) {
    console.error("[signIn] Error:", err);
    return {
      errors: { submit: "Error al procesar. Intentá de nuevo." },
    };
  }
}
