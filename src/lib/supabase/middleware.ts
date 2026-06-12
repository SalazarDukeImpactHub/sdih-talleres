import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";

/**
 * Refresca la sesión de Supabase en cada request y devuelve el usuario actual.
 * Se invoca desde middleware.ts en la raíz de src/.
 * Sin esto, las cookies expiran y el usuario queda desautenticado.
 *
 * Devuelve { response, user } para que el middleware raíz pueda decidir
 * redirects con el usuario REAL — nunca adivinando nombres de cookies
 * (el nombre real es sb-<project-ref>-auth-token y puede venir en chunks,
 * así que chequear cookies por nombre fijo es un bug garantizado).
 */
export async function updateSession(request: NextRequest): Promise<{
  response: NextResponse;
  user: User | null;
}> {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
