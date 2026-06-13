"use client";

import React from "react";

/**
 * ProgressBar Component — Visual progress indicator for workshop completion
 *
 * Design Decision D-1:
 * - Shows progress as: (visited sections / 5) * 100
 * - Gradient bar (cyan to magenta gradient)
 * - Format: "X of 5" below bar
 *
 * Props:
 * @param progressPercent 0-100 percentage value
 */

export interface ProgressBarProps {
  progressPercent: number;
}

export function ProgressBar({ progressPercent }: ProgressBarProps) {
  // Ensure value is within 0-100
  const normalizedPercent = Math.min(Math.max(progressPercent, 0), 100);

  // Calculate visited count for display
  const visitedCount = Math.round((normalizedPercent / 100) * 5);

  return (
    <div className="w-full">
      {/* Progress bar background */}
      <div className="w-full h-2 bg-navy-700 rounded-full overflow-hidden border border-navy-600">
        {/* Gradient fill */}
        <div
          className="h-full transition-all duration-300 ease-out"
          style={{
            width: `${normalizedPercent}%`,
            background: `linear-gradient(90deg, var(--cyan) 0%, var(--magenta) 100%)`,
          }}
          role="progressbar"
          aria-valuenow={normalizedPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progreso del taller"
        />
      </div>

      {/* Progress text */}
      <div className="mt-2 text-center text-sm text-text-secondary">
        <span className="font-medium text-cyan">{visitedCount}</span>
        <span> de 5</span>
      </div>
    </div>
  );
}
