/**
 * Social Links Configuration
 *
 * URLs configurable vía env vars o defaults hardcodeados acá.
 * Para cambiar las URLs sin tocar el código, definí estas vars en .env.production:
 *   NEXT_PUBLIC_INSTAGRAM_URL
 *   NEXT_PUBLIC_LINKEDIN_URL
 *   NEXT_PUBLIC_TIKTOK_URL
 *   NEXT_PUBLIC_YOUTUBE_URL
 */

const DEFAULT_HANDLE = "salazardukeimpacthub";

export const SOCIAL_LINKS = {
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || `https://www.instagram.com/${DEFAULT_HANDLE}/`,
  linkedin: process.env.NEXT_PUBLIC_LINKEDIN_URL || `https://www.linkedin.com/company/salazar-duke-impact-hub/`,
  tiktok: process.env.NEXT_PUBLIC_TIKTOK_URL || `https://www.tiktok.com/@${DEFAULT_HANDLE}`,
  youtube: process.env.NEXT_PUBLIC_YOUTUBE_URL || `https://www.youtube.com/@SalazarDukeImpactHub`,
} as const;

export const SOCIAL_LABELS: Record<keyof typeof SOCIAL_LINKS, string> = {
  instagram: "Instagram",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  youtube: "YouTube",
} as const;
