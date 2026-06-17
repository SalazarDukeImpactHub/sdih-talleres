import { WorkshopForm } from "@/components/admin/WorkshopForm";
import { fetchWorkshopById } from "../actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Página para editar un taller existente.
 * Server Component que obtiene el taller por ID y renderiza WorkshopForm en modo 'edit'.
 * El componente maneja el redirect automáticamente después de guardar.
 */
export default async function EditWorkshopPage({ params }: PageProps) {
  const { id } = await params;

  // Fetch workshop data
  const workshop = await fetchWorkshopById(id);

  if (!workshop) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Taller no encontrado</h1>
          <p className="mt-4 text-gray-600">El taller que buscás no existe.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Editar Taller</h1>
        <p className="text-gray-600 mb-6">{workshop.title}</p>

        <div className="bg-white rounded-lg shadow p-6">
          <WorkshopForm
            mode="edit"
            initialData={{
              id: workshop.id,
              title: workshop.title,
              description: workshop.description,
              instructor: workshop.instructor,
              date_live: workshop.date_live,
              duration: workshop.duration_min,
              prerequisites: workshop.prerequisites,
              status: workshop.status,
              cover_image: workshop.cover_image,
            }}
          />
        </div>
      </div>
    </div>
  );
}
