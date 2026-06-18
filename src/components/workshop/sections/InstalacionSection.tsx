"use client";

import React, { useState } from "react";
import { InstalacionContent } from "@/lib/schemas/section-content";
import { Markdown } from "../Markdown";
import { VideoEmbed } from "../VideoEmbed";

/**
 * InstalacionSection Component — Installation/setup section with code blocks
 *
 * Design: D-4 (Client Component), D-9
 * - Numbered steps with title, description, code block
 * - Code block with language label and copy button
 * - Copy button shows "✓ Copiado" confirmation for 2s
 * - Syntax highlighting via inline styling (basic)
 * - Success message at end (optional)
 *
 * Props:
 * @param content Parsed InstalacionContent from Zod schema
 */

interface InstalacionSectionProps {
  content: InstalacionContent;
}

interface CopyState {
  stepIndex: number;
  copied: boolean;
}

export function InstalacionSection({ content }: InstalacionSectionProps) {
  const [copyState, setCopyState] = useState<CopyState>({ stepIndex: -1, copied: false });

  const handleCopyCode = async (code: string, stepIndex: number) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopyState({ stepIndex, copied: true });
      setTimeout(() => {
        setCopyState({ stepIndex: -1, copied: false });
      }, 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      {/* Header */}
      <h1 className="text-4xl md:text-5xl font-bold font-display text-text-primary mb-8">
        {content.title}
      </h1>

      {/* Video tutorial (opcional) — sólo aparece si el admin definió video_url */}
      {content.video_url && (
        <div className="mb-10">
          <VideoEmbed url={content.video_url} title={`${content.title} — tutorial en video`} />
        </div>
      )}

      {/* Steps */}
      <div className="space-y-8">
        {content.steps.map((step, idx) => (
          <div key={idx} className="relative">
            {/* Vertical line connector (not on last step) */}
            {idx < content.steps.length - 1 && (
              <div
                className="absolute left-6 top-16 bottom-0 w-0.5 bg-gradient-to-b from-cyan to-magenta"
                aria-hidden="true"
              />
            )}

            {/* Step container */}
            <div className="relative">
              {/* Step number circle */}
              <div className="absolute left-0 top-0 w-12 h-12 rounded-full bg-gradient-to-br from-cyan to-magenta flex items-center justify-center text-navy-900 font-bold text-lg">
                {step.order}
              </div>

              {/* Step content */}
              <div className="ml-16 bg-navy-700 border border-navy-600 rounded-lg p-6">
                <h3 className="text-lg font-bold text-text-primary mb-2">
                  {step.title}
                </h3>

                <div className="mb-4">
                  <Markdown>{step.description}</Markdown>
                </div>

                {/* Code block */}
                <div className="bg-navy-900 border border-navy-600 rounded-md overflow-hidden">
                  {/* Language label */}
                  <div className="px-4 py-2 bg-navy-800 border-b border-navy-600 text-xs font-mono text-cyan uppercase tracking-wider">
                    {step.language}
                  </div>

                  {/* Code content */}
                  <div className="relative">
                    <pre className="px-4 py-3 overflow-x-auto text-sm font-mono text-text-primary whitespace-pre-wrap break-words">
                      <code>{step.code}</code>
                    </pre>

                    {/* Copy button */}
                    <button
                      onClick={() => handleCopyCode(step.code, idx)}
                      className={`absolute top-2 right-2 px-3 py-1 rounded-md text-xs font-semibold transition-all duration-200 ${
                        copyState.stepIndex === idx && copyState.copied
                          ? "bg-lime text-navy-900"
                          : "bg-cyan text-navy-900 hover:bg-magenta"
                      }`}
                      title="Copiar al portapapeles"
                    >
                      {copyState.stepIndex === idx && copyState.copied
                        ? "✓ Copiado"
                        : "Copiar"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Success message */}
      {content.success_message && (
        <div className="mt-10 p-6 md:p-8 bg-gradient-to-br from-lime/10 to-cyan/10 border border-lime/30 rounded-lg text-center">
          <div className="text-4xl mb-3 animate-[sdCheck_0.6s_ease-out]">✓</div>
          <p className="text-lg font-semibold text-lime">
            {content.success_message}
          </p>
        </div>
      )}
    </div>
  );
}
