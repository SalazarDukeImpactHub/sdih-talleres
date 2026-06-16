# Tasks — exercises-autosave

**Change ID:** exercises-autosave  
**Position in SDD plan:** 4 of 8  
**Status:** Tasks (ready for apply)  
**Slicing:** 2 chained PRs (4a ~490 lines, 4b ~480 lines)  
**Delivery Strategy:** Chained PRs approved (slice 4a → PR to master; slice 4b → branch from 4a merged)

---

## Review Workload Forecast

| Metric | Value | Notes |
|--------|-------|-------|
| **Estimated changed lines** | ~970 | 4a: ~490 (migrations + schemas + card + basic render) + 4b: ~480 (autosave + retry + progress + e2e) |
| **400-line budget risk** | Medium | Total ~970 lines; justified by 2 RLS tables + autosave + progress formula + 10 e2e specs. Chained PRs reduce risk. |
| **Chained PRs recommended** | Yes | 2 slices: 4a functional without autosave, 4b adds debounce/retry/formula. Both mergeable independently. |
| **Decision needed before apply** | No | All design decisions locked (D-1 to D-12 in design artifact). RLS pattern proven in change 3. |
| **Chain strategy** | stacked-to-main | Slice 4a → PR#N merges to master; Slice 4b → PR#N+1 branches from 4a merged, merges to master |

**Forecast details:**
- Slice 4a: Migrations (110 LOC) + Zod schemas (40 LOC) + Server Action basic (60 LOC) + ExerciseCard (200 LOC) + TallerSection refactor (80 LOC) + page.tsx extend (60 LOC) + seedExercises helper (50 LOC) + E2E tests [4a] (40 LOC) = **~600 LOC**
- Slice 4b: Autosave debounce (80 LOC) + saveWithRetry wrapper (50 LOC) + getExerciseAwareProgress (70 LOC) + ProgressBar update (40 LOC) + "Guardado" indicator (30 LOC) + "Listo"/"Reabrir" state (50 LOC) + mobile CSS (50 LOC) + seed SQL doc (60 LOC) + E2E tests [4b] (140 LOC) = **~570 LOC**
- Total: ~1,170 LOC (revisions from design estimate; margin for test fixtures + comments)

**Key findings:**
- No new npm dependencies required
- RLS pattern: exercise_progress uses `ignoreDuplicates: false` (allows UPDATE on UNIQUE conflict) + policy UPDATE required
- SQL migrations provided in design (D-1), must include UPDATE policy on exercise_progress
- Test fixtures and helpers finalized
- Mobile responsive design per D-11 (textarea max-height 50vh, buttons stack)

---

## Pre-Apply Blockers (Read & Action Required)

### B-1: SQL Migrations Must Be Created & Run (Manual Step — Jennifer)

**Blocker owner:** Jennifer Salazar Duque  
**Action:** Before `pnpm test:e2e` runs in slice 4a:

1. Apply phase creates 2 migration files in `supabase/migrations/`:
   - `{ts}_create_exercises_table.sql` — exercises table + RLS SELECT (from design D-1)
   - `{ts}_create_exercise_progress_table.sql` — exercise_progress table + 3 RLS policies (from design D-1)
   
2. **CRITICAL RECONCILIATION (Divergence from Change 3):**
   - Change 3 archive says "always `ignoreDuplicates: true` in upsert with RLS"
   - This change: exercise_progress uses `ignoreDuplicates: false` because exercise_progress NEEDS UPDATE (change status pending→in_progress→done, update user_response_text)
   - **To make this safe under RLS:** the migration MUST include a **policy UPDATE** with `USING (user_id = auth.uid())` clause
   - This is now a proven pattern: exercise_progress UPDATE policy is the second line of defense (first: ignoreDuplicates=false allows conflict, RLS blocks unauthorized update)
   
3. Jennifer runs in Supabase SQL Editor (after apply 4a creates the files):
   ```sql
   -- Migration timestamps must be sequential after change 3
   -- Run: 20260613000006_create_exercises_table.sql
   -- Then: 20260613000007_create_exercise_progress_table.sql
   ```

4. Verify tables exist:
   ```sql
   SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
     AND tablename IN ('exercises', 'exercise_progress');
   -- Should return 2 rows
   ```

5. Verify RLS and UPDATE policy:
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables 
     WHERE schemaname = 'public' 
       AND tablename IN ('exercises', 'exercise_progress');
   -- Both should show: true
   
   SELECT policyname, cmd FROM pg_policies 
     WHERE tablename = 'exercise_progress';
   -- Should include: exercise_progress_update (cmd = 'UPDATE')
   ```

**Timing:** Apply 4a creates migration files. Jennifer runs them before e2e gate 4a.

**Acceptance:** 2 tables exist in Supabase public schema with RLS enabled. exercise_progress has UPDATE policy. Indexes present. UNIQUE constraints in place.

---

### B-2: Seed Exercises for E2E Tests

**Blocker owner:** Apply phase (via helper function)  
**Action:** Helper `seedExercises()` must be available before e2e tests run in slice 4a.

1. Apply phase creates helper: `tests/helpers/seed-exercises.ts` (exported function)
2. Seed helper definition (from design D-10):
   - Function signature: `async function seedExercises(workshopId: string, count?: number = 4): Promise<string[]>`
   - Idempotent: delete existing exercises for workshop, then insert
   - Returns: array of exercise IDs (for test assertions)

3. Helper is called in Playwright test setup (beforeEach):
   ```typescript
   // tests/e2e/workshop-exercises.spec.ts (example from task 4a.11)
   const exerciseIds = await seedExercises(workshopId, 4);
   ```

4. Verify seed worked:
   ```sql
   SELECT COUNT(*) FROM exercises WHERE workshop_id = $1;  -- expect 4
   ```

**Timing:** Apply 4a creates helper. Jennifer or test runner calls it before e2e gate.

**Acceptance:** seedExercises() executes without error. 4 exercises exist in DB per workshop. Content parses valid Zod schemas.

---

### B-3: Design Decision Reconciliation (Already Locked — FYI)

**Status:** ✓ All decisions finalized in design phase.

- D-1: SQL migrations (2 tables + RLS) ✓ — **UPDATE policy REQUIRED on exercise_progress**
- D-2: ExerciseCard component structure ✓
- D-3: Autosave debounce (1s, manual setTimeout) ✓
- D-4: saveExerciseProgress Server Action (ignoreDuplicates=false + explicit workshop access check) ✓
- D-5: Retry logic (3s/6s/9s exponential) ✓
- D-6: "Guardado" indicator + toast strategy ✓
- D-7: "Listo"/"Reabrir" state machine ✓
- D-8: Exercise-aware progress formula ✓
- D-9: Data fetch in /taller/[slug] ✓
- D-10: seedExercises() helper ✓
- D-11: Mobile 360px responsive ✓
- D-12: Seed SQL for Jennifer ✓

**No additional decisions needed for apply.** Tasks below assume all D-* are locked.

**DIVERGENCE NOTE (Reconciled):**
- Change 3 archive: "ignoreDuplicates: true prevents UPDATE"
- This change: ignoreDuplicates: false ALLOWS UPDATE (necessary for exercise_progress status transitions)
- **Fix:** RLS policy UPDATE on exercise_progress (via B-1) provides second line of defense
- **Result:** Safe under RLS because: (1) ignoreDuplicates=false, (2) policy UPDATE checks user_id = auth.uid()

---

## Slice 4a Tasks

**Scope:** Migrations + Zod schemas + Server Action basic + ExerciseCard render (no autosave) + TallerSection refactor + page.tsx extend + seedExercises helper + E2E tests [4a basics]

**Target:** ~600 lines, autonomous, fully tested, mergeable to master alone

**Gate:** `pnpm build && pnpm lint && pnpm test && pnpm test:e2e [4a only]`

---

### Task 4a.1: Create SQL Migrations (2 files)

**Type:** Database infrastructure  
**Files affected:**
- `supabase/migrations/{ts}_create_exercises_table.sql`
- `supabase/migrations/{ts}_create_exercise_progress_table.sql`

**Acceptance:**
- [ ] 2 migration files created with correct timestamps (sequential, after change 3 migrations)
- [ ] exercises table: id UUID PK, workshop_id UUID FK, title TEXT, objective TEXT, prompt_text TEXT, order INT, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ, UNIQUE(workshop_id, order), indexes on workshop_id
- [ ] RLS exercises: 1 policy (SELECT via EXISTS on workshop_access.redeemed_at)
- [ ] exercise_progress table: id UUID PK, user_id UUID FK, exercise_id UUID FK, status ENUM ('pending'|'in_progress'|'done'), user_response_text TEXT nullable, updated_at TIMESTAMPTZ, UNIQUE(user_id, exercise_id), indexes on user_id + exercise_id
- [ ] RLS exercise_progress: 3 policies (SELECT, INSERT, **UPDATE** all checking user_id = auth.uid())
- [ ] Test: `pnpm build` succeeds (Next.js Supabase client imports schema, no errors)

**Dependency:** None (first task)  
**Estimated:** 110 LOC total

---

### Task 4a.2: Create Zod Validation Schemas

**Type:** Validation schema  
**Files affected:**
- `src/lib/schemas/exercise.ts` (new)

**Acceptance:**
- [ ] ExerciseSchema exported: id, workshop_id, title, objective, prompt_text, order, created_at, updated_at
- [ ] ExerciseProgressSchema exported: id, user_id, exercise_id, status (enum), user_response_text (nullable), updated_at
- [ ] SaveExerciseProgressSchema exported: exerciseId (UUID), userResponse (max 10000 chars), status (optional enum)
- [ ] All 3 schemas use z.object(), proper UUID validation, string constraints
- [ ] Type exports: `export type Exercise = z.infer<typeof ExerciseSchema>` etc.
- [ ] Zod parse succeeds for spec examples (RF-001, RF-002, RF-003)
- [ ] Test: vitest unit test parses valid inputs, rejects invalid (invalid UUID, oversized response)

**Dependency:** None  
**Estimated:** 40 LOC

---

### Task 4a.3: Create saveExerciseProgress Server Action (Basic, No Retry)

**Type:** Server-side function  
**Files affected:**
- `src/lib/actions/exercises.ts` (new)

**Acceptance:**
- [ ] Signature: `async function saveExerciseProgress(exerciseId: string, userResponse: string, status?: 'in_progress'|'done'): Promise<{ success: boolean, updated_at?: string, error?: string }>`
- [ ] Validates input with SaveExerciseProgressSchema (Zod)
- [ ] Gets current user via getRequiredUser() (throws 401 if not logged in)
- [ ] Checks workshop_access.redeemed_at IS NOT NULL (explicit guard before upsert)
- [ ] Upserts exercise_progress: ignoreDuplicates: false (allows UPDATE on UNIQUE conflict), defaults status to 'in_progress' if undefined
- [ ] Returns { success: true, updated_at } on success
- [ ] Returns { success: false, error: "..." } on validation/auth/DB error
- [ ] No retry logic yet (will add in 4b)
- [ ] Test: vitest unit test mocks Supabase, verifies upsert call, correct status assignment

**Dependency:** Task 4a.1 (exercise_progress table) + Task 4a.2 (Zod schema)  
**Estimated:** 60 LOC

---

### Task 4a.4: Create ExerciseCard Component (UI Only, onChange Triggers Instant Save)

**Type:** UI component  
**Files affected:**
- `src/components/workshop/ExerciseCard.tsx` (new, Client Component)

**Acceptance:**
- [ ] Props: exerciseNumber, exercise {id, title, objective, prompt_text}, userResponse, status, onResponseChange callback, onMarkDone callback
- [ ] Render: number badge (with checkmark if status='done'), title, status badge (cyan/lime/gray color), objective with ⚡ icon
- [ ] Prompt block: monospace pre-wrap, CopyButton sub-component (RF-007)
- [ ] Textarea: controlled by state, value={userResponse}, onChange calls onResponseChange, min-height 84px, max-height 240px, focus cyan border
- [ ] "Listo" button: disabled if textarea empty, onClick calls onMarkDone, changes to "✓ Listo" (lime color) when status='done'
- [ ] Status badge: colors match design (gray pending, cyan in_progress, lime done)
- [ ] Mobile: responsive, no horizontal overflow, buttons accessible on 360px
- [ ] **NO autosave debounce yet** (4b task) — onChange just calls callback directly
- [ ] Test: Playwright test textarea typing updates state, button enable/disable works, status badge color changes

**Dependency:** Task 4a.2 (Zod schema for Exercise type)  
**Estimated:** 200 LOC

---

### Task 4a.5: Create CopyButton Sub-Component

**Type:** UI component  
**Files affected:**
- `src/components/workshop/CopyButton.tsx` (new, Client Component)

**Acceptance:**
- [ ] Props: text (string), label (default "Copiar prompt"), onSuccess callback
- [ ] Click: calls navigator.clipboard.writeText(text)
- [ ] On success: label changes to "Copiado", disabled for 2s, then reverts
- [ ] On failure: silent (no error toast in 4a; toast added in 4b)
- [ ] Styling: cyan text, hover glow, disabled opacity
- [ ] Test: Playwright test permission granted (test.use({ permissions: [...] })), verify clipboard content, label change

**Dependency:** None (can be developed in parallel with 4a.4)  
**Estimated:** 40 LOC (included in 4a.4 estimate or separate)

---

### Task 4a.6: Refactor TallerSection to Client Component

**Type:** UI component refactor  
**Files affected:**
- `src/components/workshop/sections/TallerSection.tsx` (modify from Server to Client)

**Acceptance:**
- [ ] Convert from Server Component to Client Component (add 'use client' directive)
- [ ] Props: content {type, title, instructions, placeholder}, exercises [], exerciseProgress [], onExerciseUpdate callback
- [ ] Render: title + instructions, placeholder if exercises.length === 0
- [ ] Map exercises sorted by order: `exercises.map((ex, i) => <ExerciseCard exerciseNumber={i+1} exercise={ex} userResponse={exerciseProgress[ex.id]?.user_response_text || ''} status={exerciseProgress[ex.id]?.status || 'pending'} onResponseChange={handleResponseChange} onMarkDone={() => handleMarkDone(ex.id)} />)`
- [ ] State: useState for textarea values (keyed by exercise_id)
- [ ] Callback onExerciseUpdate: called from parent when Server Action fires (placeholder for now, wired in 4b)
- [ ] Test: Playwright test exercises render in order, textarea changes update state

**Dependency:** Task 4a.4 (ExerciseCard)  
**Estimated:** 80 LOC

---

### Task 4a.7: Extend `/taller/[slug]/page.tsx` to Fetch Exercises + Progress

**Type:** Route + server-side logic  
**Files affected:**
- `src/app/(authenticated)/taller/[slug]/page.tsx` (modify from change 3)

**Acceptance:**
- [ ] Server Component existing fetch: workshop, user, sections, section_visits (from change 3)
- [ ] Add new fetches:
  - Exercises: SELECT id, title, objective, prompt_text, order FROM exercises WHERE workshop_id = $1 ORDER BY order ASC (RLS filters redeemed users only)
  - ExerciseProgress: SELECT exercise_id, status, user_response_text FROM exercise_progress WHERE user_id = $1 AND exercise_id IN (...) (RLS filters own rows only)
- [ ] Build exerciseProgress map: `{ [exercise_id]: progress_row }` for O(1) lookup
- [ ] Pass to Client wrapper: exercises, exerciseProgress map
- [ ] No Server Actions called from page (page only fetches data)
- [ ] Test: Playwright test authorized user loads route, exercises and progress visible

**Dependency:** Task 4a.1 (tables exist) + Task 4a.6 (TallerSection receives props)  
**Estimated:** 60 LOC

---

### Task 4a.8: Create seedExercises() Helper for E2E Tests

**Type:** Test infrastructure  
**Files affected:**
- `tests/helpers/seed-exercises.ts` (new)

**Acceptance:**
- [ ] Export: `async function seedExercises(workshopId: string, count?: number): Promise<string[]>`
- [ ] Idempotent: DELETE FROM exercises WHERE workshop_id = $1, then INSERT
- [ ] Insert sample exercises (4 realistic prompts in Rioplatense Spanish, per design D-10):
  - order 1: "Configura tu primer store de memoria" (algún tipo de setup)
  - order 2: "Implementá búsqueda semántica" (embeddings)
  - order 3: "Conectá tu storage a un LLM" (integration)
  - order 4: "Optimizá la búsqueda de memoria" (performance)
- [ ] Return: `data.map(row => row.id)`
- [ ] Uses supabaseAdmin client (from tests/fixtures/admin-client)
- [ ] Test: call helper, verify COUNT(*) from exercises = count

**Dependency:** Task 4a.1 (exercises table)  
**Estimated:** 50 LOC

---

### Task 4a.9: E2E Spec [4-1] — Exercise Card Render

**Type:** Test  
**Files affected:**
- `e2e/specs/workshop/[4-1]-exercise-card-render.spec.ts` (new)

**Acceptance:**
- [ ] Test: user with redeemed access navigates to /taller/workshop-slug
- [ ] Setup: beforeEach calls seedExercises(workshopId, 4)
- [ ] Verify: 4 exercise cards render with correct number badges (1, 2, 3, 4)
- [ ] Verify: each card displays title, objective (with ⚡), prompt text (monospace pre-wrap)
- [ ] Verify: textarea present, "Listo" button present
- [ ] Verify: "Listo" button disabled (no text in textarea initially)
- [ ] Verify: status badge shows "Pendiente" (gray color)
- [ ] Test coverage: RF-004 (render)

**Dependency:** Task 4a.8 (seedExercises)  
**Estimated:** 30 LOC

---

### Task 4a.10: E2E Spec [4-2] — Copy Prompt Button

**Type:** Test  
**Files affected:**
- `e2e/specs/workshop/[4-2]-copy-prompt.spec.ts` (new)

**Acceptance:**
- [ ] Test: user navigates to /taller, exercise card visible
- [ ] Setup: beforeEach adds `test.use({ permissions: ['clipboard-read', 'clipboard-write'] })`
- [ ] Click copy button (CopyButton in prompt block)
- [ ] Verify: button label changes to "Copiado"
- [ ] Verify: clipboard.readText() contains full prompt_text
- [ ] Wait 2.5s
- [ ] Verify: button label reverts to "Copiar prompt"
- [ ] Test coverage: RF-007 (copy)

**Dependency:** Task 4a.4 (ExerciseCard with CopyButton)  
**Estimated:** 25 LOC

---

### Task 4a.11: E2E Gate & Verification (Slice 4a)

**Type:** QA  
**Acceptance:**
- [ ] Run: `pnpm build` (no errors)
- [ ] Run: `pnpm lint` (no errors in src/components/workshop/*, src/lib/schemas/exercise.ts, src/lib/actions/exercises.ts)
- [ ] Run: `pnpm test` (vitest unit tests for Zod, saveExerciseProgress, seedExercises)
- [ ] Run: `pnpm test:e2e` with filter [4-1] and [4-2] only (both specs pass)
- [ ] Verify: no RLS errors (403 or 42501)
- [ ] Verify: no TypeScript errors (types infer correctly from Zod)

**Dependency:** All tasks 4a.1–4a.10  
**Estimated:** (execution time ~5 min, no new code)

---

### Task 4a.12: Commit & PR 4a

**Type:** VCS  
**Acceptance:**
- [ ] Commit message follows conventional: `feat(exercises): add migrations, card ui, and basic server action`
- [ ] PR title: "feat: Exercise autosave infrastructure (migrations, card, basic save action) [4a/4]"
- [ ] PR description: links to spec + design, describes slice 4a scope, lists blockers (B-1, B-2)
- [ ] All commits squashed or logically grouped
- [ ] No merge until Jennifer confirms migrations ran (B-1 + B-2 complete)

**Dependency:** All tasks 4a.1–4a.11  
**Estimated:** (mechanical)

---

## Slice 4b Tasks

**Scope:** Autosave debounce + retry logic + progress formula + "Guardado"/"Listo"/"Reabrir" state + mobile CSS + seed SQL doc + E2E tests [4b advanced]

**Target:** ~480 lines, autonomous, fully tested, mergeable independently (after 4a merged)

**Gate:** `pnpm build && pnpm lint && pnpm test && pnpm test:e2e [all]`

**Dependency:** Slice 4a merged to master

---

### Task 4b.1: Add Autosave Debounce to ExerciseCard

**Type:** Component enhancement  
**Files affected:**
- `src/components/workshop/ExerciseCard.tsx` (modify from 4a.4)

**Acceptance:**
- [ ] State: add `debouncedSaveTimeout: NodeJS.Timeout | null`
- [ ] useEffect with cleanup: clear timeout on unmount
- [ ] onChange handler: 
  - Update local textarea state instantly
  - Clear previous timer
  - Set new 1s timer (1000ms)
  - After 1s: call onResponseChange with 'in_progress' status (new callback signature)
  - Only save if textarea non-empty (trim check)
- [ ] Do NOT save if status='done' (textarea disabled anyway)
- [ ] Test: Playwright test rapid keystrokes (5 chars in < 1s each), verify only 1 Server Action call (debounce coalesces)
- [ ] Test: type, wait 1.5s, verify Server Action fires

**Dependency:** Task 4a.4 (ExerciseCard base)  
**Estimated:** 80 LOC

---

### Task 4b.2: Create saveWithRetry Wrapper (Exponential Backoff)

**Type:** Client-side utility  
**Files affected:**
- `src/lib/client/exercises-retry.ts` (new) — OR inline in ExerciseCard

**Acceptance:**
- [ ] Function: `async function saveWithRetry(exerciseId, userResponse, status, maxRetries=3, backoff=[3000,6000,9000]): Promise<{ success: boolean, error?: string }>`
- [ ] Loop: attempt 0 (immediate), if fails → attempt 1 (wait 3s), attempt 2 (wait 6s), attempt 3 (wait 9s)
- [ ] Calls saveExerciseProgress on each attempt
- [ ] On success: return { success: true }
- [ ] After 3 failed retries: return { success: false, error: "..." } (no throw)
- [ ] Silent retries (no UI feedback until exhaustion)
- [ ] Test: vitest mock saveExerciseProgress to fail, verify retry sequence and final error

**Dependency:** Task 4a.3 (saveExerciseProgress exists)  
**Estimated:** 50 LOC

---

### Task 4b.3: Wire saveWithRetry into ExerciseCard

**Type:** Component enhancement  
**Files affected:**
- `src/components/workshop/ExerciseCard.tsx` (modify from 4b.1)

**Acceptance:**
- [ ] Import saveWithRetry
- [ ] onChange handler: call saveWithRetry instead of onResponseChange (or wrap onResponseChange)
- [ ] State: add `saveStatus: 'idle'|'saving'|'saved'|'error'`
- [ ] On saveWithRetry call: setStatus('saving')
- [ ] On success: setStatus('saved'), then setTimeout(() => setStatus('idle'), 2000)
- [ ] On error: setStatus('error'), dispatch toast event (will wire in 4b.5)
- [ ] Test: Playwright test autosave sequence, "Guardado" indicator appears (4b.4)

**Dependency:** Task 4b.1 (autosave debounce) + Task 4b.2 (saveWithRetry)  
**Estimated:** (included in 4b.1)

---

### Task 4b.4: Add "Guardado" Indicator Component

**Type:** UI component  
**Files affected:**
- `src/components/workshop/ExerciseCard.tsx` (modify)

**Acceptance:**
- [ ] Render: inline after "Listo" button, conditional: `{saveStatus === 'saved' && <SavedIndicator />}`
- [ ] SavedIndicator: `<span className="text-lime animate-fade-out">Guardado</span>`
- [ ] CSS keyframe `animate-fade-out`: opacity 1→0 over 2s
- [ ] Test: Playwright test autosave succeeds, "Guardado" appears, fades after 2s

**Dependency:** Task 4b.3 (saveStatus state)  
**Estimated:** 30 LOC

---

### Task 4b.5: Implement Error Toast for Retry Exhaustion

**Type:** UI integration  
**Files affected:**
- `src/components/toast/Toast.tsx` (create if not exists from change 3, otherwise modify)
- `src/components/workshop/ExerciseCard.tsx` (modify to dispatch toast event)

**Acceptance:**
- [ ] Toast root component: renders toast notifications, dismissible, auto-dismiss 5s
- [ ] ExerciseCard: on saveWithRetry error, dispatch custom event or call toast function: `showErrorToast('No pudimos guardar tu respuesta. Intentá copiar tu texto.')`
- [ ] Toast appears with error styling (red/orange tone)
- [ ] Test: Playwright test [4-4] mocks saveExerciseProgress to fail, verifies toast appears after 3 retries

**Dependency:** Task 4b.2 (saveWithRetry returns error)  
**Estimated:** 50 LOC (shared with root toast if doesn't exist)

---

### Task 4b.6: Implement "Listo" Button State Machine

**Type:** Component enhancement  
**Files affected:**
- `src/components/workshop/ExerciseCard.tsx` (modify)

**Acceptance:**
- [ ] Button onClick behavior:
  - If status !== 'done': call saveWithRetry(exerciseId, userResponse, 'done')
  - If status === 'done': call saveWithRetry(exerciseId, userResponse, 'in_progress') — "Reabrir"
- [ ] On success: update local status state
- [ ] Button label:
  - pending/in_progress: "Listo" (cyan color)
  - done: "✓ Listo" with checkmark, lime color, disabled (no click during done state)
- [ ] Textarea:
  - disabled (read-only) when status='done'
  - enabled when status!='done'
- [ ] Status badge color updates: gray→cyan→lime
- [ ] No race condition: if autosave pending and user clicks "Listo", queue "Listo" call (use Promise chaining or track pending state)
- [ ] Test: Playwright test [4-5] click "Listo", verify status='done' in DB, button changes to "Reabrir"
- [ ] Test: Playwright test click "Reabrir", verify status='in_progress', textarea re-enabled

**Dependency:** Task 4b.2 (saveWithRetry)  
**Estimated:** 50 LOC

---

### Task 4b.7: Extend getWorkshopProgress to Exercise-Aware Formula

**Type:** Server-side helper enhancement  
**Files affected:**
- `src/lib/actions/workshop-sections.ts` (modify from change 3)

**Acceptance:**
- [ ] Existing getWorkshopProgress: returns number (percentage) based on section_visits
- [ ] **Rename to getExerciseAwareProgress** (or extend existing, keep backward compat):
  - `async function getExerciseAwareProgress(userId, workshopId): Promise<{ progressPercent: number, sectionsVisited: number, exercisesDone: number, totalExercises: number }>`
- [ ] Fetch:
  - Count distinct section_type from section_visits WHERE user_id = $1 (keep for backward compat)
  - Count exercises for workshop: SELECT COUNT(*) FROM exercises WHERE workshop_id = $1
  - Count done exercises: SELECT COUNT(*) FROM exercise_progress WHERE user_id = $1 AND status='done' AND exercise_id IN (select id from exercises where workshop_id=$2)
- [ ] Formula: `(sectionsVisited + exercisesDone) / (5 + totalExercises) * 100`
- [ ] Edge case: if totalExercises = 0, fallback to `sectionsVisited / 5 * 100` (backward compatible with change 3)
- [ ] Return structure includes breakdowns for ProgressBar display
- [ ] Test: vitest calculate (2 sections + 2 exercises / 5 + 4) = 44%

**Dependency:** Task 4a.1 (exercise_progress table)  
**Estimated:** 70 LOC

---

### Task 4b.8: Update ProgressBar to Use Exercise-Aware Formula

**Type:** Component enhancement  
**Files affected:**
- `src/components/workshop/ProgressBar.tsx` (modify from change 3)

**Acceptance:**
- [ ] Change data source: instead of static percentage, fetch via getExerciseAwareProgress
- [ ] Props: progressPercent (from parent), totalItems breakdown (sectionsVisited, totalSections, exercisesDone, totalExercises)
- [ ] Display: "X of Y" format showing (visitadas + exercises_done) of (5 + total_exercises)
- [ ] Render: percentage bar + text label
- [ ] Animate: bar updates smoothly on prop change (CSS transition)
- [ ] Test: Playwright test [4-6] verify formula display

**Dependency:** Task 4b.7 (getExerciseAwareProgress)  
**Estimated:** 40 LOC

---

### Task 4b.9: Extend page.tsx to Fetch Exercise-Aware Progress

**Type:** Route enhancement  
**Files affected:**
- `src/app/(authenticated)/taller/[slug]/page.tsx` (modify from 4a.7)

**Acceptance:**
- [ ] Existing fetch from 4a.7: workshop, user, sections, exercises, exerciseProgress
- [ ] Add: call getExerciseAwareProgress(userId, workshopId)
- [ ] Pass progress breakdown to Client wrapper (ProgressBar component)
- [ ] No additional queries beyond 4a.7 (reuse fetched data)

**Dependency:** Task 4b.7 (getExerciseAwareProgress) + Task 4b.8 (ProgressBar update)  
**Estimated:** (included in 4b.7–4b.8)

---

### Task 4b.10: Add Mobile Responsive CSS for Exercises

**Type:** Styling  
**Files affected:**
- `src/app/globals.css` (modify) — OR `src/components/workshop/ExerciseCard.tsx` (scoped CSS)

**Acceptance:**
- [ ] Textarea: min-height 84px, max-height 50vh (respects keyboard height on mobile), resize: vertical
- [ ] Card padding: 20px on desktop, 16px on mobile (360px)
- [ ] Buttons: flex-wrap: wrap on mobile, gap shrink from 20px to 8px on 360px
- [ ] Copy button: inline with prompt block, doesn't overflow
- [ ] Number badge: fixed 34×34px, no shrink
- [ ] Title text: wraps, no fixed width
- [ ] Prompt monospace: white-space: pre-wrap, overflow-x: auto (if needed) but scrolls inside prompt block, not card
- [ ] Test: Playwright test 360px viewport (mobile), verify no horizontal overflow, all UI accessible

**Dependency:** Task 4a.4 (ExerciseCard exists)  
**Estimated:** 50 LOC

---

### Task 4b.11: Create Seed SQL Doc for Jennifer (16 Exercises)

**Type:** Documentation + SQL  
**Files affected:**
- `docs/database/seed-exercises.sql` (new)

**Acceptance:**
- [ ] SQL file with INSERT statements for 4 exercises per workshop (total 16 exercises, 4 workshops from fixture)
- [ ] 4 workshops: engram, vector-search, rag, prompt-engineering (from spec fixtures)
- [ ] Per workshop: 4 exercises with order 1-4, realistic prompts (50-100 words each) in Rioplatense Spanish
- [ ] Examples from design D-12 (Configura tu primer store de memoria, Implementá búsqueda semántica, etc.)
- [ ] Format: `INSERT INTO public.exercises (workshop_id, title, objective, prompt_text, "order") VALUES (...)`
- [ ] Idempotent note: if run twice, will get UNIQUE violation (workshop_id, order). User can DELETE first or fix.
- [ ] Instructions: "Copy-paste into Supabase SQL Editor or run via psql"
- [ ] Test: manually verify file parses, SQL syntax valid

**Dependency:** Task 4a.1 (exercises table schema)  
**Estimated:** 60 LOC

---

### Task 4b.12: E2E Spec [4-3] — Autosave on Input

**Type:** Test  
**Files affected:**
- `e2e/specs/workshop/[4-3]-autosave-on-input.spec.ts` (new)

**Acceptance:**
- [ ] User types in exercise textarea
- [ ] Wait 1.5s (longer than 1s debounce)
- [ ] Query DB via admin client: SELECT user_response_text, status FROM exercise_progress WHERE user_id = $1 AND exercise_id = $2
- [ ] Verify: user_response_text = typed text, status = 'in_progress'
- [ ] Test coverage: RF-008 (autosave debounce)

**Dependency:** Task 4b.1 (autosave debounce)  
**Estimated:** 35 LOC

---

### Task 4b.13: E2E Spec [4-4] — Autosave Failure & Retry

**Type:** Test  
**Files affected:**
- `e2e/specs/workshop/[4-4]-autosave-failure-retry.spec.ts` (new)

**Acceptance:**
- [ ] Mock/intercept Server Action saveExerciseProgress to fail (return error or throw)
- [ ] User types in textarea
- [ ] After 1.5s, autosave fires and fails
- [ ] Verify: retries happen (check network tab or mock call count)
- [ ] After 3 failed retries (~12s total: 3s + 6s + 9s delays), verify error toast appears: "No pudimos guardar..."
- [ ] Verify: textarea data still present (not cleared)
- [ ] Manually resolve mock to succeed, user can retry or save again (optional for v1)
- [ ] Test coverage: RF-009 (retry logic)

**Dependency:** Task 4b.2 (saveWithRetry) + Task 4b.5 (error toast)  
**Estimated:** 40 LOC

---

### Task 4b.14: E2E Spec [4-5] — Mark as Done / Reabrir

**Type:** Test  
**Files affected:**
- `e2e/specs/workshop/[4-5]-mark-as-done.spec.ts` (new)

**Acceptance:**
- [ ] User types response text
- [ ] Click "Listo" button
- [ ] Verify: button changes to "✓ Listo" (lime color), disabled
- [ ] Verify: textarea becomes read-only (disabled)
- [ ] Query DB: status = 'done'
- [ ] Click "Reabrir" button (appears when status='done')
- [ ] Verify: button changes back to "Listo", enabled
- [ ] Verify: textarea becomes editable again
- [ ] Type more text, verify autosave still works
- [ ] Test coverage: RF-010, RF-014

**Dependency:** Task 4b.6 ("Listo"/"Reabrir" state machine)  
**Estimated:** 35 LOC

---

### Task 4b.15: E2E Spec [4-6] — Progress Formula Exercise-Aware

**Type:** Test  
**Files affected:**
- `e2e/specs/workshop/[4-6]-progress-exercise-aware.spec.ts` (new)

**Acceptance:**
- [ ] Setup: workshop has 4 exercises (via seedExercises)
- [ ] User visits 2 sections (Inicio, Aprendizaje)
- [ ] User marks 2 exercises done (click "Listo" twice)
- [ ] Verify progress bar displays: (2 + 2) / (5 + 4) = 44%
- [ ] Also test edge case: workshop with 0 exercises, 2 sections visited → 2/5 = 40% (fallback formula)
- [ ] Test coverage: RF-012, RF-013

**Dependency:** Task 4b.8 (ProgressBar with formula)  
**Estimated:** 35 LOC

---

### Task 4b.16: E2E Spec [4-7] — RLS: Unauthorized User Cannot See Exercises

**Type:** Test  
**Files affected:**
- `e2e/specs/workshop/[4-7]-exercise-rls-unauthorized.spec.ts` (new)

**Acceptance:**
- [ ] User without redeemed workshop_access attempts to navigate /taller/workshop-slug
- [ ] Verify: 403 or redirect to /catalogo (per route implementation)
- [ ] Verify: no exercises or exercise_progress rows visible (RLS blocks)
- [ ] Test via admin client: SELECT exercises WHERE workshop_id = ... as unauthorized_user → 0 rows
- [ ] Test coverage: RF-012 (RLS unauthorized)

**Dependency:** Task 4a.1 (RLS policies)  
**Estimated:** 25 LOC

---

### Task 4b.17: E2E Spec [4-8] — Persistence: Close & Reopen Browser

**Type:** Test  
**Files affected:**
- `e2e/specs/workshop/[4-8]-exercise-progress-persistence.spec.ts` (new)

**Acceptance:**
- [ ] User types response, waits for autosave (1.5s)
- [ ] User marks 1 exercise done (status='done')
- [ ] Close browser tab (or navigate away + back)
- [ ] Reopen workshop page (/taller/workshop-slug)
- [ ] Verify: same exercise response text visible in textarea
- [ ] Verify: status still 'done', button shows "Reabrir"
- [ ] Verify: progress bar reflects same completion state
- [ ] Test coverage: RF-014 (persistence)

**Dependency:** Task 4b.12 (autosave) + Task 4b.14 (mark done)  
**Estimated:** 30 LOC

---

### Task 4b.18: E2E Gate & Verification (Slice 4b)

**Type:** QA  
**Acceptance:**
- [ ] Run: `pnpm build` (no errors)
- [ ] Run: `pnpm lint` (no errors in 4b changes)
- [ ] Run: `pnpm test` (vitest: saveWithRetry retry logic, getExerciseAwareProgress formula)
- [ ] Run: `pnpm test:e2e` (all 10 specs [4-1] through [4-8] pass, plus inherited [3-*] tests from change 3)
- [ ] No regressions: workshop-sections specs still pass (progress bar, navigation)
- [ ] No RLS leaks: unauthorized users see no exercises
- [ ] Mobile 360px: all UI accessible without horizontal scroll

**Dependency:** All tasks 4b.1–4b.17  
**Estimated:** (execution time ~8 min, no new code)

---

### Task 4b.19: Commit & PR 4b

**Type:** VCS  
**Acceptance:**
- [ ] Commit message: `feat(exercises): autosave debounce, retry logic, progress formula [4b/4]`
- [ ] PR title: "feat: Exercise autosave with debounce, retry, and progress formula [4b/4]"
- [ ] PR description: links to spec + design, describes 4b scope, how 4b depends on 4a
- [ ] Cherry-pick against 4a merged commit (branch from 4a, rebase if needed)
- [ ] All e2e tests pass
- [ ] Ready to merge after review

**Dependency:** All tasks 4b.1–4b.18 + slice 4a merged to master  
**Estimated:** (mechanical)

---

## Task Dependencies & Parallelization

### Slice 4a Dependency Graph

```
4a.1 (migrations) → 4a.2 (schemas) → 4a.3 (Server Action)
                 ↓
            4a.4 (ExerciseCard)
            4a.5 (CopyButton) — parallel with 4a.4
                 ↓
            4a.6 (TallerSection refactor)
                 ↓
            4a.7 (page.tsx extend)
                 ↓
            4a.8 (seedExercises helper)
                 ↓
        4a.9, 4a.10 (E2E tests) — parallel
                 ↓
            4a.11 (gate)
                 ↓
            4a.12 (commit & PR)
```

**Parallelizable:** 4a.4 + 4a.5 can start after 4a.2; 4a.9 + 4a.10 can start after 4a.8.

### Slice 4b Dependency Graph

```
4a.merged → 4b.1 (autosave debounce)
               ↓
            4b.2 (saveWithRetry)
               ↓
            4b.3 (wire into card)
               ↓
            4b.4 (Guardado indicator)
               ↓
4b.2, 4b.4 → 4b.5 (toast)
               ↓
            4b.6 (Listo/Reabrir state)

4a.merged → 4b.7 (getExerciseAwareProgress)
               ↓
            4b.8 (ProgressBar update)
               ↓
            4b.9 (page.tsx extend)

4b.1–4b.6 + 4b.8 → 4b.10 (mobile CSS)
                 → 4b.11 (seed SQL doc)

4b.1–4b.8 → 4b.12–4b.17 (E2E tests) — parallel
                 ↓
            4b.18 (gate)
                 ↓
            4b.19 (commit & PR)
```

**Parallelizable:** 
- Autosave track (4b.1–4b.6) and progress formula track (4b.7–4b.9) can start in parallel
- E2E tests (4b.12–4b.17) can start once their respective components are implemented

---

## Commit Strategy

### Slice 4a Commits (Logical Grouping)

1. **Migrations + Schemas:**
   - `supabase/migrations/...` (2 files)
   - `src/lib/schemas/exercise.ts`
   - Message: `chore(migrations): add exercises and exercise_progress tables with RLS`

2. **Server Action + Basic Components:**
   - `src/lib/actions/exercises.ts`
   - `src/components/workshop/ExerciseCard.tsx`
   - `src/components/workshop/CopyButton.tsx`
   - Message: `feat(exercises): add ExerciseCard component and saveExerciseProgress action`

3. **Page Layout + Data Fetching:**
   - `src/components/workshop/sections/TallerSection.tsx` (refactor)
   - `src/app/(authenticated)/taller/[slug]/page.tsx` (extend)
   - Message: `feat(exercises): refactor TallerSection to Client, add exercise data fetch`

4. **Test Infrastructure + E2E:**
   - `tests/helpers/seed-exercises.ts`
   - `e2e/specs/workshop/[4-1]-exercise-card-render.spec.ts`
   - `e2e/specs/workshop/[4-2]-copy-prompt.spec.ts`
   - Message: `test(exercises): add seed helper and basic e2e tests`

### Slice 4b Commits (Logical Grouping)

1. **Autosave + Retry Logic:**
   - `src/components/workshop/ExerciseCard.tsx` (add debounce, state machine)
   - `src/lib/client/exercises-retry.ts` (saveWithRetry)
   - Message: `feat(exercises): add autosave with 1s debounce and exponential retry`

2. **Progress Formula:**
   - `src/lib/actions/workshop-sections.ts` (getExerciseAwareProgress)
   - `src/components/workshop/ProgressBar.tsx` (update to exercise-aware)
   - `src/app/(authenticated)/taller/[slug]/page.tsx` (fetch progress data)
   - Message: `feat(exercises): implement exercise-aware progress formula`

3. **UI Polish:**
   - `src/app/globals.css` (mobile responsive rules)
   - `src/components/workshop/ExerciseCard.tsx` (add Guardado indicator, button state)
   - `src/components/toast/Toast.tsx` (or modify if exists)
   - Message: `feat(exercises): add Guardado indicator, Listo/Reabrir states, mobile responsive`

4. **Seed Data + E2E:**
   - `docs/database/seed-exercises.sql`
   - `e2e/specs/workshop/[4-3]–[4-8]-*.spec.ts` (6 specs)
   - Message: `test(exercises): add seed SQL and comprehensive e2e test suite`

---

## Riesgos Cacheados del Diseño

### Risk 1: Autosave Race Condition (Listo Click During Debounce Pending)

**Source:** Design D-3, Risk section  
**Likelihood:** Medium  
**Impact:** User clicks "Listo" while 1s autosave timer running → both calls fire, potential double-update or inconsistent state

**Mitigation:**
- Check `saveStatus` state before "Listo" click
- If `saveStatus='saving'`, queue "Listo" mutation (Promise chaining: wait for autosave, then call markDone)
- Or: cancel debounce timer on "Listo" click, call saveWithRetry directly with status='done'

**Task:** 4b.6 must include race condition handling logic

**Test:** 4b.13 (autosave-failure-retry) can simulate this by slowing network

---

### Risk 2: Copy Button Permissions in E2E (Playwright Mobile)

**Source:** Design D-11, Risk section  
**Likelihood:** Medium  
**Impact:** Playwright e2e on mobile (or headless) may not have clipboard access

**Mitigation:**
- Add `test.use({ permissions: ['clipboard-read', 'clipboard-write'] })` in test file
- Already done for change 3 tests (precedent)

**Task:** 4a.10 must include permission setup

**Test:** 4a.10 verifies clipboard content

---

### Risk 3: RLS Upsert with ignoreDuplicates=false + UPDATE Policy

**Source:** Divergence reconciliation (B-1, B-3)  
**Likelihood:** Medium → Low (after mitigation)  
**Impact:** Without UPDATE policy on exercise_progress, second autosave triggers RLS 42501 error

**Mitigation:**
- B-1 REQUIRES migration to include 3 RLS policies: SELECT, INSERT, **UPDATE** (all checking user_id = auth.uid())
- ignoreDuplicates: false allows conflict, UPDATE policy provides second defense
- This is a proven pattern inversion of change 3 (change 3: ignoreDuplicates=true prevents UPDATE; this change: ignoreDuplicates=false requires UPDATE policy)

**Task:** 4a.1 must include UPDATE policy in migration

**Test:** 4a.11 (gate) must not error 42501; 4b.13 (retry) tests multiple saves of same exercise

---

### Risk 4: Exercise Count = 0 (No Exercises Yet, Progress Formula Breaks)

**Source:** Design D-8, Edge Cases  
**Likelihood:** Low  
**Impact:** If workshop.exercises.length = 0, formula denominator = 5, but calculation assumes exercises exist

**Mitigation:**
- Fallback in getExerciseAwareProgress: if totalExercises = 0, use visitadas / 5 (matches change 3 behavior)
- Placeholder message in TallerSection if exercises.length = 0

**Task:** 4b.7 (getExerciseAwareProgress) must include fallback

**Test:** 4b.15 (progress formula) includes edge case test

---

### Risk 5: Textarea Overflow on Mobile 360px

**Source:** Design D-11, Risk section  
**Likelihood:** Low  
**Impact:** Long exercise response + keyboard overlay → textarea hidden or unscrollable

**Mitigation:**
- CSS max-height: 50vh (respects keyboard height on mobile)
- resize: vertical allows user to shrink if needed
- Focus behavior: browser native (scrolls into view)

**Task:** 4b.10 (mobile CSS) must include textarea constraints

**Test:** E2E on 360px viewport (mobile), manual QA on real device

---

### Risk 6: Autosave Retry Toast Not Visible

**Source:** Design D-6, Risk section  
**Likelihood:** Low  
**Impact:** Toast component doesn't exist or isn't wired → retry exhaustion error goes silent

**Mitigation:**
- Check if Toast exists from change 3
- If not, create in 4b.5
- Wire dispatch in ExerciseCard on saveWithRetry error

**Task:** 4b.5 (error toast) must verify Toast exists or create it

**Test:** 4b.13 (autosave-failure-retry) asserts toast appears

---

### Risk 7: Autosave Debounce vs. onBlur (Textarea loses focus quickly)

**Source:** Design D-3  
**Likelihood:** Low  
**Impact:** User types, tabs away before 1s debounce fires → data not saved

**Mitigation:**
- Design D-3 includes `handleBlurSave`: save on textarea blur without additional debounce
- Fallback: if user tabs away, blur handler saves immediately

**Task:** 4b.1 (autosave) must include onBlur handler (optional in 4a.4, wired in 4b.1)

---

## Divergence Reconciliation Summary

**Change 3 Pattern (Section Visits):**
- Table: section_visits (simple tracking, no UPDATE needed)
- Strategy: `ignoreDuplicates: true` (silently ignore duplicates, no UPDATE)
- Reason: section_visits only tracks visitation, never changes

**This Change Pattern (Exercise Progress):**
- Table: exercise_progress (stateful tracking: pending → in_progress → done + user_response_text)
- Strategy: `ignoreDuplicates: false` (allow UPDATE on UNIQUE conflict)
- Reason: exercise_progress needs both INSERT (first visit) and UPDATE (autosave, mark done)
- RLS Defense: UPDATE policy with `USING (user_id = auth.uid())` blocks unauthorized updates

**Key Insight:** The pattern inversion is correct because the tables have different update semantics. Section visits are append-only; exercise progress is mutable. Both approaches are safe under RLS when used correctly.

**Encoded in:** Task 4a.1 (migration with UPDATE policy), Task 4b.6 (state machine calls saveWithRetry with status='done'), Risk 3 mitigation.

---

## Acceptance & Sign-Off

**Spec → Tasks Alignment:**
- [x] RF-001 (exercises table) → Task 4a.1
- [x] RF-002 (exercise_progress table) → Task 4a.1, Risk 3
- [x] RF-003 (Server Action) → Task 4a.3, 4b.2
- [x] RF-004 (ExerciseCard render) → Task 4a.4, Test 4a.9
- [x] RF-005 (TallerSection refactor) → Task 4a.6
- [x] RF-006 (Fetch exercises) → Task 4a.7
- [x] RF-007 (CopyButton) → Task 4a.5, Test 4a.10
- [x] RF-008 (Autosave debounce) → Task 4b.1, Test 4b.12
- [x] RF-009 (Retry logic) → Task 4b.2, Test 4b.13
- [x] RF-010 (Listo button) → Task 4b.6, Test 4b.14
- [x] RF-011 (Guardado indicator) → Task 4b.4, Test 4b.14
- [x] RF-012 (Progress formula) → Task 4b.7, Test 4b.15
- [x] RF-013 (Optimistic progress) → Task 4b.8
- [x] RF-014 (State machine) → Task 4b.6, Test 4b.14
- [x] RF-015 (Mobile 360px) → Task 4b.10, E2E tests

**Design → Tasks Alignment:**
- [x] D-1 (SQL migrations) → Task 4a.1
- [x] D-2 (ExerciseCard API) → Task 4a.4
- [x] D-3 (Autosave useEffect) → Task 4b.1
- [x] D-4 (Server Action idempotent) → Task 4a.3
- [x] D-5 (Retry exponential) → Task 4b.2
- [x] D-6 (Guardado + toast) → Task 4b.4, 4b.5
- [x] D-7 (Listo state machine) → Task 4b.6
- [x] D-8 (Progress formula) → Task 4b.7
- [x] D-9 (Page data fetch) → Task 4a.7, 4b.9
- [x] D-10 (seedExercises helper) → Task 4a.8
- [x] D-11 (Mobile CSS) → Task 4b.10
- [x] D-12 (Seed SQL) → Task 4b.11

**Pre-Apply Blockers:**
- [x] B-1 (migrations run) → depends on Jennifer before e2e gate 4a
- [x] B-2 (seed exercises) → depends on Task 4a.8 + Jennifer
- [x] B-3 (design locked) → no blockers, all decisions finalized

**Ready for apply.** All tasks scoped, dependencies mapped, risks documented.

---

## Next Recommended Phases

1. **sdd-apply** (batch 1, slice 4a) — Implement tasks 4a.1–4a.12, test, PR to master
2. **Jennifer** (manual step) — Run migrations + seed exercises (B-1, B-2)
3. **E2E Gate 4a** — `pnpm test:e2e [4-1] [4-2]` (task 4a.11)
4. **PR 4a Merge** (task 4a.12)
5. **sdd-apply** (batch 2, slice 4b) — Implement tasks 4b.1–4b.19, test, PR to master
6. **E2E Gate 4b** — `pnpm test:e2e [4-1]–[4-8]` full suite (task 4b.18)
7. **PR 4b Merge** (task 4b.19)
8. **sdd-verify** — Validate both PRs against spec
9. **sdd-archive** — Close change

---

**Tasks artifact by:** sdd-tasks (automated)  
**Date:** 2026-06-16  
**Artifact store:** openspec  
**Next phase:** sdd-apply (slice 4a)
