"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "./StatusBadge";
import { AccessKeyModal } from "./AccessKeyModal";

interface WorkshopCardProps {
  id: string;
  slug: string;
  title: string;
  description: string;
  instructor: string;
  date_live: string | null;
  duration_min: number | null;
  status: "disponible" | "en vivo" | "próximamente" | "completado";
  cover_image: string | null;
  isUnlocked: boolean;
}

/**
 * WorkshopCard — tarjeta individual de taller en el catálogo.
 * Estructura: cover image + título + descripción + instructor + fecha + badge + botón
 * Estados: desbloqueado (botón "Continuar" disabled) o bloqueado (botón "Ingresar" clickeable + modal)
 * Client Component para manejar estado del modal y refetch tras canje exitoso.
 */
export function WorkshopCard({
  id,
  title,
  description,
  instructor,
  date_live,
  duration_min,
  status,
  cover_image,
  isUnlocked: initialIsUnlocked,
}: WorkshopCardProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(initialIsUnlocked);
  const formattedDate = date_live
    ? new Date(date_live).toLocaleDateString("es-AR", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : null;

  const fallbackGradientClass =
    "bg-gradient-to-br from-navy-700 to-navy-800 relative overflow-hidden";

  const coverClasses = cover_image
    ? "bg-cover bg-center"
    : fallbackGradientClass;

  return (
    <div className="flex flex-col rounded-lg bg-navy-800 overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-200 h-full">
      {/* Cover Image or Fallback Gradient */}
      <div
        className={`w-full h-32 ${coverClasses}`}
        style={
          cover_image
            ? {
                backgroundImage: `url(${cover_image})`,
              }
            : undefined
        }
      >
        {!cover_image && (
          <div className="absolute inset-0 bg-gradient-to-br from-magenta/20 via-transparent to-cyan/20 pointer-events-none" />
        )}
      </div>

      {/* Card Content */}
      <div className="flex flex-col flex-1 p-4">
        {/* Title + Badge */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-display text-sm font-semibold text-text-primary line-clamp-2">
            {title}
          </h3>
          {!isUnlocked && (
            <div className="flex-shrink-0 text-orange mt-0.5" aria-label="Taller bloqueado">
              🔒
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-text-secondary mb-3 line-clamp-2">{description}</p>

        {/* Instructor + Duration */}
        <div className="text-xs text-text-muted mb-3 flex gap-2">
          <span>{instructor}</span>
          {duration_min && <span>•</span>}
          {duration_min && <span>{duration_min} min</span>}
        </div>

        {/* Date + Status Badge */}
        <div className="flex items-center justify-between gap-2 mb-4">
          {formattedDate && <span className="text-xs text-text-muted">{formattedDate}</span>}
          <StatusBadge status={status} />
        </div>

        {/* Button: Continuar (unlocked) or Ingresar (locked) */}
        <div className="mt-auto">
          {isUnlocked ? (
            <button
              disabled={true}
              className="w-full px-3 py-2 rounded text-xs font-semibold bg-cyan/20 text-cyan border border-cyan/30 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              title="Disponible próximamente"
              aria-label="Botón continuar (deshabilitado hasta cambio 3)"
            >
              Continuar
            </button>
          ) : (
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full px-3 py-2 rounded text-xs font-semibold bg-cyan text-navy-900 hover:bg-cyan/90 active:bg-cyan/80 transition-colors"
              aria-label={`Ingresar a ${title}`}
            >
              Ingresar
            </button>
          )}
        </div>
      </div>

      {/* AccessKeyModal — abre cuando user clickea "Ingresar" */}
      <AccessKeyModal
        isOpen={isModalOpen}
        workshopId={id}
        workshopTitle={title}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          // Tras canje exitoso: marcar como desbloqueado + refetch
          setIsUnlocked(true);
          // Refetch para garantizar consistencia de datos
          router.refresh();
        }}
      />
    </div>
  );
}
