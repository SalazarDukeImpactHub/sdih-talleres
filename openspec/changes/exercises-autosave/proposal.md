# Proposal: exercises-autosave

## Intent

Add Exercise + ExerciseProgress tables to track student responses to individual exercises within workshops. Enable autosave with 1s debounce and visual "Guardado" indicator, allowing students to refine their responses and mark completion without manual save buttons. Fulfills brief §7.3 requirement: "copia prompts con un click, escribe su respuesta en el textarea (autosave 1s)... Marca ejercicios como completados → progreso se actualiza". Also enables progress bar formula to become "exercise-aware" — counting both section visits and completed exercises per brief §13.

## Scope

### In Scope

**Data & Migration:**
- `exercises` table with `workshop_id, title, objective, prompt_text, order` columns + RLS guard (read-only for users with redeemed `workshop_access`)
- `exercise_progress` table with `user_id, exercise_id, status (pending|in_progress|done), user_response_text, updated_at` + RLS (user reads/writes only own rows)
- Seed helper `seedExercises(workshopId, count)` for e2e

**Server Actions:**
- `saveExerciseProgress(exerciseId, userResponse, status?)` — idempotent upsert (autosave + "Listo" completion)
- Extend `getWorkshopProgress(userId, workshopId)` to return exercise counts + completion counts for progress bar formula

**Components & Client Behavior:**
- `ExerciseCard.tsx` component: number badge, title, objective (⚡ icon), prompt display (monospace + copy button), textarea with autosave on input (debounce 1s), "Listo" button (disabled if empty, changes to "Completado" + checkmark if done)
- Convert `TallerSection.tsx` from Server to Client Component; fetch exercises from parent, render in ordered loop
- Add "Guardado" indicator (2s fade) after autosave succeeds; silent retry on failure (exponential backoff 3s/6s/9s, then error toast after 3 retries)
- Extend `getWorkshopProgress()` to calculate exercise-aware formula: `(visitadas + exercises_done) / (5 + total_exercises)` and return both metrics

**E2E Testing (8 new specs):**
- Render 4+ exercises with title/objective/prompt
- Copy button interaction (clipboard permissions)
- Autosave on textarea input → verify DB update via admin client
- Autosave failure & retry logic (simulate network error)
- Mark exercise as "Listo" (status='done', UI updates)
- Progress bar reflects exercise completion
- RLS: user cannot see exercises for unredeemed workshop
- Persistence: close/reopen browser, responses still there

**Styling & Layout:**
- Exercise cards: navy-700 border, cyan/lime status indicators (pending/in-progress/done), responsive textarea (mobile 360px safe)

### Out of Scope

- Admin CRUD for exercises (change 5)
- Exercise reordering (change 5+)
- Rich-text / markdown parsing in prompts (v1 uses plain text only, confirmed via prototype)
- Email notifications for pending exercises (change 6)
- WhatsApp exercise reminders (change 7)
- Exercise categories / tagging (future version)
- Student-to-student collaboration on exercises (out of scope, no design)

## Capabilities

> This section is the CONTRACT between proposal and specs phases.
> No existing capability specs found in `openspec/specs/`; this change introduces new capabilities.

### New Capabilities

- `exercise-autosave`: Server-side exercise + progress tracking with idempotent debounce autosave and retry logic
- `exercise-progress-tracking`: ExerciseProgress table with RLS, status enum (pending/in_progress/done), and response persistence
- `exercise-card-ui`: Component for rendering individual exercise (title, objective, prompt, copy button, textarea, completion button)
- `progress-formula-exercise-aware`: Progress bar calculation that combines section visits + exercise completion counts

### Modified Capabilities

- `workshop-progress-calculation`: Extend from visitadas-only (5 sections) to include exercise counts in denominator/numerator

## Approach

Reuse the proven pattern from change 3 (section_visits + RLS + Server Action):

1. **Migrations**: Create `exercises` and `exercise_progress` tables with same RLS guard (EXISTS workshop_access.redeemed_at).
2. **Server Action**: `saveExerciseProgress()` uses idempotent upsert (`ignoreDuplicates: true`) to handle debounce collision.
3. **Client Component**: TallerSection becomes Client to manage textarea state + autosave timer via `useEffect` + `useState` + `setTimeout`.
4. **Optimistic Updates**: Client immediately updates local state; Server Action confirms via DB query for consistency.
5. **Progress Formula**: Fetch exercise totals in `getWorkshopProgress()`, calculate `(visitadas + exercises_done) / (5 + total_exercises)`.
6. **Autosave Retry**: On Server Action failure, retry at 3s/6s/9s. Show toast error only after 3 failed retries (user has data in textarea, not lost).

**Estimate**: 2 chained PRs (4a: migrations + Server Actions + ExerciseCard + basic render ~490 lines; 4b: autosave debounce + progress formula + full e2e ~480 lines).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/database.types.ts` | Modified | Add Exercise + ExerciseProgress types |
| `src/migrations/` | New | `20260613_exercises_table.sql` + `20260613_exercise_progress.sql` |
| `src/lib/actions/exercises.ts` | New | `saveExerciseProgress()` Server Action |
| `src/lib/actions/workshop-sections.ts` | Modified | Extend `getWorkshopProgress()` + add exercise counts |
| `src/components/workshop/ExerciseCard.tsx` | New | Exercise card component with textarea + autosave |
| `src/components/workshop/sections/TallerSection.tsx` | Modified | Convert Server → Client, map exercises, render cards |
| `src/app/(authenticated)/taller/[slug]/page.tsx` | Modified | Fetch exercises + exercise_progress for current workshop |
| `src/lib/schemas/exercise.ts` | New | Zod schema for Exercise + ExerciseProgress |
| `e2e/specs/workshop/[4-1..4-8]-exercise-*.spec.ts` | New | 8 e2e specs |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Autosave race: user clicks "Listo" while debounce pending | Medium | Use `useTransition` (React 19) to queue mutations; check DB state on "Listo" click to avoid duplicate saves |
| Clipboard permissions in e2e fail silently | Medium | Add explicit `test.use({ permissions: ['clipboard-read', 'clipboard-write'] })` per spec |
| RLS upsert with no UPDATE policy | Medium | Use `ignoreDuplicates: true` (proven in change 3); tested explicitly in verify phase |
| Progress formula breaks with variable exercise counts | Low | Fetch exercise count dynamically in `getWorkshopProgress()` query, not static formula |
| Textarea overflow on mobile 360px | Low | CSS: `resize: vertical`, `max-height: viewport-relative`, min-width safeguards on container |
| User loses unsaved response on navigation | Low | Autosave is best-effort; no "unsaved changes" warning (keeps UX clean); user can copy response if they doubt save worked |

## Rollback Plan

1. **If migrations fail**: Revert changesets `20260613_exercises_table.sql` + `20260613_exercise_progress.sql` (no foreign key reversals needed, DDL is clean).
2. **If autosave Server Action breaks**: Set `saveExerciseProgress()` to no-op (log but return success) — client sees "Guardado" indicator but DB doesn't persist; students keep responses in textarea.
3. **If progress formula is wrong**: Revert `getWorkshopProgress()` to visitadas-only (5) — progress bar shows old behavior, exercises don't count yet.
4. **Revert branch**: If slice 4a fails, revert PR #N. If slice 4b fails, revert PR #N+1 and optionally slice 4a (depends on severity).

## Dependencies

- **External**: None (React 19, Supabase, Zod already available from changes 1-3)
- **Data prerequisite**: Jennifer manually inserts 4 Exercise seed rows per workshop via SQL before apply phase (provides realistic test data during dev; change 5 admin panel replaces this)

## Success Criteria

- [ ] Students can type responses in exercise textarea without manual save button
- [ ] "Guardado" indicator appears within 2s after autosave Server Action succeeds
- [ ] Autosave retries silently on network error; toast shows only after 3 retries fail
- [ ] Clicking "Listo" button marks exercise status='done' and updates sidebar progress bar in real-time
- [ ] Progress bar formula returns exercise-aware percentage: `(visitadas + exercises_done) / (5 + total_exercises)` 
- [ ] All 8 e2e specs PASS (exercise render, copy, autosave, failure/retry, completion, progress, RLS, persistence)
- [ ] No RLS errors in e2e (verify `exercise_progress` upsert with `ignoreDuplicates: true`)
- [ ] Mobile layout safe on 360px (no horizontal overflow, textarea scrollable)
- [ ] Build / lint clean, no TypeScript errors

---

**Proposed by**: sdd-propose (automated)  
**Date**: 2026-06-16  
**Artifact store**: openspec  
**Target PR**: Ask-on-risk (2 chained PRs, ~970 total lines)
