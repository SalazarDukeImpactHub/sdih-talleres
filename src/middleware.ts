import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Middleware raíz para manejar sesión Supabase.
 * Se ejecuta en CADA request antes de ser procesado por Next.js.
 */
export async function middleware(request: NextRequest) {
  // 1. Refrescar sesión Supabase (actualizar cookies expiradas)
  // updateSession() lee la sesión y popula las cookies del request/response
  const response = await updateSession(request);

  const pathname = request.nextUrl.pathname;

  // 2. Rutas públicas — permitir acceso sin validación de sesión
  const publicRoutes = ["/", "/auth/login", "/restricted"];
  if (publicRoutes.includes(pathname)) {
    return response;
  }

  // 3. Para rutas autenticadas, validar que existe una sesión activa
  // Usamos presencia de cookie de autenticación de Supabase como proxy
  // (Supabase SSR v0.12 no expone request.auth directamente en middleware)
  const protectedRoutes = ["/catalogo", "/auth/change-password"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    // Verificar si hay sesión activa (proxy: presencia de cookie auth)
    const hasSession = request.cookies.has("sb-auth-token");

    if (!hasSession) {
      // Redirigir silenciosamente a login (sin notificación flash)
      const loginUrl = new URL("/auth/login", request.url);
      const redirectResponse = new Response(null, {
        status: 307,
        headers: {
          Location: loginUrl.toString(),
        },
      });
      return redirectResponse;
    }

    // NOTA: El chequeo de password_changed se hace en Server Components/Actions
    // (no es posible hacerlo aquí en middleware con Supabase SSR v0.12)
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
