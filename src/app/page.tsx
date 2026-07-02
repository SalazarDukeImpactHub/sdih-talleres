import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { fetchPublicWorkshops } from "./vitrina-actions";
import { Vitrina } from "@/components/catalog/Vitrina";

export const dynamic = "force-dynamic";

/**
 * Página root "/" — vitrina pública + router de sesión.
 *
 * - Visitante SIN sesión → ve la vitrina pública (talleres, sin login).
 * - Con sesión + password_changed = false → /auth/change-password
 * - Con sesión + role = admin → /admin/talleres
 * - Con sesión + role = alumno → /catalogo
 */
export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Sin sesión → vitrina pública
  if (!user) {
    const workshops = await fetchPublicWorkshops();
    return (
      <Vitrina
        workshops={workshops}
        whatsappNumber={process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}
      />
    );
  }

  // Con sesión → llevar a su área según flag y rol
  const { data: userData } = await supabase
    .from("users")
    .select("password_changed, role")
    .eq("id", user.id)
    .single();

  if (!userData?.password_changed) {
    redirect("/auth/change-password");
  } else if (userData.role === "admin") {
    redirect("/admin/talleres");
  } else {
    redirect("/catalogo");
  }
}
