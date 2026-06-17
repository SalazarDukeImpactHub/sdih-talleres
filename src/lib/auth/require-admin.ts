import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";

/**
 * Guard para Server Components y Server Actions del admin panel.
 * Sin sesión → /auth/login. Sin rol admin → /catalogo.
 * Usa redirect() (NEXT_REDIRECT) en vez de throw para coexistir
 * con el guard del layout cuando layout y page renderizan en paralelo (Next 16).
 */
export async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  if (user.role !== "admin") {
    redirect("/catalogo");
  }

  return user;
}
