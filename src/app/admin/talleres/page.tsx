import { fetchWorkshops } from "./actions";
import { WorkshopTable } from "@/components/admin/WorkshopTable";

export const dynamic = "force-dynamic";

/**
 * Página /admin/talleres — Lista de talleres para admin.
 *
 * Server Component que:
 * 1. Fetch workshops vía Server Action (fetchWorkshops)
 * 2. Pasa data a WorkshopTable Client Component
 * 3. Renderiza breadcrumbs + title
 *
 * Nota: Marcada como force-dynamic porque fetchWorkshops requiere autenticación
 * y no puede ser prerendered estáticamente en build time.
 * Guard está en el layout del (admin) grupo — no hay acceso si no sos admin.
 */
export default async function AdminTalleresPage() {
  // Fetch workshops (sin filtro, muestra todos)
  const workshops = await fetchWorkshops();

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div className="text-sm text-gray-600">
        <span>Admin</span> <span className="mx-2">/</span> <span className="font-semibold text-gray-900">Talleres</span>
      </div>

      {/* Page title */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Talleres</h1>
        <p className="text-gray-600 mt-2">Gestiona los talleres disponibles</p>
      </div>

      {/* Workshop table (Client Component) */}
      <WorkshopTable initialWorkshops={workshops} />
    </div>
  );
}
