import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Middleware raíz para manejar sesión Supabase.
 * Se ejecuta en CADA request antes de ser procesado por Next.js.
 *
 * Responsabilidad acotada (design D-2):
 * - Refrescar la sesión (cookies) en cada request
 * - Bloquear rutas protegidas sin sesión → silent redirect a /auth/login
 * - El chequeo de password_changed vive en Server Components/Actions,
 *   NO acá (Supabase SSR v0.12 no expone datos de public.users en middleware)
 */
export async function middleware(request: NextRequest) {
  // 1. Refrescar sesión Supabase y obtener el usuario REAL.
  // Nunca validar sesión por nombre de cookie: el nombre es
  // sb-<project-ref>-auth-token (dinámico por proyecto, a veces en chunks).
  const { response, user } = await updateSession(request);

  const pathname = request.nextUrl.pathname;

  // 2. Rutas públicas — permitir acceso sin validación de sesión
  const publicRoutes = ["/", "/auth/login", "/restricted"];
  if (publicRoutes.includes(pathname)) {
    return response;
  }

  // 3. Para rutas protegidas, exigir sesión activa
  const protectedRoutes = ["/catalogo", "/auth/change-password"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute && !user) {
    // Silent redirect a login, preservando las cookies refrescadas
    // (si updateSession rotó tokens, perderlos acá desincroniza la sesión)
    const loginUrl = new URL("/auth/login", request.url);
    const redirectResponse = NextResponse.redirect(loginUrl);
    for (const cookie of response.cookies.getAll()) {
      redirectResponse.cookies.set(cookie);
    }
    return redirectResponse;
  }

  return response;
}

/**
 * Configuración del matcher: define qué rutas pasan por el middleware.
 * Excluye archivos estáticos y assets.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - .png, .jpg (image files en public/)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg).*)",
  ],
};
