"use server";

import { changePasswordSchema } from "@/lib/schemas/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Server Action changePassword — valida nueva contraseña y actualiza en Supabase.
 *
 * IMPORTANTE: redirect() de Next.js debe quedar FUERA del try/catch (ver nota en
 * el sibling login/actions.ts). Por eso resolvemos toda la lógica primero,
 * después llamamos a redirect afuera.
 */
export async function changePassword(
  _prevState: { errors?: Record<string, string | string[]> },
  formData: FormData
): Promise<{ errors?: Record<string, string | string[]> }> {
  // 1. Validar input con Zod
  const result = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
    };
  }

  try {
    const supabase = await createClient();

    // 2. Obtener usuario actual
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return {
        errors: { submit: "No hay sesión activa. Ingresá nuevamente." },
      };
    }

    // 3. Re-verificar password actual (seguridad: NO confiar solo en sesión)
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: result.data.currentPassword,
    });

    if (verifyError) {
      return {
        errors: { currentPassword: "Contraseña actual incorrecta" },
      };
    }

    // 4. Actualizar password en auth.users
    const { error: updateError } = await supabase.auth.updateUser({
      password: result.data.newPassword,
    });

    if (updateError) {
      console.error("[changePassword] updateUser error:", updateError);
      return {
        errors: { submit: "Error al actualizar contraseña. Intentá de nuevo." },
      };
    }

    // 5. Actualizar flag password_changed en public.users
    const { error: dbError } = await supabase
      .from("users")
      .update({ password_changed: true })
      .eq("id", user.id);

    if (dbError) {
      console.error("[changePassword] db update error:", dbError);
      return {
        errors: { submit: "Error al actualizar perfil. Intentá de nuevo." },
      };
    }
  } catch (err) {
    console.error("[changePassword] Error:", err);
    return {
      errors: { submit: "Error al procesar. Intentá de nuevo." },
    };
  }

  // 6. Redirect AFUERA del try/catch para que Next intercepte NEXT_REDIRECT.
  redirect("/catalogo");
}
