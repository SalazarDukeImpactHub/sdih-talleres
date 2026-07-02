import { fetchAllKeys, fetchAssignOptions } from "./actions";
import { KeysPanel } from "@/components/admin/KeysPanel";

export const dynamic = "force-dynamic";

/**
 * Página /admin/claves — Panel global de claves de acceso.
 *
 * Server Component que:
 * 1. Fetch todas las claves (todos los talleres) vía fetchAllKeys
 * 2. Fetch opciones de asignación (alumnos + talleres) vía fetchAssignOptions
 * 3. Pasa todo a KeysPanel (Client Component: filtros + asignación)
 *
 * Guard está en el layout del grupo admin — no hay acceso si no sos admin.
 */
export default async function AdminClavesPage() {
  const [keys, options] = await Promise.all([
    fetchAllKeys(),
    fetchAssignOptions(),
  ]);

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div className="text-sm text-gray-600">
        <span>Admin</span> <span className="mx-2">/</span>{" "}
        <span className="font-semibold text-gray-900">Claves</span>
      </div>

      <KeysPanel
        keys={keys}
        students={options.students}
        workshops={options.workshops}
      />
    </div>
  );
}
