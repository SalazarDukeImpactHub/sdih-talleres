"use client";

import { CSSProperties } from "react";

interface StatusBadgeProps {
  status: "disponible" | "en vivo" | "próximamente" | "completado";
}

/**
 * StatusBadge — badge visual que muestra el estado del taller.
 * 4 estados con colores distintos y animación para "en vivo".
 */
export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusConfig = (
    status: "disponible" | "en vivo" | "próximamente" | "completado"
  ) => {
    const configs = {
      disponible: {
        label: "Disponible",
        dotColor: "var(--cyan)",
        animated: false,
      },
      "en vivo": {
        label: "En vivo",
        dotColor: "var(--magenta)",
        animated: true,
      },
      próximamente: {
        label: "Próximamente",
        dotColor: "var(--yellow)",
        animated: false,
      },
      completado: {
        label: "Completado",
        dotColor: "var(--lime)",
        animated: false,
      },
    };

    return configs[status];
  };

  const config = getStatusConfig(status);

  const dotStyle: CSSProperties = {
    display: "inline-block",
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: config.dotColor,
    marginRight: "8px",
    ...(config.animated && {
      animation: "sdLive 2s infinite",
    }),
  };

  return (
    <div
      className="inline-flex items-center px-3 py-1.5 rounded-full bg-navy-700/40 backdrop-blur-sm"
      aria-label={`Estado: ${config.label}`}
    >
      <div style={dotStyle} />
      <span className="text-xs font-medium text-text-primary">{config.label}</span>
    </div>
  );
}
