import { createClient } from "@/lib/supabase/server";

/**
 * Página de catálogo — placeholder autenticado.
 * Será reemplazada por el verdadero catálogo de talleres en change 2.
 * Por ahora, solo muestra un mensaje placeholder con el nombre del usuario.
 */
export default async function CatalogPage() {
  const supabase = await createClient();

  // Obtener datos del usuario para personalización
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: userData } = await supabase
    .from("users")
    .select("name")
    .eq("id", user?.id || "")
    .single();

  const displayName = userData?.name || user?.email || "Usuario";

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-text-primary font-display mb-4">
          Catálogo de Talleres
        </h1>
        <p className="text-lg text-text-secondary mb-8">
          Hola {displayName}, bienvenido al portal SDIH Talleres.
        </p>
        <div className="bg-navy-800 border border-navy-600 rounded-lg p-6 sm:p-8">
          <p className="text-text-primary text-center py-12">
            <span className="block text-2xl font-display mb-2">📚</span>
            <span className="text-lg">
              Catálogo — próximamente en change 2
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
