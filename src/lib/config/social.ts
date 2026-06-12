/**
 * Social Links Configuration
 *
 * Design Decision D-7:
 * URLs stored in environment variables (prefixed with NEXT_PUBLIC_)
 * Empty strings as placeholders if env var not set
 *
 * Usage: Set in .env.local (not tracked in git)
 */

export const SOCIAL_LINKS = {
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "",
  linkedin: process.env.NEXT_PUBLIC_LINKEDIN_URL || "",
  tiktok: process.env.NEXT_PUBLIC_TIKTOK_URL || "",
  youtube: process.env.NEXT_PUBLIC_YOUTUBE_URL || "",
} as const;

// Icon mapping
// For now, using emoji; can be replaced with icon library if needed
export const SOCIAL_ICONS: Record<
  keyof typeof SOCIAL_LINKS,
  { label: string; emoji: string }
> = {
  instagram: { label: "Instagram", emoji: "📷" },
  linkedin: { label: "LinkedIn", emoji: "💼" },
  tiktok: { label: "TikTok", emoji: "🎬" },
  youtube: { label: "YouTube", emoji: "▶️" },
} as const;
