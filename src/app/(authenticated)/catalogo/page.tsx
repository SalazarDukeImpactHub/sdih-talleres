import { fetchWorkshops } from "./actions";
import { CatalogView } from "@/components/catalog/CatalogView";
import { Suspense } from "react";

/**
 * Página de catálogo — grid responsivo de talleres con filtro por categoría.
 * Server Component que fetcha talleres con estado de desbloqueo del usuario actual
 * y delega el filtrado por categoría a CatalogView (Client Component).
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
    category: string | null;
    cover_image: string | null;
    is_unlocked: boolean;
  }

  return (
    <CatalogView
      workshops={(workshops as Workshop[]).map((w) => ({
        ...w,
        status: w.status as
          | "disponible"
          | "en vivo"
          | "próximamente"
          | "completado",
      }))}
    />
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
