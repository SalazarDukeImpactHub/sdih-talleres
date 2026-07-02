import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/shell/TopBar";
import type { ReactNode } from "react";

/**
 * Layout para rutas autenticadas ((authenticated) route group).
 * Validaciones server-side:
 * 1. Si no hay sesión → redirect /auth/login
 * 2. Si password_changed = false → redirect /auth/change-password
 * 3. Si ambas OK → renderiza TopBar + children
 */
export default async function AuthenticatedLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const supabase = await createClient();

  // 1. Obtener usuario actual
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // 2. Leer flag password_changed + role (role habilita el link al panel admin)
  const { data: userData } = await supabase
    .from("users")
    .select("password_changed, name, role")
    .eq("id", user.id)
    .single();

  if (!userData?.password_changed) {
    redirect("/auth/change-password");
  }

  return (
    <div className="min-h-screen bg-navy-900 flex flex-col">
      <TopBar
        user={{ id: user.id, email: user.email || "", name: userData?.name || "" }}
        isAdmin={userData?.role === "admin"}
      />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
