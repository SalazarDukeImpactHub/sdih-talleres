import { fetchWorkshops } from "./actions";
import { WorkshopCard } from "@/components/catalog/WorkshopCard";
import { Suspense } from "react";

/**
 * Página de catálogo — grid responsivo de talleres.
 * Server Component que fetcha talleres con estado de desbloqueo del usuario actual.
 * Grid layout: 1 col 360px, 2 col 768px, 3 col 1024px, 4 col 1440px.
 */

async function CatalogGrid() {
  const result = await fetchWorkshops();

  if (!result.success) {
    return (
      <div className="bg-navy-700 border border-red-500/30 rounded-lg p-6 text-red-400 text-center">
        Error al cargar talleres: {result.error}
      </div>
    );
  }

  const workshops = result.workshops || [];

  if (workshops.length === 0) {
    return (
      <div className="bg-navy-700 border border-navy-600 rounded-lg p-6 text-text-secondary text-center">
        No hay talleres disponibles en este momento.
      </div>
    );
  }

  interface Workshop {
    id: string;
    slug: string;
    title: string;
    description: string;
    instructor: string;
    date_live: string | null;
    duration_min: number | null;
    status: string; // DB puede retornar string que se parsea en componente
    cover_image: string | null;
    is_unlocked: boolean;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {workshops.map((workshop: Workshop) => (
        <WorkshopCard
          key={workshop.id}
          id={workshop.id}
          slug={workshop.slug}
          title={workshop.title}
          description={workshop.description}
          instructor={workshop.instructor}
          date_live={workshop.date_live}
          duration_min={workshop.duration_min}
          status={
            workshop.status as
              | "disponible"
              | "en vivo"
              | "próximamente"
              | "completado"
          }
          cover_image={workshop.cover_image}
          isUnlocked={workshop.is_unlocked}
          isAccessRedeemed={workshop.is_unlocked}
        />
      ))}
    </div>
  );
}

function CatalogSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="bg-navy-800 rounded-lg h-64 animate-pulse"
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

export default function CatalogPage() {
  return (
    <div className="min-h-screen bg-navy-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary font-display mb-2">
            Catálogo de Talleres
          </h1>
          <p className="text-text-secondary">
            Explorá nuestros talleres y desbloqueá acceso con tu clave.
          </p>
        </div>

        {/* Grid with Suspense */}
        <Suspense fallback={<CatalogSkeleton />}>
          <CatalogGrid />
        </Suspense>
      </div>
    </div>
  );
}
