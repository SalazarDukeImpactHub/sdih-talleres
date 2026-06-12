import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";

/**
 * Página de cambio de contraseña — Server Component.
 * Validaciones:
 * 1. Si no hay sesión → redirect /auth/login
 * 2. Si password_changed = true → redirect /catalogo
 * 3. Si password_changed = false → renderiza el form
 */
export default async function ChangePasswordPage() {
  const supabase = await createClient();

  // 1. Obtener usuario actual
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // 2. Leer flag password_changed de public.users
  const { data: userData } = await supabase
    .from("users")
    .select("password_changed")
    .eq("id", user.id)
    .single();

  // 3. Si ya cambió password, redirigir a catálogo
  if (userData?.password_changed) {
    redirect("/catalogo");
  }

  // 4. password_changed = false → mostrar form
  return (
    <main className="flex items-center justify-center min-h-screen bg-navy-900">
      <ChangePasswordForm />
    </main>
  );
}
