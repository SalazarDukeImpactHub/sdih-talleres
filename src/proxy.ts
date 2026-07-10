import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Proxy raíz (Next.js 16+) para manejar la sesión Supabase.
 * Reemplaza al antiguo `middleware.ts`, que fue deprecado a favor de `proxy.ts`
 * en Next.js 16. La API y los matchers son idénticos — sólo cambia el nombre.
 *
 * Responsabilidad acotada (design D-2 del auth-and-shell):
 * - Refrescar la sesión (cookies) en cada request
 * - Bloquear rutas protegidas sin sesión → silent redirect a /auth/login
 * - El chequeo de password_changed vive en Server Components/Actions,
 *   NO acá (Supabase SSR v0.12 no expone datos de public.users en proxy)
 */
export async function proxy(request: NextRequest) {
  // 1. Refrescar sesión Supabase y obtener el usuario REAL.
  // Nunca validar sesión por nombre de cookie: el nombre es
  // sb-<project-ref>-auth-token (dinámico por proyecto, a veces en chunks).
  const { response, user } = await updateSession(request);

  const pathname = request.nextUrl.pathname;

  // 2. Rutas públicas — permitir acceso sin validación de sesión
  // (incluye la vitrina "/" y el autoregistro)
  const publicRoutes = ["/", "/auth/login", "/auth/registro", "/restricted"];
  if (publicRoutes.includes(pathname)) {
    return response;
  }

  // 3. Para rutas protegidas, exigir sesión activa.
  // Incluye /admin y /taller como defensa-en-profundidad: los layouts ya
  // guardan server-side, pero cortar en el borde evita render innecesario.
  // El chequeo de ROL admin sigue viviendo en el layout/requireAdmin — el
  // proxy no puede leer public.users (Supabase SSR no lo expone acá).
  const protectedRoutes = [
    "/catalogo",
    "/auth/change-password",
    "/admin",
    "/taller",
  ];
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
 * Configuración del matcher: define qué rutas pasan por el proxy.
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
