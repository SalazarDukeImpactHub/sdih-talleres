"use client";

import React, { useState, useRef, useEffect } from "react";
import { CopyButton } from "./CopyButton";
import { Exercise } from "@/lib/schemas/exercise";
import { saveWithRetry } from "@/lib/client/exercises-retry";

/**
 * ExerciseCard Component
 *
 * Renders a single exercise with textarea for response input and "Listo" button.
 * In 4a: basic render without autosave (just onChange callback).
 * In 4b: adds debounce, retry, state management.
 *
 * Design Decision D-2, D-3, D-5, D-6:
 * - Client Component with serializable props
 * - Manages textarea state locally (onChange updates state)
 * - Autosave debounce: 1s setTimeout on onChange, saveWithRetry wrapper
 * - Retry logic: 3 attempts with exponential backoff (3s, 6s, 9s)
 * - Guardado indicator: inline "Guardado" label that fades after 2s
 * - "Listo"/"Reabrir" state machine: button changes based on status
 *
 * @param exerciseNumber Exercise number for display (1, 2, 3, 4...)
 * @param exercise Exercise data { id, title, objective, prompt_text, ... }
 * @param userResponse Current user response text from props
 * @param status Current exercise status ('pending' | 'in_progress' | 'done')
 * @param onResponseChange Callback when textarea changes (debounced autosave)
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
  const [localStatus, setLocalStatus] = useState(status);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  const debouncedSaveTimeout = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debouncedSaveTimeout.current) {
        clearTimeout(debouncedSaveTimeout.current);
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalResponse(newValue);

    // Clear previous debounce timer
    if (debouncedSaveTimeout.current) {
      clearTimeout(debouncedSaveTimeout.current);
    }

    // Skip autosave if disabled (status='done')
    if (localStatus === "done") {
      return;
    }

    // Set new debounce timer: 1s delay before autosave
    debouncedSaveTimeout.current = setTimeout(async () => {
      // Only save if textarea is non-empty
      if (newValue.trim()) {
        setSaveStatus("saving");
        const result = await saveWithRetry(
          exercise.id,
          newValue,
          "in_progress"
        );
        if (result.success) {
          setSaveStatus("saved");
          // Fade "Guardado" indicator after 2s
          setTimeout(() => setSaveStatus("idle"), 2000);
        } else {
          setSaveStatus("error");
          // Dispatch toast event for error handling (wired in 4b.5)
          window.dispatchEvent(
            new CustomEvent("toast:show", {
              detail: {
                message:
                  "No pudimos guardar tu respuesta. Intentá copiar tu texto.",
                variant: "error",
              },
            })
          );
        }
      }
    }, 1000);

    // Notify parent of change
    onResponseChange(exercise.id, newValue);
  };

  // NOTA: se removió handleBlurSave (onBlur del textarea). Generaba una race
  // condition: al clickear "Marcar como listo", el textarea perdía foco y el
  // blur disparaba un save con status='in_progress' que corría concurrente
  // con handleMarkDone (status='done') y lo pisaba. El autosave con debounce
  // de 1s ya cubre la persistencia — el blur era redundante. (Riesgo D-flagged.)

  const handleMarkDone = async () => {
    // Cancel pending autosave if any
    if (debouncedSaveTimeout.current) {
      clearTimeout(debouncedSaveTimeout.current);
      debouncedSaveTimeout.current = null;
    }

    if (localStatus === "done") {
      // Reabrir: revert to in_progress
      setSaveStatus("saving");
      const result = await saveWithRetry(
        exercise.id,
        localResponse,
        "in_progress"
      );
      if (result.success) {
        setLocalStatus("in_progress");
        setSaveStatus("idle");
      } else {
        setSaveStatus("error");
        window.dispatchEvent(
          new CustomEvent("toast:show", {
            detail: {
              message: "No pudimos reabrir el ejercicio.",
              variant: "error",
            },
          })
        );
      }
    } else {
      // Marcar como listo: save with status='done'
      setSaveStatus("saving");
      const result = await saveWithRetry(exercise.id, localResponse, "done");
      if (result.success) {
        setLocalStatus("done");
        setSaveStatus("idle");
      } else {
        setSaveStatus("error");
        window.dispatchEvent(
          new CustomEvent("toast:show", {
            detail: {
              message: "No pudimos marcar como listo.",
              variant: "error",
            },
          })
        );
      }
    }

    onMarkDone(exercise.id);
  };

  const isTextareaEmpty = !localResponse.trim();
  const isDisabled = localStatus === "done";

  return (
    <div
      className="bg-navy-900 border border-navy-700 rounded-lg p-6 space-y-4"
      data-testid="exercise-card"
      data-exercise-id={exercise.id}
      data-status={localStatus}
    >
      {/* Header: Number Badge + Title + Status Badge */}
      <div className="flex items-start gap-4">
        <div
          className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
            localStatus === "done"
              ? "bg-lime-400 text-navy-900"
              : "bg-cyan-400 text-navy-900"
          }`}
        >
          {localStatus === "done" ? "✓" : exerciseNumber}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-white">{exercise.title}</h3>
          <div
            className={`inline-block mt-2 px-3 py-1 rounded text-xs font-semibold ${statusColors[localStatus]}`}
          >
            {statusLabels[localStatus]}
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
          className={`w-full min-h-[84px] max-h-[240px] md:max-h-[50vh] px-4 py-3 bg-navy-800 border rounded font-mono text-sm text-gray-100 placeholder-gray-500 resize-vertical transition-colors ${
            isDisabled
              ? "border-gray-600 bg-navy-900 opacity-50 cursor-not-allowed"
              : "border-navy-700 focus:border-cyan-400 focus:outline-none"
          }`}
        />
      </div>

      {/* "Listo"/"Reabrir" Button */}
      <div className="flex gap-3 items-center">
        <button
          onClick={handleMarkDone}
          disabled={
            (isTextareaEmpty && !isDisabled) || saveStatus === "saving"
          }
          className={`px-6 py-2.5 rounded font-bold text-sm transition-all ${
            isDisabled
              ? "bg-lime-400 text-navy-900 cursor-pointer hover:bg-lime-300 active:scale-95"
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
          {isDisabled ? "↻ Reabrir" : "Marcar como listo"}
        </button>

        {/* "Guardado" Indicator */}
        {saveStatus === "saved" && (
          <span className="text-lime-400 text-sm font-semibold animate-fade-out">
            Guardado
          </span>
        )}
      </div>
    </div>
  );
}
