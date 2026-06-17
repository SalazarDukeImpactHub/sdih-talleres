import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import type { ReactNode } from "react";

/**
 * Layout para la ruta (admin) — Panel de administración.
 * Guard en server-side: solo admins pueden acceder.
 *
 * Validaciones:
 * 1. Si no hay sesión → redirect /auth/login
 * 2. Si usuario.role !== 'admin' → redirect /catalogo (403)
 * 3. Si ambas OK → renderiza sidebar + children con flex layout
 */
export default async function AdminLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  // 1. Obtener usuario actual
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  // 2. Verificar que sea admin
  if (user.role !== "admin") {
    redirect("/catalogo");
  }

  // 3. Renderizar layout con sidebar + main content
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main content area */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
