import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { redirect } from "next/navigation";
import { getWorkshopProgress } from "@/lib/actions/workshop-sections";
import { WorkshopView } from "./WorkshopView";

/**
 * Workshop Detail Page — /taller/[slug]
 *
 * Design: D-6
 * - Server Component (fetches workshop, checks RLS, calls getCurrentUser())
 * - Guards via authentication layout + access validation
 * - Fetches sections, glossary_terms, and calculates progress
 * - Passes data to Client wrapper (WorkshopView) for state management
 *
 * Next.js 16: params is Promise — use await params
 *
 * Security:
 * 1. Authentication: guaranteed by (authenticated) layout
 * 2. Authorization: user must have redeemed_at NOT NULL in workshop_access
 * 3. RLS policies: DB filters sections/glossary_terms by workshop_id + user access
 */

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function WorkshopPage({ params }: PageProps) {
  const { slug } = await params;

  // 1. Get current authenticated user (guaranteed by layout, but re-check for safety)
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  const supabase = await createClient();

  // 2. Fetch workshop by slug
  const { data: workshop, error: workshopError } = await supabase
    .from("workshops")
    .select("id, title, slug, description")
    .eq("slug", slug)
    .single();

  if (workshopError || !workshop) {
    redirect("/catalogo");
  }

  // 3. Check user has access (redeemed_at NOT NULL)
  const { data: access, error: accessError } = await supabase
    .from("workshop_access")
    .select("redeemed_at")
    .eq("user_id", user.id)
    .eq("workshop_id", workshop.id)
    .single();

  // If no record or redeemed_at is null, redirect
  if (accessError || !access || !access.redeemed_at) {
    redirect("/catalogo");
  }

  // 4. Fetch sections (RLS enforces workshop_id match)
  const { data: sectionsData, error: sectionsError } = await supabase
    .from("sections")
    .select("id, type, content_json, section_order")
    .eq("workshop_id", workshop.id)
    .order("section_order", { ascending: true });

  if (sectionsError) {
    console.error("[WorkshopPage] Error fetching sections:", sectionsError);
    redirect("/catalogo");
  }

  const sections = sectionsData || [];

  // 5. Fetch glossary terms (RLS enforces workshop_id match)
  const { data: glossaryData, error: glossaryError } = await supabase
    .from("glossary_terms")
    .select("id, term, definition, category")
    .eq("workshop_id", workshop.id)
    .order("term", { ascending: true });

  if (glossaryError) {
    console.error("[WorkshopPage] Error fetching glossary:", glossaryError);
    // Don't redirect — glossary is optional
  }

  const glossaryTerms = glossaryData || [];

  // 6. Calculate progress
  const progressPercent = await getWorkshopProgress(user.id, workshop.id);

  // 7. Pass to Client wrapper
  return (
    <WorkshopView
      workshop={workshop}
      sections={sections}
      glossaryTerms={glossaryTerms}
      progressPercent={progressPercent}
    />
  );
}
