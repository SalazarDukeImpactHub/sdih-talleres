"use client";

import React, { useState, useMemo } from "react";
import { GlosarioContent } from "@/lib/schemas/section-content";

/**
 * GlosarioSection Component — Glossary with search, category filter, and flashcards
 *
 * Design: D-4 (Client Component), D-10
 * - Search input: live filter by term or definition
 * - Category filter buttons: toggle to filter by single category
 * - Flashcard grid: 2x2 or 3x3 responsive
 * - Card click: flip animation (CSS 3D, sdFlip keyframe) to reveal definition
 * - Empty state if no results
 * - Term count badge
 *
 * Props:
 * @param content Parsed GlosarioContent from Zod schema
 * @param glossaryTerms Array of glossary term records from DB
 */

interface GlosarioSectionProps {
  content: GlosarioContent;
  glossaryTerms: Array<{
    id: string;
    term: string;
    definition: string;
    category: string;
  }>;
}

interface FlippedCards {
  [cardId: string]: boolean;
}

export function GlosarioSection({ content, glossaryTerms }: GlosarioSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [flipped, setFlipped] = useState<FlippedCards>({});

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set(glossaryTerms.map((term) => term.category));
    return Array.from(cats).sort();
  }, [glossaryTerms]);

  // Filter terms based on search and category
  const filteredTerms = useMemo(() => {
    return glossaryTerms.filter((term) => {
      const matchesSearch =
        term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
        term.definition.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || term.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [glossaryTerms, searchQuery, selectedCategory]);

  const toggleFlip = (cardId: string) => {
    setFlipped((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  };

  const toggleCategory = (category: string) => {
    setSelectedCategory(selectedCategory === category ? null : category);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
      {/* Header */}
      <h1 className="text-4xl md:text-5xl font-bold font-display text-text-primary mb-8">
        {content.title}
      </h1>

      {/* Search Input */}
      <div className="mb-8">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={content.search_placeholder}
          className="w-full px-4 py-3 bg-navy-700 border border-navy-600 rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan transition-all"
          aria-label="Buscar término o definición"
        />
      </div>

      {/* Category Filter Buttons */}
      {categories.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => toggleCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                selectedCategory === category
                  ? "bg-cyan text-navy-900"
                  : "bg-navy-700 text-text-secondary border border-navy-600 hover:border-cyan hover:text-cyan"
              }`}
              aria-pressed={selectedCategory === category}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {/* Term Count */}
      <div className="mb-6 text-sm text-text-secondary">
        <span className="text-cyan font-semibold">{filteredTerms.length}</span>
        <span> término{filteredTerms.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Flashcards Grid */}
      {filteredTerms.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredTerms.map((term) => {
            const isFlipped = flipped[term.id] || false;

            return (
              <button
                key={term.id}
                onClick={() => toggleFlip(term.id)}
                className="relative h-48 cursor-pointer perspective"
                aria-label={`Tarjeta: ${term.term}. ${isFlipped ? "Click para ver término" : "Click para ver definición"}`}
                style={{
                  perspective: "1000px",
                } as React.CSSProperties}
              >
                {/* Card container with 3D flip */}
                <div
                  className="relative w-full h-full transition-transform duration-500"
                  style={{
                    transformStyle: "preserve-3d",
                    transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                  } as React.CSSProperties}
                >
                  {/* Front side (term) */}
                  <div
                    className="absolute inset-0 w-full h-full bg-gradient-to-br from-navy-700 to-navy-800 border border-cyan rounded-lg p-6 flex flex-col items-center justify-center text-center"
                    style={{
                      backfaceVisibility: "hidden",
                    } as React.CSSProperties}
                  >
                    <h3 className="text-xl font-bold text-cyan mb-2">
                      {term.term}
                    </h3>
                    <div className="text-xs px-2 py-1 rounded-full bg-cyan/20 text-cyan">
                      {term.category}
                    </div>
                  </div>

                  {/* Back side (definition) */}
                  <div
                    className="absolute inset-0 w-full h-full bg-gradient-to-br from-magenta/20 to-cyan/20 border border-magenta rounded-lg p-6 flex flex-col items-center justify-center text-center"
                    style={{
                      backfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                    } as React.CSSProperties}
                  >
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {term.definition}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            No encontramos términos
          </h3>
          <p className="text-text-secondary">
            Intenta ajustar tu búsqueda o cambiar los filtros.
          </p>
        </div>
      )}
    </div>
  );
}
