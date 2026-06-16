import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { redirect } from "next/navigation";
import { getExerciseAwareProgress } from "@/lib/actions/workshop-sections";
import { WorkshopView } from "./WorkshopView";
import type { ExerciseProgress } from "@/lib/schemas/exercise";

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

  // 6. Fetch visited section ids — el progreso se computa client-side
  // (update optimista al visitar secciones, design D-1)
  const sectionIds = sections.map((s) => s.id);
  const { data: visitsData } = await supabase
    .from("section_visits")
    .select("section_id")
    .eq("user_id", user.id)
    .in("section_id", sectionIds.length > 0 ? sectionIds : ["00000000-0000-0000-0000-000000000000"]);

  const visitedSectionIds = (visitsData || []).map((v) => v.section_id);

  // 7. Fetch exercises for this workshop (change 4a.7)
  const { data: exercisesData, error: exercisesError } = await supabase
    .from("exercises")
    .select("id, workshop_id, title, objective, prompt_text, order, created_at, updated_at")
    .eq("workshop_id", workshop.id)
    .order("order", { ascending: true });

  if (exercisesError) {
    console.error("[WorkshopPage] Error fetching exercises:", exercisesError);
    // Don't redirect — exercises are optional (4a gate allows missing exercises)
  }

  const exercises = exercisesData || [];

  // 8. Fetch exercise_progress for this user + workshop (change 4a.7).
  // Tipo importado del schema Zod para coincidir con el prop de WorkshopView —
  // si declarás un type local con status: string, TS rechaza la asignación
  // contra el union estricto del schema. El CHECK constraint de la DB ya
  // garantiza que status sea uno de los 3 valores válidos.
  let exerciseProgress: Record<string, ExerciseProgress> = {};
  if (exercises.length > 0) {
    const exerciseIds = exercises.map((e) => e.id);
    const { data: progressData, error: progressError } = await supabase
      .from("exercise_progress")
      .select("id, user_id, exercise_id, status, user_response_text, updated_at")
      .eq("user_id", user.id)
      .in("exercise_id", exerciseIds);

    if (progressError) {
      console.error("[WorkshopPage] Error fetching exercise_progress:", progressError);
      // Don't redirect — missing progress is ok (defaults to pending/empty)
    }

    exerciseProgress = ((progressData || []) as ExerciseProgress[]).reduce(
      (acc, prog) => {
        acc[prog.exercise_id] = prog;
        return acc;
      },
      {} as Record<string, ExerciseProgress>
    );
  }

  // 9. Calculate exercise-aware progress (change 4b.7)
  const progressData = await getExerciseAwareProgress(user.id, workshop.id);

  // 10. Pass to Client wrapper
  return (
    <WorkshopView
      workshop={workshop}
      sections={sections}
      glossaryTerms={glossaryTerms}
      visitedSectionIds={visitedSectionIds}
      exercises={exercises}
      exerciseProgress={exerciseProgress}
      progressData={progressData}
    />
  );
}
