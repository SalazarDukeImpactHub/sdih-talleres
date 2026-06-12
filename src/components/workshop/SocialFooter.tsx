"use client";

import React from "react";
import { SOCIAL_LINKS, SOCIAL_ICONS } from "@/lib/config/social";

/**
 * SocialFooter Component — Social media links in sidebar footer
 *
 * Design Decision D-7:
 * - Icons from config file (src/lib/config/social.ts)
 * - URLs from environment variables
 * - Opens in new tab when clicked
 * - Empty string href renders link but doesn't navigate (graceful placeholder)
 *
 * Styling:
 * - Flex row with gap
 * - Hover: opacity change
 */

export function SocialFooter() {
  const platforms = Object.keys(SOCIAL_ICONS) as Array<keyof typeof SOCIAL_ICONS>;

  return (
    <div
      className="flex justify-center gap-4"
      role="navigation"
      aria-label="Redes sociales"
    >
      {platforms.map((platform) => {
        const url = SOCIAL_LINKS[platform];
        const icon = SOCIAL_ICONS[platform];

        return (
          <a
            key={platform}
            href={url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-2xl transition-all duration-200 ${
              url
                ? "text-cyan hover:text-magenta hover:scale-110 cursor-pointer"
                : "text-text-muted opacity-50 cursor-default"
            }`}
            title={icon.label}
            aria-label={icon.label}
            onClick={(e) => {
              if (!url) {
                e.preventDefault();
              }
            }}
          >
            {icon.emoji}
          </a>
        );
      })}
    </div>
  );
}
