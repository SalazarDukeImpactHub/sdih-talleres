"use server";

import { registerSchema } from "@/lib/schemas/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

/**
 * Server Action signUp — autoregistro público de una alumna.
 *
 * Flujo:
 * 1. Valida nombre + email + contraseña (con complejidad).
 * 2. supabase.auth.signUp crea el usuario (el trigger handle_new_user inserta
 *    la fila en public.users con role='alumno', password_changed=false).
 * 3. Como la alumna eligió su propia contraseña, marcamos password_changed=true
 *    (no hay que forzar cambio) y guardamos el nombre.
 * 4. Si Supabase devuelve sesión → va al catálogo. Si requiere confirmación de
 *    email → devuelve un mensaje para que revise su correo.
 *
 * redirect() va FUERA del try/catch (NEXT_REDIRECT).
 */
export async function signUp(
  _prevState: { errors?: Record<string, string | string[]>; info?: string },
  formData: FormData
): Promise<{ errors?: Record<string, string | string[]>; info?: string }> {
  const result = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  let goToCatalog = false;

  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email: result.data.email,
      password: result.data.password,
    });

    if (error) {
      // Email ya registrado u otro error de Supabase Auth
      const msg = error.message?.toLowerCase().includes("already")
        ? "Ese email ya tiene una cuenta. Probá ingresando."
        : error.message || "No pudimos crear la cuenta.";
      return { errors: { submit: msg } };
    }

    const userId = data.user?.id;

    // Ajustar perfil: nombre + password_changed=true (eligió su clave).
    if (userId) {
      const admin = await createAdminClient();
      await admin
        .from("users")
        .update({ name: result.data.name, password_changed: true })
        .eq("id", userId);
    }

    // Si hay sesión activa (confirmación de email deshabilitada) → al catálogo.
    // Si no (confirmación habilitada) → avisar que revise su correo.
    if (data.session) {
      goToCatalog = true;
    } else {
      return {
        info: "¡Cuenta creada! Revisá tu email para confirmarla y después ingresá.",
      };
    }
  } catch (err) {
    console.error("[signUp] Error:", err);
    return { errors: { submit: "Error al procesar. Intentá de nuevo." } };
  }

  if (goToCatalog) redirect("/catalogo");
  return {};
}
