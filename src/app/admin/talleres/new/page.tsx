import { WorkshopForm } from "@/components/admin/WorkshopForm";

/**
 * Página para crear nuevo taller.
 * Server Component que renderiza WorkshopForm en modo 'create'.
 * El componente maneja el redirect automáticamente.
 */
export default function NewWorkshopPage() {
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Crear Nuevo Taller</h1>

        <div className="bg-white rounded-lg shadow p-6">
          <WorkshopForm mode="create" />
        </div>
      </div>
    </div>
  );
}
