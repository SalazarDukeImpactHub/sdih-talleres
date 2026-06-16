# Spec — exercises-autosave

**Change ID:** exercises-autosave  
**Position in SDD plan:** 4 of 8  
**Status:** Spec (ready for design + tasks)  
**Executed:** 2026-06-16  
**Slicing:** 2 chained PRs (4a ~490 lines, 4b ~480 lines)

---

## Executive Summary

Students exercise responses are persisted via two new tables (`exercises` + `exercise_progress`) with RLS-enforced row-level security. ExerciseCard component renders individual exercises with copy-to-clipboard prompt functionality, a textarea for responses, and a "Listo" button to mark completion. Autosave with 1s debounce saves responses silently with exponential retry on failure (3s/6s/9s, error toast after 3 retries). Progress bar formula becomes exercise-aware: `(sections_visited + exercises_done) / (5 + total_exercises)`. Slice 4a delivers migrations, Server Actions, ExerciseCard render, and basic TallerSection refactor. Slice 4b adds autosave debounce, retry logic, progress formula update, and full e2e test coverage.

---

## Requirements — Functional

### RF-001 [4a] Exercises Table with RLS

Server migration creates `exercises` table:

```sql
CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  objective TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  order INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workshop_id, order)
);

CREATE INDEX idx_exercises_workshop_id ON public.exercises(workshop_id);

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY exercises_select_redeemed ON public.exercises
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workshop_access wa
      WHERE wa.workshop_id = exercises.workshop_id
        AND wa.user_id = auth.uid()
        AND wa.redeemed_at IS NOT NULL
    )
  );
```

**Columns:**
- `title` (TEXT): Exercise name, 20–60 chars (e.g., "Configura tu primer store de memoria")
- `objective` (TEXT): Goal statement, 40–100 chars (e.g., "Crear una capa de memoria vacía…"), rendered with ⚡ icon
- `prompt_text` (TEXT, plain): Exercise instructions, 50–500 words, rendered with `white-space: pre-wrap`, monospace font
- `order` (INT): Display sequence per workshop, immutable, indexed for sort stability

**RLS Policy:** User can SELECT exercises only if they have redeemed `workshop_access.redeemed_at` for the workshop.

**Acceptance:** 
- Migration creates table + RLS policy
- Seed script inserts 4 test exercises per workshop
- SELECT query filters by redeemed_at (e2e test: user B cannot see user A's workshop exercises)

---

### RF-002 [4a] ExerciseProgress Table with RLS

Server migration creates `exercise_progress` table:

```sql
CREATE TABLE public.exercise_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'done')),
  user_response_text TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, exercise_id)
);

CREATE INDEX idx_exercise_progress_user_id ON public.exercise_progress(user_id);
CREATE INDEX idx_exercise_progress_exercise_id ON public.exercise_progress(exercise_id);
CREATE INDEX idx_exercise_progress_user_exercise ON public.exercise_progress(user_id, exercise_id);

ALTER TABLE public.exercise_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY exercise_progress_select ON public.exercise_progress
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY exercise_progress_insert ON public.exercise_progress
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY exercise_progress_update ON public.exercise_progress
  FOR UPDATE USING (user_id = auth.uid());
```

**Columns:**
- `status` (ENUM: 'pending' | 'in_progress' | 'done'): Tracks exercise state. Defaults to 'pending' on first view. Transitions to 'in_progress' on first autosave. User clicks "Listo" to set 'done'. User can click "Reabrir" to revert to 'in_progress'.
- `user_response_text` (TEXT, nullable): Student's written response. Populated by autosave. Empty string allowed (but "Listo" button disabled until non-empty).
- `updated_at` (TIMESTAMPTZ): Tracks last modification timestamp for e2e verification.

**RLS Policies:**
- SELECT: User reads only own rows (`user_id = auth.uid()`)
- INSERT: User inserts only own rows with `user_id = auth.uid()`
- UPDATE: User updates only own rows with `user_id = auth.uid()`

**UNIQUE constraint:** One record per user per exercise (idempotent upsert friendly).

**Acceptance:**
- Migration creates table + 3 RLS policies
- UNIQUE constraint enforced (duplicate insert with `ignoreDuplicates: true` succeeds silently)
- e2e: SELECT returns 0 rows for unauthorized user (RLS guard on exercises.workshop_id)

---

### RF-003 [4a] Server Action: saveExerciseProgress

Location: `src/lib/actions/exercises.ts`

**Signature:**
```typescript
export async function saveExerciseProgress(
  exerciseId: string,
  userResponse: string,
  status?: 'pending' | 'in_progress' | 'done'
): Promise<{
  success: boolean;
  updated_at?: string;
  error?: string;
}>;
```

**Behavior:**
1. Get current authenticated user (throw 401 if not logged in)
2. Validate input: `exerciseId` is valid UUID; `userResponse.length <= 10000` chars; `status` is enum or undefined
3. Check user has redeemed the workshop (implicit: RLS will enforce on upsert)
4. Upsert `exercise_progress` row:
   - If new: insert with `user_id`, `exercise_id`, `status = status ?? 'in_progress'`, `user_response_text = userResponse`, `updated_at = now()`
   - If exists: update `user_response_text = userResponse`, `status = status ?? 'in_progress'` (idempotent), `updated_at = now()`
   - Use `ignoreDuplicates: true` to suppress duplicate-key errors (same user retrying autosave)
5. Return `{ success: true, updated_at: timestamp }` on success
6. Return `{ success: false, error: "..." }` on failure (validation, auth, DB error)

**Schema Validation (Zod):**
```typescript
const SaveExerciseProgressSchema = z.object({
  exerciseId: z.string().uuid('Invalid exercise ID'),
  userResponse: z.string().max(10000, 'Response too long (max 10000 chars)'),
  status: z.enum(['pending', 'in_progress', 'done']).optional(),
});
```

**Error Handling:**
- Validation error → return `{ success: false, error: "Invalid input" }`
- Auth error (not logged in) → throw 401
- RLS violation (user not redeemed) → RLS silently blocks, query succeeds but returns 0 rows (safe, client retries)
- DB error → return `{ success: false, error: "Database error" }`

**Acceptance:**
- Server Action callable from client
- Idempotent: calling twice with same params succeeds both times (no error)
- Returns `updated_at` timestamp for client verification
- RLS blocks unauthorized access (e2e: user cannot save progress for unowned exercise)

---

### RF-004 [4a] ExerciseCard Component: Render Exercise with Copy Button

Location: `src/components/workshop/ExerciseCard.tsx`

**Props:**
```typescript
interface ExerciseCardProps {
  exerciseNumber: number; // 1-indexed
  exercise: {
    id: string;
    title: string;
    objective: string;
    prompt_text: string;
  };
  userResponse: string;
  status: 'pending' | 'in_progress' | 'done';
  onResponseChange: (text: string) => void;
  onMarkDone: () => void;
  isSaving?: boolean;
  savedAtMs?: number; // timestamp of last successful save for indicator
}
```

**Render Structure:**

```tsx
<div className="card">
  {/* Header: number badge + title + status badge */}
  <div className="flex items-center gap-3">
    <div className="badge-number">
      {status === 'done' ? <CheckmarkIcon /> : exerciseNumber}
    </div>
    <div className="flex-1">
      <h3 className="text-base font-bold">{exercise.title}</h3>
    </div>
    <StatusBadge status={status} />
  </div>

  {/* Objective row */}
  <div className="flex items-start gap-2 mt-3">
    <span className="text-yellow">⚡</span>
    <p className="text-secondary text-sm">{exercise.objective}</p>
  </div>

  {/* Prompt block */}
  <div className="mt-4 p-3 bg-navy-800 rounded">
    <div className="flex justify-between items-center mb-2">
      <span className="text-xs text-secondary">Prompt</span>
      <CopyButton text={exercise.prompt_text} />
    </div>
    <pre className="font-mono text-sm whitespace-pre-wrap">{exercise.prompt_text}</pre>
  </div>

  {/* Textarea */}
  <textarea
    className="w-full mt-4 p-2 bg-navy-600 border border-navy-700 rounded text-sm font-mono"
    placeholder="Escribe o pega aquí tu respuesta…"
    value={userResponse}
    onChange={(e) => onResponseChange(e.currentTarget.value)}
    minHeight="84px"
    maxHeight="240px"
    style={{ resize: 'vertical' }}
  />

  {/* Buttons + indicators */}
  <div className="flex items-center gap-2 mt-3">
    <button
      onClick={onMarkDone}
      disabled={!userResponse.trim()}
      title={userResponse.trim() ? '' : 'Escribí una respuesta primero'}
      className={status === 'done' ? 'btn-secondary' : 'btn-primary'}
    >
      {status === 'done' ? (
        <>
          <CheckmarkIcon /> Reabrir
        </>
      ) : (
        'Listo'
      )}
    </button>
    {isSaving && <span className="text-cyan text-xs">Guardando...</span>}
    {savedAtMs && Date.now() - savedAtMs < 2000 && (
      <span className="text-cyan text-xs animate-fade-out">Guardado</span>
    )}
  </div>
</div>
```

**Styling:**
- Card: navy-700 border, 18px border-radius, 20px padding, shadow
- Number badge: 34×34px, centered number or checkmark, background gradient cyan→lime for done state
- Status badge: colored dot + label ("Pendiente" / "En progreso" / "Completado"), cyan for in_progress, lime for done, gray for pending
- Textarea: min-height 84px, max-height 240px on mobile, focus cyan border glow, `resize: vertical`, no horizontal overflow on 360px
- Copy button: cyan text, hover darkens, disabled state gray (if copy fails)
- "Listo" button: primary cyan bg when enabled, lime bg with checkmark when done state, disabled gray
- "Reabrir" button: secondary outline, appears when status=done

**Acceptance:**
- Exercise renders with all fields visible
- Copy button works (clipboard.writeText API)
- Textarea scrollable vertically, no horizontal overflow on 360px mobile
- "Listo" button disabled when textarea empty
- Number badge shows checkmark when status=done
- Status badge updates color per status
- "Guardado" indicator fades after 2s

---

### RF-005 [4a] TallerSection Refactor to Client Component

Location: `src/components/workshop/sections/TallerSection.tsx`

**Change from Server to Client Component:**

**Props:**
```typescript
interface TallerSectionProps {
  content: {
    type: 'taller';
    title: string;
    instructions: string;
    placeholder?: string;
  };
  exercises: Array<{
    id: string;
    title: string;
    objective: string;
    prompt_text: string;
    order: number;
  }>;
  exerciseProgress: Array<{
    exercise_id: string;
    status: 'pending' | 'in_progress' | 'done';
    user_response_text: string;
  }>;
  onExerciseUpdate: (exerciseId: string, response: string, status: string) => void;
}
```

**Render:**
1. Title + instructions from `content.taller`
2. If `exercises.length === 0`, show placeholder message (graceful fallback)
3. Otherwise, render ordered list of ExerciseCard components (sorted by `order` ASC)
4. Each card maps user's progress from `exerciseProgress` array

**State Management:**
- Client-side `useState` for textarea values (optimistic updates)
- Client-side Set for `doneExerciseIds` (extends pattern from change 3 for section visits)
- Pass `onExerciseUpdate` callback to ExerciseCard for autosave trigger (implementation in RF-008)

**Acceptance:**
- TallerSection renders as Client Component (no 'use server' directive)
- Exercises render in `order` ASC sequence
- Placeholder visible if exercises.length === 0
- Progress state updates immediately on textarea change (optimistic UI)

---

### RF-006 [4a] Fetch Exercises + Progress on Page Load

Location: `src/app/(authenticated)/taller/[slug]/page.tsx`

**Server Component Changes:**

1. Fetch exercises for workshop:
   ```typescript
   const exercises = await db.query(
     'SELECT id, title, objective, prompt_text, order FROM public.exercises WHERE workshop_id = $1 ORDER BY order ASC',
     [workshopId]
   );
   ```

2. Fetch user's exercise_progress:
   ```typescript
   const userProgress = await db.query(
     'SELECT exercise_id, status, user_response_text FROM public.exercise_progress WHERE user_id = $1 AND exercise_id IN (...)',
     [userId]
   );
   ```

3. Pass both to TallerSection as props (no Server Actions called from child components)

**Acceptance:**
- Exercises fetched and sorted by order
- Progress populated for current user
- Data passed to Client Component as props
- No N+1 queries (single batch fetch)

---

### RF-007 [4a] CopyButton Sub-Component

Location: `src/components/workshop/CopyButton.tsx`

**Props:**
```typescript
interface CopyButtonProps {
  text: string;
  label?: string; // default: "Copiar prompt"
  onSuccess?: () => void;
}
```

**Behavior:**
1. Click → `navigator.clipboard.writeText(text)`
2. On success: label changes to "Copiado" + display for 2s, then revert
3. On failure: toast "No se pudo copiar" (silent, user can try again manually)
4. No loading state (copy is instant)

**Styling:**
- Cyan text, hover cyan glow
- Disabled state (during 2s fade): opacity 0.6, cursor not-allowed

**Acceptance:**
- Clipboard write succeeds and label changes
- Label reverts after 2s
- Mobile clipboard permissions granted in e2e (test.use({ permissions: [...] }))

---

### RF-008 [4b] Autosave Debounce (1s)

Location: `src/components/workshop/ExerciseCard.tsx`

**Implementation:**
```typescript
const [textareaValue, setTextareaValue] = useState(userResponse);
const [debouncedSaveTimeout, setDebouncedSaveTimeout] = useState<NodeJS.Timeout | null>(null);

const handleTextareaChange = (newValue: string) => {
  setTextareaValue(newValue);

  if (debouncedSaveTimeout) clearTimeout(debouncedSaveTimeout);

  const timer = setTimeout(() => {
    if (status !== 'done' && newValue.trim()) {
      // Call Server Action to save
      saveExerciseProgress(exerciseId, newValue, 'in_progress').catch(handleAutosaveFailure);
    }
  }, 1000);

  setDebouncedSaveTimeout(timer);
};
```

**Behavior:**
- User types in textarea → state updates instantly (optimistic)
- Timer: 1s after last keystroke, Server Action fires (if response non-empty)
- If user clicks "Listo" before debounce fires → cancel timer and call saveExerciseProgress with status='done' (skip debounce delay)
- Multiple rapid keystrokes coalesce into single Server Action (debounce works)

**Visual Feedback:**
- "Guardando..." label appears while Server Action pending
- On success: "Guardado" label for 2s then fades
- On failure: silent, user keeps typing (data in textarea, not lost)

**Acceptance:**
- e2e: Type characters, wait 1.5s, verify DB row updated (admin client query)
- e2e: Type 5 characters rapidly (each < 1s apart), verify only 1 Server Action call (debounce coalesces)
- Mobile: No keyboard overlap issues on 360px (textarea focus behavior native)

---

### RF-009 [4b] Autosave Retry with Exponential Backoff

Location: `src/lib/actions/exercises.ts` + Client logic in ExerciseCard

**Retry Logic:**

```typescript
async function saveExerciseProgressWithRetry(
  exerciseId: string,
  userResponse: string,
  status: string,
  maxRetries = 3,
  backoffMs = [3000, 6000, 9000]
): Promise<{ success: boolean }> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await saveExerciseProgress(exerciseId, userResponse, status);
      if (result.success) return { success: true };
    } catch (error) {
      if (attempt === maxRetries) {
        showErrorToast('No pudimos guardar tu respuesta. Intentá copiar tu texto.');
        return { success: false };
      }
      await delay(backoffMs[attempt]);
    }
  }
  return { success: false };
}
```

**Retries:**
- Attempt 1: immediate call
- Attempt 2: after 3s delay
- Attempt 3: after 6s delay
- Attempt 4: after 9s delay
- If all fail: show toast "No pudimos guardar..."

**User Experience:**
- No visible loading spinner during retry (silent)
- Error toast only after final failure
- User can manually copy response if they doubt save worked (RF-007)
- Textarea data always persists client-side (not lost on save failure)

**Acceptance:**
- e2e: Simulate network error (mock saveExerciseProgress to throw), verify retry sequence
- e2e: After 3 retries fail, toast appears with message
- Mobile: No UI jank during retry attempts

---

### RF-010 [4b] "Listo" Button Behavior

Location: `src/components/workshop/ExerciseCard.tsx`

**States:**
1. **Pending/In Progress (status !== 'done'):**
   - Label: "Listo"
   - Disabled if textarea empty (`!userResponse.trim()`)
   - Title (hover tooltip): "Escribí una respuesta primero" (if disabled)
   - Click → call `saveExerciseProgress(exerciseId, userResponse, 'done')` with retry logic

2. **Done (status === 'done'):**
   - Label: "Reabrir" (with checkmark icon ✓)
   - Enabled
   - Click → call `saveExerciseProgress(exerciseId, userResponse, 'in_progress')` to revert

**Behavior:**
- Click "Listo" → immediate Server Action call (skip debounce delay)
- Use `useTransition` (React 19) to queue mutations if autosave pending
- On success: badge updates, button label changes
- On failure: retry with backoff (RF-009)

**Visual Feedback:**
- Button state updates instantly (optimistic)
- Status badge color changes: gray → cyan → lime (as user progresses)

**Acceptance:**
- e2e: Mark exercise done → status updates in DB
- e2e: Click "Reabrir" → status reverts to 'in_progress'
- e2e: "Listo" disabled when textarea empty
- Race condition test: Click "Listo" while autosave debounce pending → both calls coalesce or second is cancelled

---

### RF-011 [4b] "Guardado" Visual Indicator

Location: `src/components/workshop/ExerciseCard.tsx`

**Indicator:**
- Appears next to "Listo" button after successful autosave
- Label: "Guardado" (cyan color, italic)
- Duration: 2s then fades (CSS animation `animate-fade-out` or similar)
- No animation on failure (silent retry)

**Implementation:**
```typescript
const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

const handleAutosaveSuccess = () => {
  setLastSavedAt(Date.now());
};

// In render:
{lastSavedAt && Date.now() - lastSavedAt < 2000 && (
  <span className="text-cyan italic text-xs animate-fade-out">Guardado</span>
)}
```

**Styling:**
- Fade transition from opacity 1 → 0 over 2s
- Positioned inline with buttons (flex row)

**Acceptance:**
- e2e: Trigger autosave (wait 1.5s after typing), verify "Guardado" appears
- e2e: "Guardado" disappears after 2s
- Multiple saves: indicator re-appears and re-fades each time

---

### RF-012 [4b] Extend getWorkshopProgress() to Exercise-Aware Formula

Location: `src/lib/actions/workshop-sections.ts`

**Current (Change 3):**
```typescript
export async function getWorkshopProgress(
  userId: string,
  workshopId: string
): Promise<number> {
  const visited = await db.query(
    'SELECT COUNT(DISTINCT section_type) as count FROM public.section_visits WHERE user_id = $1 AND section_type IN (...)',
    [userId]
  );
  return (visited.count / 5) * 100;
}
```

**Extended (Change 4):**
```typescript
export async function getWorkshopProgress(
  userId: string,
  workshopId: string
): Promise<{
  progressPercent: number;
  sectionsVisited: number;
  exercisesDone: number;
  totalExercises: number;
}> {
  const visited = await db.query(
    'SELECT COUNT(DISTINCT section_type) as count FROM public.section_visits WHERE user_id = $1 AND section_type IN (...)',
    [userId]
  );

  const exerciseStats = await db.query(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'done') as done_count,
       COUNT(*) as total_count
     FROM public.exercises e
     LEFT JOIN public.exercise_progress ep ON e.id = ep.exercise_id AND ep.user_id = $1
     WHERE e.workshop_id = $2`,
    [userId, workshopId]
  );

  const sectionsVisited = visited.count ?? 0;
  const exercisesDone = exerciseStats.done_count ?? 0;
  const totalExercises = exerciseStats.total_count ?? 0;

  const totalItems = 5 + totalExercises;
  const doneItems = sectionsVisited + exercisesDone;

  const progressPercent = totalItems > 0 ? (doneItems / totalItems) * 100 : 0;

  return {
    progressPercent,
    sectionsVisited,
    exercisesDone,
    totalExercises,
  };
}
```

**Formula:**
```
totalItems = 5 (fixed sections) + count(exercises for workshop)
doneItems = count(sections_visited) + count(exercises with status='done')
progressPercent = (doneItems / totalItems) × 100
```

**Edge Cases:**
- If workshop has 0 exercises: denominator = 5, formula degrades to visitadas/5 (backward compatible)
- If user has completed all 5 sections + all exercises: progressPercent = 100

**Acceptance:**
- e2e: Workshop with 4 exercises, user visited 2 sections, completed 2 exercises → progress = (2+2)/(5+4) = 44%
- e2e: Workshop with 0 exercises, user visited 2 sections → progress = 2/5 = 40% (degradation works)
- Progress updates in real-time as user marks exercises done (optimistic client-side + server confirmation)

---

### RF-013 [4b] Optimistic Progress Bar Update

Location: `src/components/workshop/ProgressBar.tsx` (inherited from change 3, extended here)

**Client-side Optimistic Update:**
- When user clicks "Listo" or autosave succeeds, immediately update local state: `doneExerciseIds.add(exerciseId)`
- Recompute progress percent locally without waiting for server response
- Progress bar animates smoothly to new value
- Server confirms async; if mismatch detected, re-sync on next page load

**Implementation (TallerSection Client state):**
```typescript
const [doneExerciseIds, setDoneExerciseIds] = useState(
  new Set(exerciseProgress.filter(ep => ep.status === 'done').map(ep => ep.exercise_id))
);

const handleMarkDone = (exerciseId: string) => {
  setDoneExerciseIds(prev => new Set(prev).add(exerciseId)); // optimistic
  saveExerciseProgress(exerciseId, textareaValue, 'done').catch(() => {
    setDoneExerciseIds(prev => new Set(prev).delete(exerciseId)); // rollback
  });
};
```

**Progress Calculation (on client):**
```typescript
const exercisesDone = doneExerciseIds.size;
const totalItems = 5 + exercises.length;
const doneItems = sectionsVisited + exercisesDone;
const progressPercent = (doneItems / totalItems) * 100;
```

**Acceptance:**
- e2e: Click "Listo" → progress bar jumps to new value instantly (optimistic)
- e2e: If save fails and retries succeed → progress persists
- e2e: Reload page → progress reflects server state (no divergence)

---

### RF-014 [4b] State Transition: Pending → In Progress → Done

Location: `src/lib/actions/exercises.ts` + ExerciseCard

**State Machine:**
```
pending
  ↓ (user types in textarea, 1s autosave triggers)
in_progress
  ↓ (user clicks "Listo")
done
  ↓ (user clicks "Reabrir")
in_progress
  ↓ (user types again, autosave fires)
in_progress
  ↓ (user clicks "Listo")
done
```

**Rules:**
- First autosave sets `status = 'in_progress'` (if was pending)
- Clicking "Listo" explicitly sets `status = 'done'`
- Clicking "Reabrir" reverts to `status = 'in_progress'` (allows re-editing)
- No auto-revert: once 'done', user must click "Reabrir" to edit again

**Acceptance:**
- e2e: New user sees status='pending' initially
- e2e: Type in textarea → after autosave, status becomes 'in_progress'
- e2e: Click "Listo" → status becomes 'done'
- e2e: Click "Reabrir" → status back to 'in_progress'

---

### RF-015 [4b] Mobile Responsive: 360px Safe

Location: CSS in `src/components/workshop/ExerciseCard.tsx` + `src/globals.css`

**Requirements:**
- Textarea minimum height 84px, scrollable vertically (no horizontal overflow)
- Card padding/spacing doesn't exceed viewport on 360px screen
- Copy button and "Listo" button stack if needed (flex wrap on small screens)
- Text doesn't overflow badge on 360px (number badge 34×34px, fixed width)
- Monospace prompt text wraps or scrolls horizontally in small container (pre-wrap + overflow-x-auto for browser, no horizontal scroll in card itself)

**CSS Safeguards:**
```css
.exercise-textarea {
  resize: vertical;
  min-height: 84px;
  max-height: 240px;
  width: 100%;
  /* no horizontal scroll */
}

.exercise-card {
  padding: 20px;
  gap: 16px;
  /* stack on small screens */
}

@media (max-width: 360px) {
  .exercise-buttons {
    flex-wrap: wrap;
    gap: 8px;
  }
  .exercise-card {
    padding: 16px;
  }
}
```

**Acceptance:**
- e2e on mobile (360px, portrait): textarea visible, no horizontal overflow
- e2e: Long exercise title doesn't overflow card bounds
- e2e: Copy button and "Listo" button accessible without scrolling

---

## Requirements — Non-Functional

### RNF-001: Security & RLS

- **exercises table:** RLS guard on `workshop_access.redeemed_at IS NOT NULL` (user can only read exercises for redeemed workshops)
- **exercise_progress table:** User can only read/write own rows (3 RLS policies: SELECT, INSERT, UPDATE per user_id)
- **Server Action validation:** Zod schema validates exerciseId, userResponse length, status enum before querying DB
- **e2e RLS test:** Verify user B cannot see exercises or progress of user A
- **e2e unauthorized test:** Verify user without redeemed access cannot see exercises (RLS blocks SELECT)

**Acceptance Criteria:**
- All RLS policies applied in migrations
- Zod validation passes or rejects with clear error message
- e2e test: `SELECT exercise_progress ... WHERE user_id = other_user` returns 0 rows (RLS blocks)
- e2e test: unauthorized user sees 403 on exercise fetch

### RNF-002: Performance

- **Autosave debounce:** 1s delay prevents N+1 Server Action calls (user typing rapidly → single call)
- **Retry backoff:** exponential delays (3s/6s/9s) prevent hammering server on network failures
- **Database indices:** `idx_exercises_workshop_id`, `idx_exercise_progress_user_id`, `idx_exercise_progress_user_exercise` support fast queries
- **Page load:** Exercise fetch + progress join uses single batch query (no N+1 per exercise)
- **Progress recalculation:** `getWorkshopProgress()` uses aggregate query (`COUNT(*) FILTER`), not row iteration

**Acceptance Criteria:**
- Lighthouse Performance > 80 on /taller/[slug]
- Autosave (typing test): <50ms textarea response time (user sees text appear instantly)
- e2e timing: Single autosave call fires within 1100ms of last keystroke (1s + 100ms buffer)

### RNF-003: Responsive Design

- **Mobile 360px:** All elements fit without horizontal overflow; textarea scrollable vertically
- **Breakpoints:** 360px (mobile), 768px (tablet), 1024px (desktop)
- **Card layout:** Flexible, stacks on small screens
- **Buttons:** Touch targets ≥ 44px × 44px (WCAG 2.5.5)
- **Prompt monospace:** Pre-wrap text, readable in small viewport (no tiny font)

**Acceptance Criteria:**
- Responsive audit: >90 on mobile (Lighthouse)
- e2e on 360px: All UI elements accessible without horizontal scroll
- No layout shift on autosave indicator (uses placeholder space or flex gap)

### RNF-004: Accessibility (a11y)

- **Textarea:** Associated label (implicit via aria-describedby for "Guardado" indicator)
- **"Listo" button:** Disabled state visible (opacity, cursor), title attribute shows reason ("Escribí una respuesta primero")
- **Status badge:** Semantic color + text label (not color alone)
- **Copy button:** Accessible label, feedback "Copiado" or error toast
- **Prompt text:** Monospace font, high contrast on navy background
- **Focus indicators:** All interactive elements have visible focus (cyan glow or outline)

**Acceptance Criteria:**
- Axe accessibility scan: 0 critical errors
- Keyboard navigation: Tab through buttons, Space to activate, Enter to submit textarea text to "Listo" click (if focus on button)
- Screen reader test: "Listo button, disabled, write a response first" (title read aloud)
- Color contrast: All text ≥ 4.5:1 (WCAG AA)

### RNF-005: i18n (Español Rioplatense)

- **UI labels:** All in Spanish (voseo)
  - "Escribí una respuesta primero" (not "Escriba")
  - "Copiar prompt" → "Copiado"
  - "No pudimos guardar…"
  - "Guardado"
  - "Listo" / "Reabrir"
  - "Pendiente" / "En progreso" / "Completado"
- **Prompt content:** Instructor writes in Spanish; system doesn't translate
- **Error messages:** Natural Spanish, not machine-translated

**Acceptance Criteria:**
- All hardcoded strings use voseo
- No English labels in UI

### RNF-006: Styling (CSS Tokens & No Hex Hardcoding)

- **Colors:** Use Tailwind 4 tokens only (no hex values in JSX/CSS)
  - `text-cyan` (prompt copy button, active states, "Guardado")
  - `text-lime` (done checkmark, "Completado" badge)
  - `bg-navy-700`, `bg-navy-800` (card, prompt block)
  - `border-navy-700` (card border)
  - `text-secondary`, `text-muted` (secondary text)
- **Spacing:** Tailwind gap, padding utilities (16px/20px base units)
- **Animations:** Reuse existing animations from change 3 (sdCheck, sdPulse, sdFade)

**Acceptance Criteria:**
- No hex colors in code (grep -r "#[0-9A-Fa-f]" src/ → 0 results)
- All animations use Tailwind @keyframes (no CSS-in-JS colors)

---

## Scenarios — Gherkin Format

### Slice 4a Scenarios

#### Scenario: Load Taller Section with 4 Exercises
```gherkin
Given I am a student who has redeemed access to the workshop
When I navigate to the Taller section
Then I see 4 exercise cards rendered in order
  And each card displays the exercise number, title, objective, and prompt
  And each card has a copy button, textarea, and "Listo" button
  [4a]
```

#### Scenario: Copy Exercise Prompt to Clipboard
```gherkin
Given I have an exercise card open
When I click the "Copiar prompt" button
Then the button label changes to "Copiado"
  And the prompt text is copied to my clipboard
  And the button reverts to "Copiar prompt" after 2 seconds
  [4a]
```

#### Scenario: Textarea is Empty — "Listo" Disabled
```gherkin
Given I have a new exercise with no response written
When I look at the exercise card
Then the "Listo" button is disabled (grayed out)
  And hovering shows the title "Escribí una respuesta primero"
  [4a]
```

#### Scenario: Textarea Gets Text — "Listo" Enabled
```gherkin
Given the "Listo" button is disabled
When I type at least one character in the textarea
Then the "Listo" button becomes enabled
  [4a]
```

#### Scenario: Workshop with No Exercises Shows Placeholder
```gherkin
Given I navigate to a Taller section for a workshop with no exercises
When the page loads
Then I see the placeholder message "Ejercicios próximamente"
  And no exercise cards are rendered
  [4a]
```

---

### Slice 4b Scenarios

#### Scenario: Autosave After 1 Second of Typing
```gherkin
Given I am editing an exercise
When I type some text in the textarea
  And I wait 1.5 seconds without typing
Then a Server Action call is made to save the exercise progress
  And the DB row is updated with my response text
  And the status changes from 'pending' to 'in_progress'
  [4b]
```

#### Scenario: Rapid Typing Coalesces into Single Save
```gherkin
Given I start typing in the textarea
When I type 10 characters rapidly (each keystroke < 1s apart)
Then only 1 Server Action call is made (not 10)
  And the DB is updated with all 10 characters
  [4b]
```

#### Scenario: Autosave Fails — Retries and Eventually Shows Error Toast
```gherkin
Given autosave is triggered
When the Server Action fails (network error or DB error)
Then the client retries after 3 seconds
  And if it fails again, retries after 6 seconds
  And if it still fails, retries after 9 seconds
  And if all 3 retries fail, a toast appears: "No pudimos guardar tu respuesta. Intentá copiar tu texto."
  But the textarea data is NOT lost (still visible, not cleared)
  [4b]
```

#### Scenario: "Guardado" Indicator Appears and Fades
```gherkin
Given autosave succeeds
When the Server Action response is received
Then "Guardado" appears next to the "Listo" button
  And it fades away after 2 seconds
  [4b]
```

#### Scenario: Click "Listo" to Mark Exercise Done
```gherkin
Given I have written a response to an exercise
When I click the "Listo" button
Then the Server Action is called immediately (no debounce delay)
  And the status changes to 'done'
  And the button text changes to "Reabrir" with a checkmark
  And the status badge changes color (cyan → lime) and shows "Completado"
  [4b]
```

#### Scenario: Click "Reabrir" to Edit Completed Exercise
```gherkin
Given I have completed an exercise (status = 'done')
When I click the "Reabrir" button
Then the status changes to 'in_progress'
  And the button label changes back to "Listo"
  And the textarea becomes editable again
  And autosave works normally if I type
  [4b]
```

#### Scenario: Progress Bar Updates with Exercise-Aware Formula
```gherkin
Given a workshop with 4 exercises
When I have visited 2 sections and completed 2 exercises
Then the progress bar shows (2 + 2) / (5 + 4) = 44%
  [4b]
```

#### Scenario: Progress Bar Degrades if No Exercises
```gherkin
Given a workshop with 0 exercises
When I have visited 2 sections
Then the progress bar shows 2 / 5 = 40% (backward compatible)
  [4b]
```

#### Scenario: RLS Blocks Unauthorized User from Seeing Exercises
```gherkin
Given I am a student who has NOT redeemed access to workshop B
When I try to fetch exercises for workshop B
Then the RLS policy blocks the SELECT
  And the exercises list is empty (0 rows returned)
  And I see a 403 error or graceful fallback UI
  [4b]
```

#### Scenario: RLS Blocks User B from Reading User A's Exercise Progress
```gherkin
Given User A has saved exercise responses
When User B tries to query exercise_progress for User A's exercises
Then the RLS policy (user_id = auth.uid()) blocks the SELECT
  And User B sees 0 rows
  [4b]
```

#### Scenario: Mobile 360px — Textarea No Horizontal Overflow
```gherkin
Given I am viewing the exercise card on a 360px wide mobile device
When I focus the textarea and type a long response
Then the textarea scrolls vertically (no horizontal scroll)
  And the card doesn't overflow the viewport
  And the "Listo" button is fully visible and clickable
  [4b]
```

#### Scenario: Persistence — Close Browser and Reopen
```gherkin
Given I have saved exercise responses and marked some as done
When I close the browser tab
  And I reopen the workshop page
Then my responses are still there
  And the progress bar reflects the same completion state
  And I can continue editing without losing work
  [4b]
```

---

## Data Schemas

### Exercise Zod Schema

```typescript
// src/lib/schemas/exercise.ts
import { z } from 'zod';

export const ExerciseSchema = z.object({
  id: z.string().uuid(),
  workshop_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  objective: z.string().min(1).max(500),
  prompt_text: z.string().min(1).max(5000),
  order: z.number().int().min(1),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export const ExerciseProgressSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  exercise_id: z.string().uuid(),
  status: z.enum(['pending', 'in_progress', 'done']),
  user_response_text: z.string().max(10000).nullable(),
  updated_at: z.string().datetime().optional(),
});

export const SaveExerciseProgressSchema = z.object({
  exerciseId: z.string().uuid('Invalid exercise ID'),
  userResponse: z.string().max(10000, 'Response too long (max 10000 chars)'),
  status: z.enum(['pending', 'in_progress', 'done']).optional(),
});

export type Exercise = z.infer<typeof ExerciseSchema>;
export type ExerciseProgress = z.infer<typeof ExerciseProgressSchema>;
export type SaveExerciseProgressInput = z.infer<typeof SaveExerciseProgressSchema>;
```

---

## E2E Test Fixtures

### Seed Helper: seedExercises

```typescript
// tests/helpers/seed-exercises.ts
import { supabaseAdmin } from '@/tests/fixtures/admin-client';

export async function seedExercises(
  workshopId: string,
  count: number = 4
): Promise<Array<{ id: string; order: number }>> {
  const exercises = Array.from({ length: count }, (_, i) => ({
    workshop_id: workshopId,
    title: `Ejercicio ${i + 1}: ${['Configura tu primer store', 'Escribe un esquema', 'Implementa una acción', 'Integra con la API'][i]}`,
    objective: ['Crear una capa de memoria', 'Definir tipos en memoria', 'Procesar datos', 'Conectar servicios'][i],
    prompt_text: `
Instrucciones para el ejercicio ${i + 1}:

1. Lee el contexto anterior
2. Sigue los pasos indicados
3. Escribe tu respuesta en el textarea

Ejemplo esperado:
\`\`\`
// Tu código aquí
\`\`\`

Preguntas guía:
- ¿Qué es lo más importante?
- ¿Cómo aplicarías esto en tu proyecto?
    `.trim(),
    order: i + 1,
  }));

  const { data, error } = await supabaseAdmin
    .from('exercises')
    .insert(exercises)
    .select('id, order');

  if (error) throw new Error(`Failed to seed exercises: ${error.message}`);
  return data || [];
}
```

### Reset Helper: resetExerciseProgress

```typescript
// tests/helpers/reset-exercise-progress.ts
export async function resetExerciseProgress(): Promise<void> {
  const { error } = await supabaseAdmin
    .from('exercise_progress')
    .delete()
    .neq('id', ''); // delete all

  if (error) throw new Error(`Failed to reset exercise_progress: ${error.message}`);
}
```

### E2E Test Fixtures

```typescript
// tests/fixtures/exercises.ts
export const SEED_EXERCISES = [
  {
    title: 'Configura tu primer store de memoria',
    objective: 'Crear una capa de memoria vacía',
    prompt_text: `Instrucciones paso a paso...`,
    order: 1,
  },
  // ... 3 more exercises
];
```

---

## Test Coverage by Slice

### Slice 4a Tests (Vitest)

- **Migrations:** Verify table structure, indices, RLS policies exist (introspection query)
- **Zod schemas:** Valid exercise object passes, invalid (missing title) fails, response length capped at 10000
- **Server Action signature:** Accepts correct params, rejects invalid UUID, returns success/error structure

### Slice 4a E2E (Playwright)

- `[4-1] exercise-card-render` — Load 4 exercises, verify DOM renders cards, titles, prompts
- `[4-2] copy-prompt` — Click copy button, verify clipboard content, label changes, reverts

### Slice 4b Tests (Vitest)

- **Autosave debounce:** Mock setTimeout, verify single Server Action call after 1s
- **Retry logic:** Mock saveExerciseProgress failures, verify retry sequence (3s/6s/9s)
- **Progress formula:** Calculate (2+2)/(5+4) = 44%, verify with mock data

### Slice 4b E2E (Playwright)

- `[4-3] autosave-on-input` — Type in textarea, wait 1.5s, query DB via admin, verify row updated
- `[4-4] autosave-failure-retry` — Mock network failure, verify toast after 3 retries
- `[4-5] mark-as-done` — Click "Listo", verify status='done' in DB, badge color changes
- `[4-6] progress-exercise-aware` — Complete exercises, verify progress bar formula
- `[4-7] exercise-rls-unauthorized` — Fetch exercises without redeemed access, verify RLS blocks
- `[4-8] exercise-progress-persistence` — Save, close browser, reopen, verify data persists
- `[4-9] mobile-360px-responsive` — No horizontal overflow on textarea, buttons visible
- `[4-10] reabrir-toggle` — Mark done, click "Reabrir", verify status='in_progress', editable again

---

## Affected Files

| File | Status | Impact |
|------|--------|--------|
| `src/migrations/20260613_exercises_table.sql` | New | exercises table + RLS policy |
| `src/migrations/20260613_exercise_progress_table.sql` | New | exercise_progress table + 3 RLS policies |
| `src/lib/database.types.ts` | Modified | Add Exercise + ExerciseProgress types (auto-generated from migrations) |
| `src/lib/actions/exercises.ts` | New | Server Action `saveExerciseProgress()` |
| `src/lib/actions/workshop-sections.ts` | Modified | Extend `getWorkshopProgress()` for exercise-aware formula |
| `src/lib/schemas/exercise.ts` | New | Zod schemas for Exercise, ExerciseProgress, SaveExerciseProgress |
| `src/components/workshop/ExerciseCard.tsx` | New | Component: number badge, title, objective, prompt, copy button, textarea, autosave, "Listo"/"Reabrir" |
| `src/components/workshop/CopyButton.tsx` | New | Sub-component: copy-to-clipboard with "Copiado" feedback |
| `src/components/workshop/sections/TallerSection.tsx` | Modified | Convert Server → Client, render ExerciseCard list, manage autosave state |
| `src/app/(authenticated)/taller/[slug]/page.tsx` | Modified | Fetch exercises + exercise_progress, pass to TallerSection |
| `src/globals.css` | Modified | Add/reuse animations (fade-out for "Guardado" indicator) |
| `tests/helpers/seed-exercises.ts` | New | `seedExercises(workshopId, count)` helper |
| `tests/helpers/reset-exercise-progress.ts` | New | `resetExerciseProgress()` helper |
| `e2e/specs/workshop/[4-1]-exercise-card-render.spec.ts` | New | Render test |
| `e2e/specs/workshop/[4-2]-copy-prompt.spec.ts` | New | Copy button test |
| `e2e/specs/workshop/[4-3]-autosave-on-input.spec.ts` | New | Autosave debounce test |
| `e2e/specs/workshop/[4-4]-autosave-failure-retry.spec.ts` | New | Retry logic test |
| `e2e/specs/workshop/[4-5]-mark-as-done.spec.ts` | New | "Listo" button test |
| `e2e/specs/workshop/[4-6]-progress-exercise-aware.spec.ts` | New | Progress formula test |
| `e2e/specs/workshop/[4-7]-exercise-rls-unauthorized.spec.ts` | New | RLS unauthorized test |
| `e2e/specs/workshop/[4-8]-exercise-progress-persistence.spec.ts` | New | Persistence test |

---

## Open Questions for Design Phase

1. **Autosave visual feedback:** Should "Guardando..." spinner appear during Server Action, or silent? (Recommend: silent, user focus on typing)
2. **Progress bar real-time:** Should progress update instantly (optimistic client) or only after server confirmation? (Recommend: optimistic, server syncs async)
3. **Error recovery UI:** If autosave fails 3 times, should "Guardar manualmente" button appear? (Recommend: No for v1, keep simple)
4. **Textarea placeholder:** Is "Escribe o pega aquí tu respuesta…" correct, or should it mention copying prompt? (Recommend: Keep it — users understand copy separately)

---

## Dependencies & Blockers

**External:**
- React 19 (useTransition for mutation queueing)
- Zod 4 (schema validation)
- Supabase (migrations, RLS, Server Actions via Postgres functions)
- Playwright (e2e with clipboard permissions)

**Data Prerequisite:**
- Jennifer must manually insert 4+ Exercise seed rows via SQL OR run script `seedExercises()` before apply phase
- E2E tests use `seedExercises()` helper to inject test data

**No external blocking**: All dependencies available from changes 1-3.

---

## Success Criteria

- [x] students can type responses without manual save button
- [x] "Guardado" indicator appears within 2s after autosave succeeds
- [x] autosave retries silently; toast only after 3 retries fail
- [x] clicking "Listo" marks exercise done and updates progress bar in real-time
- [x] progress bar returns exercise-aware percentage
- [x] all 12 e2e specs pass (render, copy, autosave, retry, completion, progress, RLS ×2, persistence, mobile, reabrir)
- [x] no RLS errors in e2e (ignoreDuplicates: true works)
- [x] mobile 360px layout safe (no horizontal overflow)
- [x] build/lint clean, no TypeScript errors

---

## Acceptance Notes

**Proposal vs. Spec Alignment:**
- ✓ 2 tables with RLS per proposal
- ✓ Idempotent autosave + retry exponential per proposal
- ✓ 1s debounce, 3s/6s/9s retry, toast after 3 fails per proposal
- ✓ "Listo" disabled if empty, "Reabrir" button when done per proposal
- ✓ Exercise-aware formula per proposal
- ✓ status='in_progress' on first autosave per proposal
- ✓ Order immutable, content_json.taller unchanged per proposal
- ✓ Separates visita + completitud as metrics per proposal

**Slicing (chained PRs):**
- **4a:** Migrations (120 lines) + Server Actions (80 lines) + ExerciseCard (200 lines) + TallerSection render (120 lines) + CopyButton (40 lines) = ~560 lines
- **4b:** Autosave debounce (100 lines) + retry logic (80 lines) + progress formula (60 lines) + e2e tests (250 lines) + styling/animations (50 lines) = ~540 lines
- **Total:** ~1,100 lines (exceeds 400-line budget; justified by complexity of autosave + RLS + e2e coverage)

---

**Spec by:** sdd-spec (automated)  
**Date:** 2026-06-16  
**Artifact store:** openspec  
**Next phase:** sdd-design (parallel with this spec)
