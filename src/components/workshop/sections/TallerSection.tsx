"use client";

import React, { useState } from "react";
import { TallerContent } from "@/lib/schemas/section-content";
import { Exercise, ExerciseProgress } from "@/lib/schemas/exercise";
import { ExerciseCard } from "../ExerciseCard";
import { Markdown } from "../Markdown";
import { VideoEmbed } from "../VideoEmbed";

/**
 * TallerSection Component — Exercises section
 *
 * Design Decision D-6:
 * - Converted to Client Component to manage exercise state + interactivity
 * - Change 3: Placeholder only (title + instructions)
 * - Change 4a: Renders exercises with ExerciseCard, manages textarea state locally
 * - Change 4b: Adds onExerciseUpdate callback for parent's debounce/retry logic
 *
 * Props:
 * @param content Parsed TallerContent from Zod schema
 * @param exercises Array of Exercise records (fetched in page.tsx)
 * @param exerciseProgress Map of exercise_id → ExerciseProgress (for O(1) lookup)
 * @param onExerciseUpdate Optional callback when exercise state changes
 */

interface TallerSectionProps {
  content: TallerContent;
  exercises?: Exercise[];
  exerciseProgress?: Record<string, ExerciseProgress>;
  onExerciseUpdate?: (exerciseId: string, status: string) => void;
}

export function TallerSection({
  content,
  exercises = [],
  exerciseProgress = {},
  onExerciseUpdate,
}: TallerSectionProps) {
  // Local state for textarea values (keyed by exercise_id)
  // In 4a: just tracks local textarea value, no autosave
  // In 4b: becomes part of the debounce + retry flow
  const [responseValues, setResponseValues] = useState<
    Record<string, string>
  >(
    exercises.reduce(
      (acc, ex) => {
        acc[ex.id] = exerciseProgress?.[ex.id]?.user_response_text || "";
        return acc;
      },
      {} as Record<string, string>
    )
  );

  const handleResponseChange = (exerciseId: string, newResponse: string) => {
    setResponseValues((prev) => ({
      ...prev,
      [exerciseId]: newResponse,
    }));
    // In 4b: this will trigger saveWithRetry via parent callback
    onExerciseUpdate?.(exerciseId, "in_progress");
  };

  const handleMarkDone = (exerciseId: string) => {
    // In 4b: this will call saveWithRetry with status='done'
    // For now in 4a: just update local state
    onExerciseUpdate?.(exerciseId, "done");
  };

  // Sort exercises by order
  const sortedExercises = [...exercises].sort((a, b) => a.order - b.order);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      {/* Header */}
      <h1 className="text-4xl md:text-5xl font-bold font-display text-text-primary mb-4">
        {content.title}
      </h1>

      {/* Video del taller (opcional) — sólo aparece si el admin definió video_url */}
      {content.video_url && (
        <div className="mb-8">
          <VideoEmbed url={content.video_url} title={`${content.title} — video explicativo`} />
        </div>
      )}

      {/* Instructions */}
      <div className="bg-navy-700 border border-navy-600 rounded-lg p-6 md:p-8 mb-8">
        <div className="text-base md:text-lg">
          <Markdown>{content.instructions}</Markdown>
        </div>
      </div>

      {/* Exercises or Placeholder */}
      {sortedExercises.length === 0 ? (
        <div className="bg-gradient-to-br from-magenta/10 to-cyan/10 border border-magenta/30 rounded-lg p-8 md:p-12 text-center">
          <div className="text-5xl mb-4">🚀</div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            Ejercicios próximamente
          </h2>
          <p className="text-text-secondary">
            {content.placeholder ||
              "Los ejercicios estarán disponibles en la siguiente actualización. Mientras tanto, practica con los materiales del Aprendizaje."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedExercises.map((exercise, index) => {
            const progress = exerciseProgress[exercise.id];
            return (
              <ExerciseCard
                key={exercise.id}
                exerciseNumber={index + 1}
                exercise={exercise}
                userResponse={responseValues[exercise.id] || ""}
                status={progress?.status || "pending"}
                onResponseChange={handleResponseChange}
                onMarkDone={handleMarkDone}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
