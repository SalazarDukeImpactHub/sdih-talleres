"use client";

import React, { useState } from "react";
import { CopyButton } from "./CopyButton";
import { Exercise } from "@/lib/schemas/exercise";

/**
 * ExerciseCard Component
 *
 * Renders a single exercise with textarea for response input and "Listo" button.
 * In 4a: basic render without autosave (just onChange callback).
 * In 4b: adds debounce, retry, state management.
 *
 * Design Decision D-2:
 * - Client Component with serializable props
 * - Manages textarea state locally (onChange updates state)
 * - Passes state to parent via onResponseChange callback (no autosave yet in 4a)
 * - "Listo" button disabled if textarea empty
 * - Status badge colors: gray (pending), cyan (in_progress), lime (done)
 *
 * @param exerciseNumber Exercise number for display (1, 2, 3, 4...)
 * @param exercise Exercise data { id, title, objective, prompt_text, ... }
 * @param userResponse Current user response text from props
 * @param status Current exercise status ('pending' | 'in_progress' | 'done')
 * @param onResponseChange Callback when textarea changes: (exerciseId, newResponse) => void
 * @param onMarkDone Callback when "Listo" button clicked
 */
interface ExerciseCardProps {
  exerciseNumber: number;
  exercise: Exercise;
  userResponse: string;
  status: "pending" | "in_progress" | "done";
  onResponseChange: (exerciseId: string, newResponse: string) => void;
  onMarkDone: (exerciseId: string) => void;
}

const statusColors: Record<"pending" | "in_progress" | "done", string> = {
  pending: "bg-gray-500 text-white",
  in_progress: "bg-cyan-400 text-navy-900",
  done: "bg-lime-400 text-navy-900",
};

const statusLabels: Record<"pending" | "in_progress" | "done", string> = {
  pending: "Pendiente",
  in_progress: "En progreso",
  done: "Hecho",
};

export function ExerciseCard({
  exerciseNumber,
  exercise,
  userResponse,
  status,
  onResponseChange,
  onMarkDone,
}: ExerciseCardProps) {
  const [localResponse, setLocalResponse] = useState(userResponse);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalResponse(newValue);
    // In 4a: just notify parent of change (no autosave yet)
    // In 4b: this will trigger debounce + saveWithRetry
    onResponseChange(exercise.id, newValue);
  };

  const handleMarkDone = () => {
    onMarkDone(exercise.id);
  };

  const isTextareaEmpty = !localResponse.trim();
  const isDisabled = status === "done";

  return (
    <div className="bg-navy-900 border border-navy-700 rounded-lg p-6 space-y-4">
      {/* Header: Number Badge + Title + Status Badge */}
      <div className="flex items-start gap-4">
        <div
          className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
            status === "done"
              ? "bg-lime-400 text-navy-900"
              : "bg-cyan-400 text-navy-900"
          }`}
        >
          {status === "done" ? "✓" : exerciseNumber}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-white">{exercise.title}</h3>
          <div
            className={`inline-block mt-2 px-3 py-1 rounded text-xs font-semibold ${statusColors[status]}`}
          >
            {statusLabels[status]}
          </div>
        </div>
      </div>

      {/* Objective with lightning icon */}
      <div className="flex items-start gap-2">
        <span className="text-xl flex-shrink-0">⚡</span>
        <p className="text-sm text-gray-300">{exercise.objective}</p>
      </div>

      {/* Prompt block with CopyButton */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-gray-300">Prompt</label>
          <CopyButton text={exercise.prompt_text} label="Copiar prompt" />
        </div>
        <div className="bg-navy-800 rounded border border-navy-700 p-4 overflow-x-auto">
          <pre className="text-sm text-gray-200 whitespace-pre-wrap break-words font-mono">
            {exercise.prompt_text}
          </pre>
        </div>
      </div>

      {/* Textarea for response */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-300">
          Tu respuesta
        </label>
        <textarea
          value={localResponse}
          onChange={handleInputChange}
          disabled={isDisabled}
          placeholder="Escribe tu respuesta aquí..."
          className={`w-full min-h-[84px] max-h-[240px] px-4 py-3 bg-navy-800 border rounded font-mono text-sm text-gray-100 placeholder-gray-500 resize-vertical transition-colors ${
            isDisabled
              ? "border-gray-600 bg-navy-900 opacity-50 cursor-not-allowed"
              : "border-navy-700 focus:border-cyan-400 focus:outline-none"
          }`}
        />
      </div>

      {/* "Listo" Button */}
      <div className="flex gap-3">
        <button
          onClick={handleMarkDone}
          disabled={isTextareaEmpty && !isDisabled}
          className={`px-6 py-2.5 rounded font-bold text-sm transition-all ${
            isDisabled
              ? "bg-lime-400 text-navy-900 opacity-75 cursor-default"
              : isTextareaEmpty
                ? "bg-gray-600 text-gray-300 cursor-not-allowed opacity-50"
                : "bg-cyan-400 text-navy-900 hover:bg-cyan-300 active:scale-95"
          }`}
          title={
            isTextareaEmpty && !isDisabled
              ? "Escribe algo antes de marcar como listo"
              : ""
          }
        >
          {isDisabled ? "✓ Listo" : "Marcar como listo"}
        </button>
      </div>
    </div>
  );
}
