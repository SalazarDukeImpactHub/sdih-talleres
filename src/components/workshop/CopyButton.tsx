"use client";

import React, { useState } from "react";

/**
 * CopyButton Component
 *
 * Copies text to clipboard with feedback.
 * On success: changes label to "Copiado" for 2s, then reverts.
 * On failure: silent (no error toast in 4a; toast added in 4b).
 *
 * Design Decision D-2:
 * - Uses navigator.clipboard.writeText API
 * - Temporary label change for UX feedback
 * - Styling: cyan text with hover glow
 *
 * @param text Text to copy to clipboard
 * @param label Button label (default: "Copiar prompt")
 * @param onSuccess Optional callback on successful copy
 */
interface CopyButtonProps {
  text: string;
  label?: string;
  onSuccess?: () => void;
}

export function CopyButton({
  text,
  label = "Copiar prompt",
  onSuccess,
}: CopyButtonProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      onSuccess?.();

      // Reset to original label after 2s
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (err) {
      // Silent failure in 4a (toast error handling added in 4b)
      console.error("Failed to copy text:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      disabled={isCopied}
      className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium transition-all ${
        isCopied
          ? "text-lime-400 opacity-75 cursor-default"
          : "text-cyan-400 hover:text-cyan-300 hover:drop-shadow-[0_0_8px_rgb(34,211,238,0.5)]"
      }`}
      title={isCopied ? "¡Copiado!" : "Copiar al portapapeles"}
    >
      {isCopied ? (
        <>
          <span className="text-base">✓</span>
          Copiado
        </>
      ) : (
        <>
          <span className="text-base">📋</span>
          {label}
        </>
      )}
    </button>
  );
}
