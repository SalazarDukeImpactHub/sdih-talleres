"use client";

import React, { useState } from "react";
import { AprendizajeContent } from "@/lib/schemas/section-content";
import { Markdown } from "../Markdown";

/**
 * AprendizajeSection Component — Learning carousel with slides, notes, and PDF
 *
 * Design: D-4 (Client Component), D-8
 * - Single slide carousel (state: slideIndex)
 * - Slide content: title, body, kicker, optional notes
 * - Notes toggle button + fade-in animation
 * - Prev/next buttons (disabled at edges)
 * - Slide counter "1 of X"
 * - Optional PDF download button
 * - Animations: sdRise on mount, fade-in on notes toggle
 *
 * Props:
 * @param content Parsed AprendizajeContent from Zod schema
 */

interface AprendizajeSectionProps {
  content: AprendizajeContent;
}

export function AprendizajeSection({ content }: AprendizajeSectionProps) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [notesOpen, setNotesOpen] = useState(false);

  const totalSlides = content.slides.length;
  const currentSlide = content.slides[slideIndex];
  const isFirstSlide = slideIndex === 0;
  const isLastSlide = slideIndex === totalSlides - 1;

  const handlePrev = () => {
    if (!isFirstSlide) {
      setSlideIndex(slideIndex - 1);
    }
  };

  const handleNext = () => {
    if (!isLastSlide) {
      setSlideIndex(slideIndex + 1);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      {/* Header */}
      <h1 className="text-4xl md:text-5xl font-bold font-display text-text-primary mb-8">
        {content.title}
      </h1>

      {/* Carousel Container */}
      <div className="bg-gradient-to-br from-navy-700 to-navy-800 border border-navy-600 rounded-lg p-8 md:p-12 mb-8 animate-[sdRise_0.6s_ease-out]">
        {/* Slide Content */}
        <div className="min-h-[300px] flex flex-col justify-between">
          {/* Kicker */}
          <div className="text-sm font-semibold text-cyan mb-4 uppercase tracking-wider">
            {currentSlide.kicker}
          </div>

          {/* Slide Title */}
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-6">
            {currentSlide.title}
          </h2>

          {/* Slide Body — render markdown (bold, italic, listas, tablas) */}
          <div className="text-base md:text-lg mb-8">
            <Markdown>{currentSlide.body}</Markdown>
          </div>

          {/* Notes Section (conditional) */}
          {currentSlide.notes && (
            <div className="mt-6">
              <button
                onClick={() => setNotesOpen(!notesOpen)}
                className="text-sm font-semibold text-magenta hover:text-cyan transition-colors mb-2"
                aria-expanded={notesOpen}
              >
                {notesOpen ? "Ocultar notas" : "Ver notas"}
              </button>

              {notesOpen && (
                <div
                  className="mt-3 p-4 bg-navy-600/50 border border-navy-500 rounded text-sm italic animate-[fadeIn_0.3s_ease-in]"
                >
                  <Markdown>{currentSlide.notes}</Markdown>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="mt-8 pt-8 border-t border-navy-500 flex items-center justify-between gap-4">
          {/* Prev Button */}
          <button
            onClick={handlePrev}
            disabled={isFirstSlide}
            className={`px-4 py-2 rounded-md font-semibold transition-all duration-200 ${
              isFirstSlide
                ? "bg-navy-600 text-text-muted cursor-not-allowed opacity-50"
                : "bg-cyan text-navy-900 hover:bg-magenta"
            }`}
            aria-label="Diapositiva anterior"
          >
            ← Anterior
          </button>

          {/* Slide Counter */}
          <div className="text-center text-sm font-semibold text-text-secondary">
            <span className="text-cyan">{slideIndex + 1}</span>
            <span> de {totalSlides}</span>
          </div>

          {/* Next Button */}
          <button
            onClick={handleNext}
            disabled={isLastSlide}
            className={`px-4 py-2 rounded-md font-semibold transition-all duration-200 ${
              isLastSlide
                ? "bg-navy-600 text-text-muted cursor-not-allowed opacity-50"
                : "bg-cyan text-navy-900 hover:bg-magenta"
            }`}
            aria-label="Siguiente diapositiva"
          >
            Siguiente →
          </button>
        </div>

        {/* PDF Download Button (if available) */}
        {content.pdf_url && (
          <div className="mt-6 pt-6 border-t border-navy-500">
            <a
              href={content.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-magenta text-navy-900 rounded-md font-semibold hover:bg-cyan transition-colors"
              aria-label="Descargar PDF"
            >
              <span>📥</span>
              <span>Descargar PDF</span>
            </a>
          </div>
        )}
      </div>

      {/* Dot Indicators */}
      <div className="flex justify-center gap-2 mt-8">
        {Array.from({ length: totalSlides }).map((_, i) => (
          <button
            key={i}
            onClick={() => setSlideIndex(i)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i === slideIndex
                ? "bg-cyan w-6"
                : "bg-navy-600 hover:bg-navy-500"
            }`}
            aria-label={`Ir a diapositiva ${i + 1}`}
            aria-current={i === slideIndex ? "true" : undefined}
          />
        ))}
      </div>
    </div>
  );
}
