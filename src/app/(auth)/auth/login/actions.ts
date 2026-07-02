"use server";

import { loginSchema } from "@/lib/schemas/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Server Action signIn — valida credenciales y redirige según password_changed.
 *
 * IMPORTANTE: redirect() de Next.js tira una excepción NEXT_REDIRECT que el
 * framework debe interceptar para hacer el redirect real. Si la envolvemos en
 * try/catch, nuestro catch se la come y el redirect nunca se materializa. Por
 * eso resolvemos la ruta destino DENTRO del try/catch y llamamos a redirect()
 * AFUERA.
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

  let nextRoute: string;

  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: result.data.email,
      password: result.data.password,
    });

    if (error || !data.user?.id) {
      return {
        errors: { submit: "Credenciales inválidas" },
      };
    }

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("password_changed, role")
      .eq("id", data.user.id)
      .single();

    if (userError) {
      return {
        errors: { submit: "Error al cargar perfil de usuario" },
      };
    }

    // Admins aterrizan directo en su panel; alumnas en el catálogo.
    if (!userData?.password_changed) {
      nextRoute = "/auth/change-password";
    } else if (userData.role === "admin") {
      nextRoute = "/admin/talleres";
    } else {
      nextRoute = "/catalogo";
    }
  } catch (err) {
    console.error("[signIn] Error:", err);
    return {
      errors: { submit: "Error al procesar. Intentá de nuevo." },
    };
  }

  // Redirect AFUERA del try/catch para que Next intercepte NEXT_REDIRECT.
  redirect(nextRoute);
}
