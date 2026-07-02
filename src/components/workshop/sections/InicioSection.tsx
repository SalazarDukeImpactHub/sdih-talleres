import React from "react";
import { InicioContent } from "@/lib/schemas/section-content";
import { Markdown } from "../Markdown";
import { SectionIcon } from "../SectionIcon";
import { VideoEmbed } from "../VideoEmbed";

/**
 * InicioSection — bienvenida (hero) + accesos rápidos a las secciones.
 *
 * Rediseño visual (v2):
 * - Hero con eyebrow + título grande con acento en gradiente y glow suave
 * - Descripción en tarjeta con medida de lectura acotada
 * - Accesos rápidos con ícono, label, descripción corta y flecha — cada uno
 *   con su color de acento para diferenciarlos de un vistazo
 *
 * @param content Parsed InicioContent from Zod schema
 * @param onLinkClick Callback cuando se clickea un acceso rápido
 */

interface InitioSectionProps {
  content: InicioContent;
  onLinkClick?: (
    section: "aprendizaje" | "taller" | "instalacion" | "glosario"
  ) => void;
}

// Metadatos de presentación por tipo de sección (acento + descripción corta).
const LINK_META: Record<
  "aprendizaje" | "taller" | "instalacion" | "glosario",
  { desc: string; text: string; hoverBorder: string; iconBg: string }
> = {
  aprendizaje: {
    desc: "La teoría, paso a paso",
    text: "text-cyan",
    hoverBorder: "hover:border-cyan/60",
    iconBg: "bg-cyan/10",
  },
  taller: {
    desc: "Ejercicios para hacer",
    text: "text-magenta",
    hoverBorder: "hover:border-magenta/60",
    iconBg: "bg-magenta/10",
  },
  instalacion: {
    desc: "Prepará tus herramientas",
    text: "text-lime",
    hoverBorder: "hover:border-lime/60",
    iconBg: "bg-lime/10",
  },
  glosario: {
    desc: "Términos clave",
    text: "text-orange",
    hoverBorder: "hover:border-orange/60",
    iconBg: "bg-orange/10",
  },
};

export function InicioSection({ content, onLinkClick }: InitioSectionProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-14">
      {/* Hero */}
      <div className="relative mb-10 md:mb-14">
        {/* Glow decorativo */}
        <div
          className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(25,198,230,0.10), transparent 70%)",
          }}
          aria-hidden="true"
        />

        <div className="relative">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-cyan/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan animate-[sdPulse_2s_ease-in-out_infinite]" />
            Bienvenida
          </div>

          <h1 className="mb-6 text-4xl md:text-5xl font-bold font-display leading-[1.1] text-text-primary">
            {content.title}
          </h1>

          {/* Descripción en tarjeta suave, medida acotada */}
          <div className="rounded-2xl border border-navy-600 bg-navy-800/40 p-6 md:p-8">
            <div className="text-base md:text-lg">
              <Markdown>{content.description}</Markdown>
            </div>
          </div>
        </div>
      </div>

      {/* Video (opcional) */}
      {content.video_url && (
        <div className="mb-10 md:mb-14">
          <VideoEmbed url={content.video_url} title={content.title} />
        </div>
      )}

      {/* Accesos rápidos */}
      <div>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-text-muted">
          Explorá el taller
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {content.quick_links.map((link, idx) => {
            const meta = LINK_META[link.target_section];
            return (
              <button
                key={idx}
                onClick={() => onLinkClick?.(link.target_section)}
                className={`group flex items-center gap-4 rounded-xl border border-navy-600 bg-gradient-to-br from-navy-700 to-navy-800 p-5 text-left transition-all duration-300 ${meta.hoverBorder} hover:-translate-y-0.5`}
                aria-label={`Ir a ${link.label}`}
              >
                {/* Ícono en chip de color */}
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${meta.iconBg} ${meta.text} transition-transform duration-300 group-hover:scale-110`}
                >
                  <SectionIcon type={link.target_section} className="h-6 w-6" />
                </div>

                {/* Texto */}
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-text-primary">{link.label}</h3>
                  <p className="text-sm text-text-muted">{meta.desc}</p>
                </div>

                {/* Flecha */}
                <span
                  className={`shrink-0 text-lg ${meta.text} opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 -translate-x-1`}
                  aria-hidden="true"
                >
                  →
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
