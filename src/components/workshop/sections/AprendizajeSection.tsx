"use client";

import React, { useEffect, useRef, useState } from "react";
import { AprendizajeContent } from "@/lib/schemas/section-content";
import { Markdown, InlineMarkdown } from "../Markdown";

/**
 * AprendizajeSection — carrusel de diapositivas de aprendizaje.
 *
 * Rediseño visual (v2):
 * - Barra de progreso de lectura arriba (avance del carrusel)
 * - Acento de color que ROTA por diapositiva → cada slide se ve distinto,
 *   mitiga la sensación de "muro de texto" repetido
 * - Medida de lectura acotada (prose) → líneas más cortas, menos densas
 * - Navegación por teclado (← →) + scroll al tope al cambiar de slide
 * - Kicker como pill de color, jerarquía de título más clara
 */

interface AprendizajeSectionProps {
  content: AprendizajeContent;
}

// Paleta de acentos que rota por diapositiva. Cada uno trae las clases ya
// resueltas (Tailwind no puede interpolar nombres dinámicos en build).
const ACCENTS = [
  {
    text: "text-cyan",
    bgSoft: "bg-cyan/10",
    ring: "ring-cyan/40",
    border: "border-cyan/40",
    bar: "from-cyan to-cyan/40",
    dot: "bg-cyan",
    glow: "rgba(25,198,230,0.12)",
  },
  {
    text: "text-magenta",
    bgSoft: "bg-magenta/10",
    ring: "ring-magenta/40",
    border: "border-magenta/40",
    bar: "from-magenta to-magenta/40",
    dot: "bg-magenta",
    glow: "rgba(217,70,239,0.12)",
  },
  {
    text: "text-lime",
    bgSoft: "bg-lime/10",
    ring: "ring-lime/40",
    border: "border-lime/40",
    bar: "from-lime to-lime/40",
    dot: "bg-lime",
    glow: "rgba(163,230,53,0.12)",
  },
  {
    text: "text-orange",
    bgSoft: "bg-orange/10",
    ring: "ring-orange/40",
    border: "border-orange/40",
    bar: "from-orange to-orange/40",
    dot: "bg-orange",
    glow: "rgba(255,122,26,0.12)",
  },
] as const;

export function AprendizajeSection({ content }: AprendizajeSectionProps) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [notesOpen, setNotesOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const totalSlides = content.slides.length;
  const currentSlide = content.slides[slideIndex];
  const isFirstSlide = slideIndex === 0;
  const isLastSlide = slideIndex === totalSlides - 1;
  const accent = ACCENTS[slideIndex % ACCENTS.length];
  const progress = totalSlides > 1 ? (slideIndex / (totalSlides - 1)) * 100 : 100;

  const goTo = (i: number) => {
    const next = Math.max(0, Math.min(totalSlides - 1, i));
    setSlideIndex(next);
    setNotesOpen(false);
  };

  // Scroll al tope de la tarjeta al cambiar de slide (comodidad de lectura)
  useEffect(() => {
    cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [slideIndex]);

  // Navegación por teclado
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goTo(slideIndex + 1);
      if (e.key === "ArrowLeft") goTo(slideIndex - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slideIndex, totalSlides]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
      {/* Header + barra de progreso */}
      <div ref={cardRef} className="scroll-mt-6 mb-6">
        <h1 className="text-3xl md:text-4xl font-bold font-display text-text-primary mb-4">
          {content.title}
        </h1>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-navy-600">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${accent.bar} transition-all duration-500 ease-out`}
            style={{ width: `${Math.max(progress, 4)}%` }}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Tarjeta de diapositiva */}
      <div
        key={slideIndex}
        className={`relative overflow-hidden rounded-2xl border ${accent.border} bg-gradient-to-br from-navy-700 to-navy-800 p-6 md:p-10 animate-[sdRise_0.4s_ease-out]`}
      >
        {/* Glow decorativo del acento */}
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle, ${accent.glow}, transparent 70%)` }}
          aria-hidden="true"
        />

        <div className="relative">
          {/* Kicker pill */}
          <div
            className={`mb-5 inline-flex items-center gap-2 rounded-full ${accent.bgSoft} px-3 py-1 text-xs font-bold uppercase tracking-wider ${accent.text}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${accent.dot}`} />
            {currentSlide.kicker}
          </div>

          {/* Título — InlineMarkdown para no mostrar asteriscos de *cursiva* */}
          <h2 className="mb-6 text-2xl md:text-3xl font-bold leading-tight text-text-primary">
            <InlineMarkdown>{currentSlide.title}</InlineMarkdown>
          </h2>

          {/* Cuerpo — medida acotada para lectura cómoda */}
          <div className="text-base md:text-lg">
            <Markdown>{currentSlide.body}</Markdown>
          </div>

          {/* Notas (opcional) */}
          {currentSlide.notes && (
            <div className="mt-6">
              <button
                onClick={() => setNotesOpen(!notesOpen)}
                className={`inline-flex items-center gap-1.5 text-sm font-semibold ${accent.text} transition-opacity hover:opacity-80`}
                aria-expanded={notesOpen}
              >
                <span className={`transition-transform ${notesOpen ? "rotate-90" : ""}`}>▸</span>
                {notesOpen ? "Ocultar notas" : "Ver notas del facilitador"}
              </button>

              {notesOpen && (
                <div className="mt-3 rounded-lg border border-navy-500 bg-navy-600/40 p-4 text-sm animate-[fadeIn_0.3s_ease-in]">
                  <Markdown>{currentSlide.notes}</Markdown>
                </div>
              )}
            </div>
          )}

          {/* PDF (si existe) */}
          {content.pdf_url && (
            <div className="mt-6 border-t border-navy-500 pt-6">
              <a
                href={content.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 rounded-lg border ${accent.border} px-4 py-2 text-sm font-semibold ${accent.text} transition-colors hover:bg-white/5`}
              >
                ↓ Descargar PDF
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Controles */}
      <div className="mt-6 flex items-center justify-between gap-4">
        <button
          onClick={() => goTo(slideIndex - 1)}
          disabled={isFirstSlide}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
            isFirstSlide
              ? "cursor-not-allowed bg-navy-700 text-text-muted opacity-40"
              : "bg-navy-700 text-text-primary hover:bg-navy-600"
          }`}
          aria-label="Diapositiva anterior"
        >
          ← Anterior
        </button>

        <span className="text-sm font-medium text-text-secondary">
          <span className={accent.text}>{slideIndex + 1}</span> / {totalSlides}
        </span>

        <button
          onClick={() => goTo(slideIndex + 1)}
          disabled={isLastSlide}
          className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all ${
            isLastSlide
              ? "cursor-not-allowed bg-navy-700 text-text-muted opacity-40"
              : "bg-cyan text-navy-900 hover:brightness-110"
          }`}
          aria-label="Siguiente diapositiva"
        >
          Siguiente →
        </button>
      </div>

      {/* Indicadores de puntos — compactos, scroll horizontal si son muchos */}
      <div className="mt-6 flex flex-wrap justify-center gap-1.5">
        {Array.from({ length: totalSlides }).map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === slideIndex
                ? `w-6 ${ACCENTS[i % ACCENTS.length].dot}`
                : "w-1.5 bg-navy-600 hover:bg-navy-500"
            }`}
            aria-label={`Ir a diapositiva ${i + 1}`}
            aria-current={i === slideIndex ? "true" : undefined}
          />
        ))}
      </div>

      {/* Hint de teclado (desktop) */}
      <p className="mt-4 hidden text-center text-xs text-text-muted md:block">
        Usá las flechas ← → del teclado para navegar
      </p>
    </div>
  );
}
