"use client";

import { useMemo, useState } from "react";
import { WorkshopCard } from "./WorkshopCard";

interface CatalogWorkshop {
  id: string;
  slug: string;
  title: string;
  description: string;
  instructor: string;
  date_live: string | null;
  duration_min: number | null;
  status: "disponible" | "en vivo" | "próximamente" | "completado";
  category: string | null;
  cover_image: string | null;
  is_unlocked: boolean;
}

interface CatalogViewProps {
  workshops: CatalogWorkshop[];
}

/**
 * CatalogView — grid de talleres con filtro por categoría.
 * Los chips se computan dinámicamente de las categorías presentes en los datos:
 * agregar una categoría nueva en admin crea su chip automáticamente.
 * Talleres sin categoría solo aparecen en "Todos".
 */
export function CatalogView({ workshops }: CatalogViewProps) {
  const [activeCategory, setActiveCategory] = useState<string>("Todos");

  const categories = useMemo(() => {
    const unique = new Set<string>();
    for (const w of workshops) {
      if (w.category) unique.add(w.category);
    }
    return ["Todos", ...Array.from(unique).sort()];
  }, [workshops]);

  const filtered = useMemo(
    () =>
      activeCategory === "Todos"
        ? workshops
        : workshops.filter((w) => w.category === activeCategory),
    [workshops, activeCategory]
  );

  return (
    <div>
      {/* Chips de categoría — solo si hay categorías definidas */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-6" data-testid="category-filters">
          {categories.map((cat) => {
            const isActive = cat === activeCategory;
            const count =
              cat === "Todos"
                ? workshops.length
                : workshops.filter((w) => w.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-cyan text-navy-900"
                    : "bg-navy-700 text-text-secondary border border-navy-600 hover:border-cyan/60 hover:text-text-primary"
                }`}
                data-testid={`filter-chip-${cat}`}
                aria-pressed={isActive}
              >
                {cat} <span className="opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="bg-navy-700 border border-navy-600 rounded-lg p-6 text-text-secondary text-center">
          No hay talleres en esta categoría.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((workshop) => (
            <WorkshopCard
              key={workshop.id}
              id={workshop.id}
              slug={workshop.slug}
              title={workshop.title}
              description={workshop.description}
              instructor={workshop.instructor}
              date_live={workshop.date_live}
              duration_min={workshop.duration_min}
              status={workshop.status}
              cover_image={workshop.cover_image}
              isUnlocked={workshop.is_unlocked}
              isAccessRedeemed={workshop.is_unlocked}
            />
          ))}
        </div>
      )}
    </div>
  );
}
