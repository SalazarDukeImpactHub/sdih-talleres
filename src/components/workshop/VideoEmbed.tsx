import React from "react";

interface VideoEmbedProps {
  url: string;
  title?: string;
}

/**
 * Convierte cualquier URL de YouTube a formato embed.
 * Soporta:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - URLs con parámetros adicionales (timestamp, lista, etc.)
 *
 * Devuelve `null` si no logra extraer el ID (URL inválida).
 */
function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    let videoId: string | null = null;

    if (u.hostname.includes("youtu.be")) {
      videoId = u.pathname.slice(1).split("/")[0];
    } else if (u.hostname.includes("youtube.com")) {
      if (u.pathname.startsWith("/embed/")) {
        videoId = u.pathname.split("/embed/")[1].split("/")[0];
      } else if (u.pathname === "/watch") {
        videoId = u.searchParams.get("v");
      } else if (u.pathname.startsWith("/shorts/")) {
        videoId = u.pathname.split("/shorts/")[1].split("/")[0];
      }
    }

    if (!videoId) return null;

    // Parámetros: rel=0 reduce recomendaciones a sólo del mismo canal.
    // modestbranding=1 minimiza el branding de YouTube en los controles.
    return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
  } catch {
    return null;
  }
}

/**
 * VideoEmbed — embed responsive de YouTube con aspect ratio 16:9.
 *
 * Estilos: borde sutil cyan, sombra suave, esquinas redondeadas.
 * Si la URL no es de YouTube válida, no renderiza nada (degradación silenciosa).
 */
export function VideoEmbed({ url, title = "Video del taller" }: VideoEmbedProps) {
  const embedUrl = getYouTubeEmbedUrl(url);
  if (!embedUrl) return null;

  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-cyan/30 shadow-[0_0_30px_rgba(25,198,230,0.15)] bg-navy-900">
      <iframe
        src={embedUrl}
        title={title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="absolute inset-0 w-full h-full"
      />
    </div>
  );
}
