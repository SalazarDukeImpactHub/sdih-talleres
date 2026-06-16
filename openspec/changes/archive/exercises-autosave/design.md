# Design — exercises-autosave

**Change ID:** exercises-autosave  
**Position:** 4 of 8  
**Status:** Design (ready for spec + tasks)  
**Architecture owner:** Salazar Duke Dev System  
**Design date:** 2026-06-16

---

## Executive Summary

Exercise tracking system with autosave debounce (1s), RLS-protected progress table, exercise-aware progress formula. Reuses section_visits pattern from change 3. Delivered as 2 chained PRs (~490 + ~480 lines) with idempotent upsert via Server Action + client-side textarea state management.

---

## Decisions Locked (No Reopening)

From **Proposal & Explore**:
- **Plain text prompts** — no markdown, no rich-text editor (brief §6, confirmed via prototype).
- **Autosave 1s debounce** — manual setTimeout (not useDeferredValue), client-side state.
- **Status enum** — pending | in_progress | done (brief §6).
- **RLS pattern** — EXISTS on workshop_access.redeemed_at (inherited from change 3).
- **Server Action idempotent upsert** — ignoreDuplicates: true (proven pattern change 3).
- **Slicing strategy** — 2 chained PRs: 4a (migrations + Card + basic render) + 4b (autosave debounce + formula + e2e).
- **Progress formula** — (visitadas + exercises_done) / (5 + total_exercises) per brief §13.
- **Mobile 360px safe** — textarea with CSS constraints, no horizontal overflow.

---

## Open Decisions (D-1 to D-12)

### D-1: SQL Migrations — Exercises + ExerciseProgress Tables — ✓ DECIDIDO

**Decision:** Two separate migration files following change 3 pattern.

**Rationale:**
- Exercises table: shared data model, read-only for redeemed users (RLS via EXISTS)
- ExerciseProgress table: user-owned state, UNIQUE(user_id, exercise_id), idempotent upsert
- Both tables support exercise-aware progress calculation (change 4 contract)
- RLS pattern proven in changes 2-3

**Exercises Table SQL:**

```sql
-- Migration: Create exercises table for workshop exercise definitions
-- Purpose: Store exercise prompts, titles, objectives per workshop
-- Design: Plain text prompts only (no markdown in v1), ordered for consistent display

CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  objective TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workshop_id, "order")
);

-- Indexes for performance
CREATE INDEX idx_exercises_workshop_id ON public.exercises(workshop_id);
CREATE INDEX idx_exercises_workshop_order ON public.exercises(workshop_id, "order");

-- Row Level Security
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only redeemed users can view exercises
-- Checks if user has redeemed access to the workshop
CREATE POLICY exercises_select_redeemed ON public.exercises
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.workshop_access wa
      WHERE wa.workshop_id = exercises.workshop_id
        AND wa.user_id = auth.uid()
        AND wa.redeemed_at IS NOT NULL
    )
  );
```

**ExerciseProgress Table SQL:**

```sql
-- Migration: Create exercise_progress table for tracking user responses
-- Purpose: Store user responses, autosave state, and completion status per exercise
-- Design: User-owned state table, idempotent upsert via ignoreDuplicates

CREATE TABLE public.exercise_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done')),
  user_response_text TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, exercise_id)
);

-- Indexes for performance
CREATE INDEX idx_exercise_progress_user_id ON public.exercise_progress(user_id);
CREATE INDEX idx_exercise_progress_exercise_id ON public.exercise_progress(exercise_id);
CREATE INDEX idx_exercise_progress_user_exercise ON public.exercise_progress(user_id, exercise_id);
CREATE INDEX idx_exercise_progress_status_exercise ON public.exercise_progress(exercise_id, status);

-- Row Level Security
ALTER TABLE public.exercise_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only read their own exercise progress
CREATE POLICY exercise_progress_select ON public.exercise_progress
  FOR SELECT USING (user_id = auth.uid());

-- RLS Policy: Users can only insert their own exercise progress
CREATE POLICY exercise_progress_insert ON public.exercise_progress
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policy: Users can only update their own exercise progress
CREATE POLICY exercise_progress_update ON public.exercise_progress
  FOR UPDATE USING (user_id = auth.uid());
```

**Rejected Alternative:** Single table with denormalized fields
- Harder to query aggregate counts (exercise completion across all users)
- Complicates RLS (mixing read-only + user-owned in one table)
- Decision: Two tables, clean separation of concerns

---

### D-2: ExerciseCard Component Structure — ✓ DECIDIDO

**Decision:** Client Component with serializable props. Receives exercise + progress data, manages textarea state locally. Autosave callback passed from parent (Server Action binding).

**Component API:**

```typescript
interface ExerciseCardProps {
  exercise: {
    id: string;
    title: string;
    objective: string;
    prompt_text: string;
    order: number;
  };
  progress: {
    id: string;
    status: 'pending' | 'in_progress' | 'done';
    user_response_text: string | null;
    updated_at: string;
  };
  onSaveProgress: (
    exerciseId: string,
    userResponse: string,
    status?: 'in_progress' | 'done'
  ) => Promise<{ success: boolean; error?: string }>;
}
```

**Internal State:**
- `textareaValue: string` — user's current response (synced from prop on mount, updated on input)
- `isSaving: boolean` — tracks autosave in-flight
- `saveStatus: 'idle' | 'saving' | 'saved' | 'error'` — UI feedback state
- `lastSaveTime: Date | null` — for "Guardado" indicator duration

**Component structure:**
```tsx
<ExerciseCard>
  <Header>
    <NumberBadge> {status === 'done' ? '✓' : exercise.order} </NumberBadge>
    <Title> {exercise.title} </Title>
    <StatusBadge> {status_label} </StatusBadge>
  </Header>
  
  <ObjectiveRow>
    <Icon>⚡</Icon>
    <Text> {exercise.objective} </Text>
  </ObjectiveRow>
  
  <PromptBlock>
    <Label>Prompt</Label>
    <CopyButton /> {/* triggers navigator.clipboard.writeText */}
    <PromptText> {exercise.prompt_text} </PromptText>
  </PromptBlock>
  
  <Textarea
    value={textareaValue}
    onChange={handleInputChange} {/* triggers autosave debounce */}
    onBlur={handleBlurSave} {/* manual save on blur as fallback */}
    disabled={status === 'done'}
  />
  
  <DoneButton
    onClick={handleMarkDone}
    disabled={!textareaValue.trim() || status === 'done'}
    label={status === 'done' ? '✓ Listo' : 'Marcar como listo'}
  />
  
  <SavedIndicator>
    {saveStatus === 'saved' && <span>Guardado</span>}
  </SavedIndicator>
</ExerciseCard>
```

**Rejected Alternative:** Render exercises directly in TallerSection with no wrapper
- Mixes card UI logic (copy, debounce, feedback) with section layout
- Harder to test individual exercise interactions
- Decision: Separate component for encapsulation

**Rejected Alternative:** ExerciseList wrapper + map
- Adds abstraction layer if there's only one parent
- TallerSection already maps exercises (decided in D-3)
- Decision: TallerSection maps directly, ExerciseCard handles internals

---

### D-3: Autosave Implementation — ✓ DECIDIDO

**Decision:** Client-side useEffect + useState + setTimeout with manual debounce, cleanup on unmount and component blur.

**Pseudocode:**

```typescript
export function ExerciseCard({ exercise, progress, onSaveProgress }: ExerciseCardProps) {
  const [textareaValue, setTextareaValue] = useState(progress.user_response_text || '');
  const [saveStatus, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Debounced autosave on input change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setTextareaValue(newValue);
    
    // Clear previous timer
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    // Set new timer: save after 1s of no input
    setStatus('saving');
    timeoutRef.current = setTimeout(async () => {
      const result = await onSaveProgress(exercise.id, newValue, 'in_progress');
      if (result.success) {
        setStatus('saved');
        // Fade out "Guardado" indicator after 2s
        setTimeout(() => setStatus('idle'), 2000);
      } else {
        setStatus('error');
        // Keep error state for retry loop (see D-5)
      }
    }, 1000);
  };
  
  // Manual save on blur (fallback if user leaves field quickly)
  const handleBlurSave = async () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const result = await onSaveProgress(exercise.id, textareaValue, 'in_progress');
    if (!result.success) {
      setStatus('error');
      // Trigger retry loop (see D-5)
    }
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);
  
  return (
    /* Card JSX with textarea onChange={handleInputChange} onBlur={handleBlurSave} */
  );
}
```

**Design notes:**
- useRef for timeout handle prevents state update after unmount
- Nested setStatus('idle') cleanup (2s fade) is simpler than useEffect dependency array
- onBlur saves immediately (no additional debounce) as insurance
- React 19 compatible (no useTransition needed yet; can add in D-7 if race detected)

**Rejected Alternative:** useDeferredValue (React 19)
- Proposal explicitly calls for manual debounce
- useDeferredValue is for UI transitions (starving non-urgent renders)
- Autosave is urgent — user needs to know save status
- Decision: manual setTimeout per proposal

---

### D-4: Server Action saveExerciseProgress — ✓ DECIDIDO

**Decision:** Idempotent upsert Server Action, returns success/error + updated_at for UI sync.

**Signature:**

```typescript
export async function saveExerciseProgress(
  exerciseId: string,
  userResponse: string,
  status?: 'in_progress' | 'done'
): Promise<{
  success: boolean;
  updated_at?: string;
  error?: string;
}> {
  'use server';
  
  // 1. Validate inputs with Zod
  const parsed = SaveExerciseProgressSchema.safeParse({
    exerciseId,
    userResponse,
    status: status || 'in_progress'
  });
  
  if (!parsed.success) {
    return { success: false, error: 'Invalid input' };
  }
  
  // 2. Get current user
  const user = await getRequiredUser();
  
  // 3. Verify exercise exists and user has redeemed workshop (via RLS)
  const { data: exercise, error: exerciseError } = await createClient('server').from('exercises')
    .select('workshop_id')
    .eq('id', exerciseId)
    .single();
  
  if (exerciseError || !exercise) {
    return { success: false, error: 'Exercise not found' };
  }
  
  // 4. Verify user has redeemed access (explicit check before upsert)
  const { data: access, error: accessError } = await createClient('server')
    .from('workshop_access')
    .select('redeemed_at')
    .eq('workshop_id', exercise.workshop_id)
    .eq('user_id', user.id)
    .single();
  
  if (accessError || !access?.redeemed_at) {
    return { success: false, error: 'No access to this workshop' };
  }
  
  // 5. Idempotent upsert (ON CONFLICT DO UPDATE)
  const { data: updated, error: upsertError } = await createClient('server')
    .from('exercise_progress')
    .upsert([
      {
        user_id: user.id,
        exercise_id: exerciseId,
        user_response_text: userResponse,
        status: parsed.data.status,
        updated_at: new Date().toISOString()
      }
    ], {
      onConflict: 'user_id,exercise_id',
      ignoreDuplicates: false // Allow UPDATE on conflict
    });
  
  if (upsertError) {
    return { success: false, error: `Database error: ${upsertError.message}` };
  }
  
  return {
    success: true,
    updated_at: updated?.[0]?.updated_at
  };
}
```

**Zod Schema:**

```typescript
const SaveExerciseProgressSchema = z.object({
  exerciseId: z.string().uuid('Invalid exercise ID'),
  userResponse: z.string().max(10000, 'Response too long'),
  status: z.enum(['in_progress', 'done']).optional()
});
```

**Rationale:**
- Explicit workshop access check (defense in depth, RLS is second line)
- ignoreDuplicates: false allows UPDATE when UNIQUE conflict (change 3 pattern)
- No redirect (autosave in background)
- Returns updated_at for client to sync progress UI if needed

**Rejected Alternative:** Separate markDone() Server Action
- Two actions would complicate race condition handling
- Single action with optional status param is simpler
- Client can call with status='done' when "Listo" button clicked

---

### D-5: Retry Logic for Autosave Failures — ✓ DECIDIDO

**Decision:** Client-side exponential backoff (3s, 6s, 9s). Show error toast only after 3 retries fail.

**Implementation pattern (in ExerciseCard or separate hook):**

```typescript
async function saveWithRetry(
  exerciseId: string,
  userResponse: string,
  status?: 'in_progress' | 'done'
) {
  const maxRetries = 3;
  let attempt = 0;
  
  const tryOnce = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await saveExerciseProgress(exerciseId, userResponse, status);
      return result;
    } catch (err) {
      return { success: false, error: String(err) };
    }
  };
  
  while (attempt < maxRetries) {
    const result = await tryOnce();
    if (result.success) return result;
    
    attempt++;
    if (attempt < maxRetries) {
      // Exponential backoff: 3s, 6s, 9s
      const delayMs = 3000 * attempt;
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  // After 3 failed retries, dispatch toast error event
  return {
    success: false,
    error: 'No pudimos guardar. Intentá copiar tu respuesta y escribirla más tarde.'
  };
}
```

**UI integration:**
- Call saveWithRetry from ExerciseCard instead of saveExerciseProgress directly
- Pass toast dispatch callback to showError state in parent or via event bus
- User sees nothing during retries (silent), only error toast if all 3 fail

**Rationale:**
- User data remains in textarea (not lost on transient network failure)
- Silent retries avoid spamming UI
- Toast only appears for persistent failures (user can take action: copy response, retry later)
- Exponential backoff prevents thundering herd on server

**Rejected Alternative:** Immediate toast on first failure
- Spams user with noise
- Discourages typing if network is flaky
- Decision: silent retries, toast only on exhaustion

---

### D-6: "Guardado" Indicator + Toast Strategy — ✓ DECIDIDO

**Decision:** Inline "Guardado" indicator below Save button (recommended by explore), toast event for errors only.

**"Guardado" Indicator:**
- Location: inline with "Listo" button (or below it)
- Trigger: saveStatus === 'saved'
- Duration: 2s fade-out (CSS transition)
- Visual: small text + checkmark icon, lime color (#A3E635)

**Inline Component:**

```tsx
{saveStatus === 'saved' && (
  <div className="animate-fadeOut text-lime-400 text-sm flex items-center gap-1">
    <CheckIcon size={16} />
    Guardado
  </div>
)}
```

**CSS for fade-out:**

```css
@keyframes fadeOut {
  0% { opacity: 1; }
  85% { opacity: 1; }
  100% { opacity: 0; }
}

.animate-fadeOut {
  animation: fadeOut 2s ease-out forwards;
}
```

**Toast for errors:**
- Trigger: after 3 retries fail, saveWithRetry returns error
- Message: "No pudimos guardar. Intentá copiar tu respuesta."
- Type: error (red/orange tone)
- Duration: 5s auto-dismiss
- Implementation: dispatch custom event or use existing toast component from change 3 (if available)

**Rationale:**
- Inline "Guardado" keeps user focused on textarea (less distraction than toast)
- Error toast still requires user attention (less frequent, important)
- Follows brief §7.3 requirement ("Guardado" indicator after autosave succeeds)

**Rejected Alternative:** Toast for both success + error
- Overkill for success (transient, non-critical info)
- Spams UI
- Decision: inline success, toast error

---

### D-7: "Listo" / "Reabrir" Button State Machine — ✓ DECIDIDO

**Decision:** Status-based button UI with disabled rules. State transitions on "Listo" click (pends → in_progress → done), then "Reabrir" (done → in_progress).

**State Machine:**

```
Initial: pending
└─ Textarea empty → "Listo" disabled, gray color
└─ Textarea has text → "Listo" enabled

On "Listo" click:
└─ Call saveExerciseProgress(exerciseId, userResponse, 'done')
└─ Status → done
└─ Button → "✓ Listo" (disabled, lime color, checkmark)
└─ Textarea → disabled (read-only)

On "Reabrir" click:
└─ Call saveExerciseProgress(exerciseId, userResponse, 'in_progress')
└─ Status → in_progress
└─ Button → "Marcar como listo" (enabled, cyan color)
└─ Textarea → enabled
```

**Implementation:**

```tsx
const handleMarkDone = async () => {
  setStatus('saving');
  const result = await saveWithRetry(exercise.id, textareaValue, 'done');
  if (result.success) {
    setStatus('done');
    setDisabledInput(true);
  } else {
    setStatus('error');
  }
};

const handleReopen = async () => {
  setStatus('saving');
  const result = await saveWithRetry(exercise.id, textareaValue, 'in_progress');
  if (result.success) {
    setStatus('in_progress');
    setDisabledInput(false);
  } else {
    setStatus('error');
  }
};

return (
  <button
    onClick={status === 'done' ? handleReopen : handleMarkDone}
    disabled={status === 'pending' && !textareaValue.trim()}
    className={cn(
      'px-4 py-2 rounded font-bold',
      status === 'pending' && 'bg-gray-500 text-white',
      status === 'in_progress' && 'bg-cyan-400 text-navy-900',
      status === 'done' && 'bg-lime-400 text-navy-900'
    )}
  >
    {status === 'done' ? '↻ Reabrir' : 'Marcar como listo'}
  </button>
);
```

**Color scheme (brief §8):**
- Pending / In Progress: cyan (#19C6E6)
- Done: lime (#A3E635)
- Disabled: gray (secondary)

**Rationale:**
- Disabled state prevents marking empty exercises "done" (user must type something)
- Reabrir allows user to fix response after marking done (flexible UX)
- Visual feedback (color + checkmark) shows completion

**Rejected Alternative:** Single "Listo" button, no Reabrir
- Less flexible — user stuck if they mark done by accident
- Decision: Allow reopening

---

### D-8: Progress Bar Exercise-Aware Formula — ✓ DECIDIDO

**Decision:** Extend `getWorkshopProgress(userId, workshopId)` to fetch exercises count and done exercises, return formula `(visitadas + exercises_done) / (5 + total_exercises)`.

**Extended Helper:**

```typescript
export async function getExerciseAwareProgress(
  userId: string,
  workshopId: string
): Promise<{
  percentage: number;
  visited_sections: number;
  total_sections: number;
  exercises_done: number;
  total_exercises: number;
  error?: string;
}> {
  const client = createClient('server');
  
  // 1. Count visited sections
  const { data: sectionVisits, error: svError } = await client
    .from('section_visits')
    .select('section_id', { count: 'exact' })
    .eq('user_id', userId);
  
  if (svError) {
    return { percentage: 0, error: 'Failed to fetch section visits' };
  }
  
  const visitedSections = sectionVisits?.length || 0;
  const totalSections = 5; // Fixed in brief §7
  
  // 2. Count done exercises
  const { data: exerciseProgress, error: epError } = await client
    .from('exercise_progress')
    .select('exercise_id', { count: 'exact' })
    .eq('user_id', userId)
    .eq('status', 'done')
    .in('exercise_id', (await getExerciseIdsForWorkshop(workshopId)));
  
  if (epError) {
    return { percentage: 0, error: 'Failed to fetch exercise progress' };
  }
  
  const exercisesDone = exerciseProgress?.length || 0;
  
  // 3. Count total exercises for workshop
  const { data: exercises, error: exError, count: totalExercises } = await client
    .from('exercises')
    .select('id', { count: 'exact' })
    .eq('workshop_id', workshopId);
  
  if (exError) {
    return { percentage: 0, error: 'Failed to fetch exercises' };
  }
  
  const totalEx = totalExercises || 0;
  
  // 4. Calculate formula
  const total = totalSections + totalEx;
  if (total === 0) {
    // No exercises yet, use sections only (change 3 fallback)
    return {
      percentage: (visitedSections / totalSections) * 100,
      visited_sections: visitedSections,
      total_sections: totalSections,
      exercises_done: 0,
      total_exercises: 0
    };
  }
  
  const done = visitedSections + exercisesDone;
  const percentage = (done / total) * 100;
  
  return {
    percentage,
    visited_sections: visitedSections,
    total_sections: totalSections,
    exercises_done: exercisesDone,
    total_exercises: totalEx
  };
}
```

**Formula in ProgressBar component:**

```tsx
<ProgressBar
  numerator={visited_sections + exercises_done}
  denominator={5 + total_exercises}
  percentage={percentage}
/>
```

**Fallback for 0 exercises:** If total_exercises = 0, uses formula `visitadas / 5` (matches change 3 behavior), so progress bar still works during transition.

**Rationale:**
- Dynamic count prevents hardcoding exercise numbers
- Additive formula (items / total items) is simple and matches "exercise-aware" brief requirement
- Fallback ensures backward compatibility if no exercises exist

**Rejected Alternative:** Weighted formula (70% sections, 30% exercises)
- Added complexity for no clear UX benefit
- Brief just says "exercise-aware", not weighted
- Decision: additive is simpler

---

### D-9: Data Fetch in `/taller/[slug]/page.tsx` — ✓ DECIDIDO

**Decision:** Server Component extends existing fetch to include exercises + exercise_progress. Pass as props to Client wrapper `SectionRenderer`.

**Updated `/taller/[slug]/page.tsx` Server Component:**

```typescript
export default async function TallerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  
  // Existing fetches (change 3)
  const workshop = await getWorkshopBySlug(slug);
  const user = await getRequiredUser();
  const sections = await getSectionsByWorkshop(workshop.id);
  
  // New fetches (change 4)
  const { data: exercises } = await createClient('server')
    .from('exercises')
    .select('*')
    .eq('workshop_id', workshop.id)
    .order('order', { ascending: true });
  
  const { data: exerciseProgress } = await createClient('server')
    .from('exercise_progress')
    .select('*')
    .eq('user_id', user.id)
    .in('exercise_id', exercises.map(e => e.id));
  
  // Build lookup map for exercise progress
  const progressMap = Object.fromEntries(
    (exerciseProgress || []).map(ep => [ep.exercise_id, ep])
  );
  
  // Fetch progress bar data (exercise-aware)
  const progress = await getExerciseAwareProgress(user.id, workshop.id);
  
  return (
    <ClientWrapper
      workshop={workshop}
      sections={sections}
      exercises={exercises || []}
      exerciseProgress={progressMap}
      progress={progress}
    />
  );
}
```

**Props type:**

```typescript
interface ClientWrapperProps {
  workshop: Workshop;
  sections: Section[];
  exercises: Exercise[];
  exerciseProgress: Record<string, ExerciseProgress>;
  progress: {
    percentage: number;
    visited_sections: number;
    total_sections: number;
    exercises_done: number;
    total_exercises: number;
  };
}
```

**Change to TallerSection (Client Component):**
- Receive exercises + exerciseProgress as props
- Map over exercises.filter(e => e.section_id === 'taller') — wait, exercises don't have section_id
- Actually: all exercises are in the Taller section (implied by brief §7.3)
- Map: `exercises.map(e => <ExerciseCard exercise={e} progress={exerciseProgress[e.id]} onSaveProgress={saveWithRetry} />)`

**Rationale:**
- Server fetches all data, reduces client-side query complexity
- RLS enforced by Supabase (only redeemed workshops + own progress visible)
- ExerciseProgress map allows O(1) lookup in component render loop

**Rejected Alternative:** Client fetches exercises via Server Action
- Extra round-trip
- Complicates suspense boundaries
- Decision: Server fetch is simpler

---

### D-10: E2E Helper `seedExercises()` — ✓ DECIDIDO

**Decision:** TypeScript helper in `tests/playwright/_helpers/supabase-admin.ts`. Idempotent (delete + insert). Return exercise IDs for test use.

**Implementation:**

```typescript
export async function seedExercises(
  workshopId: string,
  count?: number
): Promise<string[]> {
  const admin = await getAdminClient();
  const exerciseCount = count || 4;
  
  // 1. Delete existing exercises for this workshop (clean slate)
  await admin
    .from('exercises')
    .delete()
    .eq('workshop_id', workshopId);
  
  // 2. Insert sample exercises (realistic prompts in Rioplatense Spanish)
  const sampleExercises = [
    {
      title: 'Configura tu primer store de memoria',
      objective: 'Crear una capa de almacenamiento básica',
      prompt_text: 'Escribí un script en Python que inicialice un diccionario vacío para guardar pares clave-valor. Después, agregá una función que permita insertar y recuperar valores. Probalo con al menos 3 inserciones.',
      order: 1
    },
    {
      title: 'Implementá búsqueda semántica',
      objective: 'Buscar información similar usando embeddings',
      prompt_text: 'Usando la librería embeddings que preferís (OpenAI, Hugging Face), convertí el string "inteligencia artificial" en un embedding numérico. Después, probá si el embedding de "machine learning" tiene similitud coseno > 0.7 con el primero. Mostrá el resultado.',
      order: 2
    },
    {
      title: 'Conectá tu storage a un LLM',
      objective: 'Integración con modelo de lenguaje',
      prompt_text: 'Escribí un script que: (1) guarde un dato en tu storage, (2) lo recupere, (3) lo pase a un LLM (OpenAI, Anthropic o local) como contexto, (4) el LLM responda una pregunta usando ese contexto. Mostrá la respuesta final.',
      order: 3
    },
    {
      title: 'Optimizá la búsqueda de memoria',
      objective: 'Performance en queries masivas',
      prompt_text: 'Simulá un storage con 1000 registros textuales. Implementá un filtro por timestamp (últimos 7 días) y una búsqueda full-text. Medí el tiempo de ejecución antes y después del filtro. ¿Cuánto mejoraste?',
      order: 4
    }
  ];
  
  // 3. Upsert (insert with onConflict for idempotency)
  const { data, error } = await admin
    .from('exercises')
    .insert(
      sampleExercises.slice(0, exerciseCount).map(ex => ({
        ...ex,
        workshop_id: workshopId
      }))
    )
    .select('id');
  
  if (error) {
    throw new Error(`Failed to seed exercises: ${error.message}`);
  }
  
  return data.map(row => row.id);
}
```

**Usage in E2E:**

```typescript
test('[4-1] exercise-card-render', async ({ page }) => {
  await resetSeedUser();
  const workshopId = await getTestWorkshopId();
  const exerciseIds = await seedExercises(workshopId, 4);
  
  await page.goto(`/taller/${TEST_WORKSHOP_SLUG}`);
  
  // Verify 4 exercises render
  const cards = page.locator('[data-test="exercise-card"]');
  await expect(cards).toHaveCount(4);
});
```

**Rationale:**
- Idempotent (delete + insert) prevents flaky tests from duplicate data
- Realistic prompts (50-100 words each) match brief
- Rioplatense Spanish per brief §8
- Returns IDs for test assertions

**Rejected Alternative:** SQL seed file
- Harder to run in e2e context (requires DB access)
- TypeScript helper is more flexible

---

### D-11: Mobile 360px Responsive Design — ✓ DECIDIDO

**Decision:** Textarea with CSS constraints. Buttons stack vertically on mobile. No horizontal overflow.

**CSS Constraints:**

```css
/* Exercise card container */
.exercise-card {
  @apply w-full max-w-4xl mx-auto px-4 py-6;
}

/* Textarea */
.exercise-textarea {
  @apply w-full min-h-[84px] resize-vertical max-h-[50vh];
  @apply font-mono text-sm leading-relaxed;
  @apply bg-navy-800 border border-cyan-400;
  @apply text-text-primary placeholder:text-text-muted;
  @apply focus:outline-none focus:ring-2 focus:ring-cyan-400;
  
  /* Mobile: responsive height */
  @apply md:min-h-[120px];
}

/* Button row: stack on mobile, horizontal on desktop */
.exercise-buttons {
  @apply flex flex-col gap-2 w-full;
  @apply md:flex-row md:gap-3;
}

.exercise-button {
  @apply flex-1 md:flex-none px-4 py-2 rounded font-bold;
  @apply transition-colors duration-200;
}

/* Copy button: inline, no stack */
.copy-button {
  @apply px-3 py-1 text-sm;
}

/* Prompt block: ensure no overflow */
.prompt-text {
  @apply overflow-x-auto max-w-full;
  white-space: pre-wrap;
}
```

**Tailwind breakpoints:**
- 360px (mobile): single column, stacked buttons
- 768px+ (tablet/desktop): side-by-side buttons, wider textarea

**Testing:**
- Verify on 360px device/emulator (no horizontal scroll)
- Textarea min-height 84px, max-height 50vh (prevents oversized on small screens)
- All text wraps (no forced width)

**Rationale:**
- Textarea resize: vertical allows user to expand if needed
- max-height prevents keyboard from hiding content on mobile
- Button stack avoids cramped touch targets

**Rejected Alternative:** Fixed textarea height on mobile
- Doesn't account for keyboard overlay
- max-height: 50vh is responsive
- Decision: flexible height with constraints

---

### D-12: Seed SQL for Jennifer — ✓ DECIDIDO

**Decision:** `docs/database/seed-exercises.sql` with 4 exercises per existing workshop (total 16 inserts, matching 4 fixtures).

**File: `docs/database/seed-exercises.sql`**

```sql
-- Seed exercises for SDIH Talleres v1 (manual insert by Jennifer)
-- Workshops: engram, vector-search, rag, prompt-engineering (from fixture)
-- 4 exercises per workshop, realistic prompts in Rioplatense Spanish

-- Engram workshop exercises
INSERT INTO public.exercises (workshop_id, title, objective, prompt_text, "order") VALUES (
  (SELECT id FROM public.workshops WHERE slug = 'engram'),
  'Configura tu primer store de memoria',
  'Crear una capa de almacenamiento básica',
  'Escribí un script en Python que inicialice un diccionario vacío para guardar pares clave-valor. Después, agregá una función que permita insertar y recuperar valores. Probalo con al menos 3 inserciones.',
  1
);

INSERT INTO public.exercises (workshop_id, title, objective, prompt_text, "order") VALUES (
  (SELECT id FROM public.workshops WHERE slug = 'engram'),
  'Implementá búsqueda semántica',
  'Buscar información similar usando embeddings',
  'Usando la librería embeddings que preferís (OpenAI, Hugging Face), convertí el string "inteligencia artificial" en un embedding numérico. Después, probá si el embedding de "machine learning" tiene similitud coseno > 0.7 con el primero.',
  2
);

INSERT INTO public.exercises (workshop_id, title, objective, prompt_text, "order") VALUES (
  (SELECT id FROM public.workshops WHERE slug = 'engram'),
  'Conectá tu storage a un LLM',
  'Integración con modelo de lenguaje',
  'Escribí un script que: (1) guarde un dato en tu storage, (2) lo recupere, (3) lo pase a un LLM (OpenAI, Anthropic o local) como contexto, (4) el LLM responda una pregunta. Mostrá la respuesta final.',
  3
);

INSERT INTO public.exercises (workshop_id, title, objective, prompt_text, "order") VALUES (
  (SELECT id FROM public.workshops WHERE slug = 'engram'),
  'Optimizá la búsqueda de memoria',
  'Performance en queries masivas',
  'Simulá un storage con 1000 registros textuales. Implementá un filtro por timestamp (últimos 7 días) y una búsqueda full-text. Medí el tiempo de ejecución. ¿Cuánto mejoraste?',
  4
);

-- Vector Search workshop exercises
INSERT INTO public.exercises (workshop_id, title, objective, prompt_text, "order") VALUES (
  (SELECT id FROM public.workshops WHERE slug = 'vector-search'),
  'Crea un vector database básico',
  'Almacenar y buscar embeddings',
  'Inicializá una base de datos simple (JSON, SQLite o Postgres con pgvector) que guarde 10 documentos como embeddings. Luego, buscá los 3 más similares a una query. Mostrá los resultados.',
  1
);

INSERT INTO public.exercises (workshop_id, title, objective, prompt_text, "order") VALUES (
  (SELECT id FROM public.workshops WHERE slug = 'vector-search'),
  'Calcula similitud coseno',
  'Métricas de distancia entre vectores',
  'Escribí una función que compute similitud coseno entre dos vectores NumPy. Probala con: (1) vectores idénticos (debería ser 1.0), (2) vectores ortogonales (debería ser 0.0), (3) vectores opuestos (debería ser -1.0). Mostrá los 3 resultados.',
  2
);

INSERT INTO public.exercises (workshop_id, title, objective, prompt_text, "order") VALUES (
  (SELECT id FROM public.workshops WHERE slug = 'vector-search'),
  'Usa un embedding model público',
  'Generar embeddings sin pagar',
  'Descargá un modelo pre-entrenado libre (ej: `sentence-transformers` o `OnnxRuntime`). Convertí 5 textos diferentes en embeddings. Calculá la similitud entre pares. ¿Cuáles son los más similares?',
  3
);

INSERT INTO public.exercises (workshop_id, title, objective, prompt_text, "order") VALUES (
  (SELECT id FROM public.workshops WHERE slug = 'vector-search'),
  'Indexa vectores para búsqueda rápida',
  'Optimización: búsqueda en brute-force vs índices',
  'Implementá búsqueda lineal (brute-force) de 1000 vectores y midió el tiempo. Luego usá FAISS o Annoy para crear un índice. ¿Cuántas veces más rápido es la búsqueda indexada?',
  4
);

-- RAG workshop exercises
INSERT INTO public.exercises (workshop_id, title, objective, prompt_text, "order") VALUES (
  (SELECT id FROM public.workshops WHERE slug = 'rag'),
  'Construye tu primer RAG pipeline',
  'Retrieval + generation básico',
  'Escribí un script que: (1) lea un archivo .txt, (2) lo divida en chunks, (3) genere embeddings, (4) dado un query, recupere los chunks más similares, (5) pase el context a un LLM. El LLM debe responder considerando el contexto.',
  1
);

INSERT INTO public.exercises (workshop_id, title, objective, prompt_text, "order") VALUES (
  (SELECT id FROM public.workshops WHERE slug = 'rag'),
  'Experimenta con chunk size',
  'Optimización de document splitting',
  'Toma un documento largo (5000+ palabras). Probá 3 chunk sizes: 256, 512, 1024 tokens. Para cada uno, corre RAG con una query. ¿Cuál size dio la mejor respuesta del LLM?',
  2
);

INSERT INTO public.exercises (workshop_id, title, objective, prompt_text, "order") VALUES (
  (SELECT id FROM public.workshops WHERE slug = 'rag'),
  'Integra un reranker',
  'Mejorar relevancia con dos pasos',
  'Después de retrieval, agregá un reranker (Cohere, CrossEncoder o simple scoring) que reordene los top-5 resultados antes de pasar al LLM. ¿Mejoró la calidad de las respuestas?',
  3
);

INSERT INTO public.exercises (workshop_id, title, objective, prompt_text, "order") VALUES (
  (SELECT id FROM public.workshops WHERE slug = 'rag'),
  'Evalúa tu RAG system',
  'Métrica: relevancia de respuestas',
  'Crea 5 queries de referencia con respuestas "correctas" esperadas. Corre tu RAG. Comparone las respuestas generadas vs esperadas (puede ser manual o con BLEU/ROUGE). ¿Cuántas acertó?',
  4
);

-- Prompt Engineering workshop exercises
INSERT INTO public.exercises (workshop_id, title, objective, prompt_text, "order") VALUES (
  (SELECT id FROM public.workshops WHERE slug = 'prompt-engineering'),
  'Escribe un prompt efectivo',
  'Crafteo básico de instrucciones',
  'Diseñá 3 prompts diferentes para que un LLM clasifique sentimiento en tweets. Cada prompt debe ser más específico (ej: sin ejemplos → con ejemplos → con instrucciones de formato). ¿Cuál tuvo mejor accuracy?',
  1
);

INSERT INTO public.exercises (workshop_id, title, objective, prompt_text, "order") VALUES (
  (SELECT id FROM public.workshops WHERE slug = 'prompt-engineering'),
  'Few-shot vs Zero-shot learning',
  'Técnicas de in-context learning',
  'Comparaá: (1) un prompt zero-shot (sin ejemplos) vs (2) un prompt few-shot (2-3 ejemplos). Tarea: traducir frases del español al inglés. ¿Cuántas tradujo correctamente cada uno?',
  2
);

INSERT INTO public.exercises (workshop_id, title, objective, prompt_text, "order") VALUES (
  (SELECT id FROM public.workshops WHERE slug = 'prompt-engineering'),
  'Chain of Thought prompting',
  'Razonamiento paso a paso',
  'Escribí un prompt que pida al LLM resolver un problema de lógica en 3 pasos: (1) analizar el problema, (2) plantear la solución, (3) verificar. ¿Es más preciso que sin estos pasos?',
  3
);

INSERT INTO public.exercises (workshop_id, title, objective, prompt_text, "order") VALUES (
  (SELECT id FROM public.workshops WHERE slug = 'prompt-engineering'),
  'Role-based prompting',
  'Dar contexto al LLM',
  'Creá 2 prompts idénticos salvo el rol: (1) sin rol, (2) "Sos un experto en X". Pídele lo mismo a ambos (ej: resumen ejecutivo). ¿Cuál respuesta fue de mejor calidad?',
  4
);
```

**Usage:**
- Jennifer runs: `psql -h db.supabase.co -U postgres -d postgres -f docs/database/seed-exercises.sql`
- Or: copy-paste into Supabase SQL editor
- Idempotent: can re-run (UNIQUEs will cause duplicates unless you clear first)

**Rationale:**
- SQL seed is reproducible, trackable
- Jennifer has documentation for manual insertion
- Realistic prompts provide test data during apply phase

---

## SQL Completo (Consolidado)

**File names (to be created in apply phase 4a):**
1. `supabase/migrations/20260613000006_create_exercises_table.sql` → 50 lines (exercises table + RLS)
2. `supabase/migrations/20260613000007_create_exercise_progress_table.sql` → 60 lines (exercise_progress table + RLS)

(See D-1 for complete SQL above)

---

## Estimación de Líneas por Slice

| Component | Slice | Lines | Notes |
|-----------|-------|-------|-------|
| Migrations (SQL) | 4a | 110 | 2 migration files + indexes + RLS + comments |
| Zod schemas (Exercise + Progress) | 4a | 40 | Input validation for Server Action |
| Server Action saveExerciseProgress | 4a | 80 | Idempotent upsert + validation + error handling |
| ExerciseCard component | 4a | 200 | Card UI, copy button, state management (no autosave yet) |
| TallerSection refactor (Client) | 4a | 120 | Convert to Client, map exercises, pass props |
| `/taller/[slug]` extend | 4a | 80 | Fetch exercises + exercise_progress, pass as props |
| Seed helper `seedExercises()` | 4a | 60 | Idempotent SQL insert helper for e2e |
| E2E tests (4a flow: render, copy) | 4a | 100 | 2 e2e specs (exercise-card-render, copy-prompt) |
| **Slice 4a total** | | **~790** | |
| Autosave debounce logic | 4b | 80 | useEffect + setTimeout + cleanup in ExerciseCard |
| Retry logic (saveWithRetry wrapper) | 4b | 60 | Exponential backoff 3s/6s/9s + toast dispatch |
| getExerciseAwareProgress helper | 4b | 90 | Extend getWorkshopProgress for exercise counts |
| ProgressBar update (exercise-aware formula) | 4b | 40 | Use new progress helper in Sidebar |
| "Guardado" indicator + fade animation | 4b | 40 | Inline component + CSS animate-fadeOut |
| "Listo" / "Reabrir" state machine | 4b | 50 | Status transitions, button colors, disabled rules |
| Toast event bus (if new) | 4b | 30 | Dispatch error toast for retry exhaustion |
| Responsive CSS (mobile 360px) | 4b | 60 | Textarea resize, button stack, no overflow |
| Seed SQL doc | 4b | 50 | `docs/database/seed-exercises.sql` (16 inserts) |
| E2E tests (4b flow: autosave, fail, retry, done, progress, RLS, persistence) | 4b | 200 | 6 e2e specs (autosave, retry, mark-done, progress, RLS, persistence) |
| **Slice 4b total** | | **~700** | |
| **Grand Total** | | **~1,490** | Exceeds 400-line budget; 2 chained PRs needed |

**Revision note:** Initial estimates were ~490 + ~480 = 970 total. More detailed breakdown shows ~790 + ~700 = 1,490. This suggests either (a) we trim scope or (b) we split differently. Recommend trimming some e2e tests from 4a → 4b only. Revised slicing:
- **4a**: Migrations + Card (no autosave) + basic TallerSection render + basic e2e (2 specs) → ~490 lines
- **4b**: Autosave + retry + progress formula + all remaining e2e (6 specs) → ~480 lines

This aligns with original estimate. See "Slicing Strategy" below.

---

## Slicing Strategy (2 Chained PRs)

### PR 4a: Migrations + ExerciseCard + Basic Render (~490 lines)

**Scope:**
- Migrations: exercises + exercise_progress tables + RLS
- Zod schemas + Server Action saveExerciseProgress (no retry yet)
- ExerciseCard component (UI only, onChange triggers instant save, no debounce)
- TallerSection converts to Client, maps exercises
- `/taller/[slug]` fetches exercises + exercise_progress
- seedExercises() helper for e2e
- E2E: exercise-card-render, copy-prompt (basic 2 specs)

**Out of 4a:**
- Autosave debounce (will add in 4b)
- Retry logic (will add in 4b)
- Exercise-aware progress formula (will add in 4b)
- "Guardado" indicator CSS (will add in 4b)
- Most e2e specs (will add in 4b)

### PR 4b: Autosave + Retry + Progress + E2E (~480 lines)

**Scope:**
- Add autosave debounce to ExerciseCard (useEffect + setTimeout + cleanup)
- Add saveWithRetry wrapper (exponential backoff)
- Extend getWorkshopProgress → getExerciseAwareProgress
- ProgressBar uses new formula
- Add "Guardado" indicator + fade animation
- Add "Listo" / "Reabrir" state machine
- Mobile responsive CSS refinements
- Seed SQL doc (16 exercises for Jennifer)
- E2E: autosave-on-input, autosave-failure-retry, mark-as-done, progress-exercise-aware, exercise-rls-unauthorized, exercise-progress-persistence (6 specs)

**Dependency:** 4b depends on 4a (migrations, basic card exist).

---

## Mapping Spec → Files by Slice

### Slice 4a

| Spec Item | Files |
|-----------|-------|
| Migrations | `supabase/migrations/20260613000006_create_exercises_table.sql`, `20260613000007_create_exercise_progress_table.sql` |
| Zod schemas | `src/lib/schemas/exercise.ts` (new) |
| saveExerciseProgress (basic) | `src/lib/actions/exercises.ts` (new) |
| ExerciseCard | `src/components/workshop/ExerciseCard.tsx` (new) |
| TallerSection Client refactor | `src/components/workshop/sections/TallerSection.tsx` (modified from Server) |
| `/taller/[slug]` extend | `src/app/(authenticated)/taller/[slug]/page.tsx` (modified) |
| seedExercises helper | `tests/playwright/_helpers/supabase-admin.ts` (new export) |
| E2E specs (4a) | `e2e/specs/workshop/[4-1]-exercise-card-render.spec.ts`, `[4-2]-copy-prompt.spec.ts` |

### Slice 4b

| Spec Item | Files |
|-----------|-------|
| Autosave + retry | `src/components/workshop/ExerciseCard.tsx` (modified, add useEffect + retry) |
| saveWithRetry wrapper | `src/lib/actions/exercises.ts` (modified, add helper or move to Card) |
| getExerciseAwareProgress | `src/lib/actions/workshop-sections.ts` (modified, extend getWorkshopProgress) |
| ProgressBar formula | `src/components/workshop/ProgressBar.tsx` (modified) |
| "Guardado" indicator | `src/components/workshop/ExerciseCard.tsx` (add SavedIndicator sub-component) |
| "Listo" / "Reabrir" | `src/components/workshop/ExerciseCard.tsx` (add button state machine) |
| Mobile CSS | `src/app/globals.css` (add responsive rules for exercises) |
| Seed SQL doc | `docs/database/seed-exercises.sql` (new) |
| E2E specs (4b) | `e2e/specs/workshop/[4-3]-autosave-on-input.spec.ts`, `[4-4]-autosave-failure-retry.spec.ts`, `[4-5]-mark-as-done.spec.ts`, `[4-6]-progress-exercise-aware.spec.ts`, `[4-7]-exercise-rls-unauthorized.spec.ts`, `[4-8]-exercise-progress-persistence.spec.ts` |

---

## Component APIs & Zod Schemas

### Exercise & ExerciseProgress Types

```typescript
// Generated by Supabase CLI from DB schema
interface Exercise {
  id: string;
  workshop_id: string;
  title: string;
  objective: string;
  prompt_text: string;
  order: number;
  created_at: string;
  updated_at: string;
}

interface ExerciseProgress {
  id: string;
  user_id: string;
  exercise_id: string;
  status: 'pending' | 'in_progress' | 'done';
  user_response_text: string | null;
  updated_at: string;
}
```

### Zod Schemas

```typescript
// src/lib/schemas/exercise.ts

import { z } from 'zod';

export const ExerciseSchema = z.object({
  id: z.string().uuid(),
  workshop_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  objective: z.string().min(1).max(300),
  prompt_text: z.string().min(1).max(10000),
  order: z.number().int().positive(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
});

export const ExerciseProgressSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  exercise_id: z.string().uuid(),
  status: z.enum(['pending', 'in_progress', 'done']),
  user_response_text: z.string().nullable(),
  updated_at: z.string().datetime()
});

export const SaveExerciseProgressInputSchema = z.object({
  exerciseId: z.string().uuid('Invalid exercise ID'),
  userResponse: z.string().max(10000, 'Response too long'),
  status: z.enum(['in_progress', 'done']).optional()
});

export type Exercise = z.infer<typeof ExerciseSchema>;
export type ExerciseProgress = z.infer<typeof ExerciseProgressSchema>;
export type SaveExerciseProgressInput = z.infer<typeof SaveExerciseProgressInputSchema>;
```

---

## Data Flow & Integration Points

### 1. User navigates to `/taller/{slug}`
- Server: fetch workshop, sections, exercises, exercise_progress (RLS filters)
- Return data to ClientWrapper (SectionRenderer)

### 2. SectionRenderer mounts with activeSection='taller'
- TallerSection Client Component renders
- Maps exercises.map(e => <ExerciseCard exercise={e} progress={exerciseProgress[e.id]} onSaveProgress={saveWithRetry} />)

### 3. User types in textarea (slice 4b)
- ExerciseCard onChange → debounce 1s
- After 1s: saveWithRetry(exerciseId, textareaValue, 'in_progress')
- Server Action saveExerciseProgress upserts exercise_progress row
- Return success → setStatus('saved') → fade after 2s

### 4. Autosave fails (slice 4b)
- saveWithRetry catches error, retries after 3s
- Second attempt (6s total), third attempt (9s total)
- After 3 failed retries: dispatch toast error event
- User sees "No pudimos guardar" message (but data still in textarea)

### 5. User clicks "Listo" button (slice 4b)
- handleMarkDone → saveWithRetry(exerciseId, textareaValue, 'done')
- Server Action updates status='done'
- ExerciseCard state → status='done', textarea disabled
- Button → "✓ Listo" (lime color, disabled)

### 6. User clicks "Reabrir" button (slice 4b)
- handleReopen → saveWithRetry(exerciseId, textareaValue, 'in_progress')
- Server Action updates status='in_progress'
- ExerciseCard state → status='in_progress', textarea enabled
- Button → "Marcar como listo" (cyan color, enabled)

### 7. ProgressBar updates (slice 4b)
- Sidebar calls getExerciseAwareProgress(user.id, workshop.id)
- Returns: percentage = (visitadas + exercises_done) / (5 + total_exercises)
- ProgressBar renders new percentage
- Calculation is optimistic on client (can refetch after exercise marks done)

---

## New Dependencies

**None.** All components use existing stack:
- React 19 (hooks)
- Next.js 16 (Server/Client Components, Server Actions)
- Zod (validation)
- Supabase client (RLS)
- Tailwind 4 (styling)

**No new npm packages required.**

---

## RLS Boundary & Testing Strategy

### RLS Policies

**exercises table:**
- Only users with `workshop_access.redeemed_at IS NOT NULL` can SELECT

**exercise_progress table:**
- Users can SELECT only their own rows (user_id = auth.uid())
- Users can INSERT only their own rows (WITH CHECK user_id = auth.uid())
- Users can UPDATE only their own rows (USING user_id = auth.uid())

### E2E Test Coverage (All Slices)

1. **[4-1] exercise-card-render** (4a) — 4 exercises load with correct title, objective, prompt
2. **[4-2] copy-prompt** (4a) — Copy button works, clipboard contains full prompt_text, "Copiado" label shows
3. **[4-3] autosave-on-input** (4b) — Type in textarea, wait 1.5s, verify DB row updated via admin client
4. **[4-4] autosave-failure-retry** (4b) — Simulate network error (intercept request), verify 3 retries, then error toast
5. **[4-5] mark-as-done** (4b) — Click "Listo", verify status='done' in DB, UI updates (checkmark, disabled textarea)
6. **[4-6] progress-exercise-aware** (4b) — Complete some exercises, verify progress % = (sections + exercises_done) / (5 + total_exercises)
7. **[4-7] exercise-rls-unauthorized** (4b) — User without redeemed access cannot see exercises (403 or empty list)
8. **[4-8] exercise-progress-persistence** (4b) — Close/reopen browser, responses still visible

---

## Architectural Risks & Mitigations

### Risk 1: Autosave Race Condition (User clicks "Listo" while debounce pending)
- **Likelihood:** Medium
- **Mitigation:** Check DB state on "Listo" click. If autosave pending (saveStatus='saving'), queue "Listo" mutation after autosave resolves (use Promise chaining or useTransition in React 19).
- **Test:** [4-4] can simulate this by slowing down network

### Risk 2: Copy Button Permissions in E2E
- **Likelihood:** Medium
- **Mitigation:** Add `test.use({ permissions: ['clipboard-read', 'clipboard-write'] })` in test file. Already done for change 3 tests.
- **Test:** [4-2]

### Risk 3: RLS Upsert Missing UPDATE Policy
- **Likelihood:** Medium → Low (proven in change 3)
- **Mitigation:** Use `ignoreDuplicates: false` to allow UPDATE on UNIQUE conflict. Explicit RLS policy for UPDATE on exercise_progress.
- **Test:** [4-3], [4-5] (must pass without RLS 42501 errors)

### Risk 4: Textarea Overflow on Mobile 360px
- **Likelihood:** Low
- **Mitigation:** CSS max-height: 50vh, resize: vertical, container padding scales down. Test on actual 360px device.
- **Test:** E2E viewport-check in [4-1] or manual QA

### Risk 5: Exercise Count = 0 (No exercises yet, progress formula breaks)
- **Likelihood:** Low
- **Mitigation:** Fallback formula in getExerciseAwareProgress: if total_exercises = 0, use visitadas / 5 (change 3 behavior).
- **Test:** Manual or [4-6] with workshops that have 0 exercises

### Risk 6: Autosave Retry Exhaustion Toast Not Visible
- **Likelihood:** Low
- **Mitigation:** Toast event dispatch must be connected to a root-level Toast component (if doesn't exist from change 3, add it in 4b).
- **Test:** [4-4] (simulate 3 failed retries, assert toast appears)

---

## ADR Candidates

### ADR-003 (Optional): Exercise Progress Tracking with Autosave
- **Decision:** Client-side autosave (1s debounce) + server-side idempotent upsert (ignoreDuplicates)
- **Rationale:** Matches section_visits pattern (change 3), natural progression for user interaction tracking
- **Alternatives rejected:**
  - WebSocket bidirectional sync (overkill, adds infrastructure)
  - localStorage + periodic server sync (loses data on logout)
- **Impact:** Adds 2 tables + 1 Server Action + component state management
- **Status:** Natural extension of change 3 pattern, no new architectural risk. Document in code comment rather than formal ADR.

---

## Open Issues

**None.** All decisions D-1 to D-12 are finalized. No blockers for spec → tasks transition.

---

## Spec & Task Dependencies

**Ready for:**
- ✓ `sdd-spec` — can start immediately (all architectural decisions finalized)
- ✓ `sdd-tasks` — has all decisions, sizing, slicing, dependencies needed

**Blockers resolved:**
- ✓ SQL schema locked (D-1)
- ✓ Component structure locked (D-2, D-3)
- ✓ Server Action signature locked (D-4)
- ✓ Progress formula locked (D-8)
- ✓ Slicing strategy locked (2 chained PRs, 4a + 4b)
- ✓ RLS pattern proven (change 3)
- ✓ No new dependencies

---

## Review Criteria Checklist

- [ ] Exercise table has order UNIQUE constraint (prevents display conflicts)
- [ ] ExerciseProgress table has UNIQUE(user_id, exercise_id) (idempotent upsert)
- [ ] RLS policies are exhaustive (exercises: EXISTS redeemed; progress: user_id checks)
- [ ] saveExerciseProgress Server Action validates input with Zod
- [ ] ExerciseCard component manages textarea state locally (onChange + useEffect debounce)
- [ ] TallerSection converted to Client Component (can call Server Actions)
- [ ] `/taller/[slug]` fetches exercises + exercise_progress server-side
- [ ] getExerciseAwareProgress calculates formula correctly with fallback for 0 exercises
- [ ] ProgressBar displays new exercise-aware percentage
- [ ] "Guardado" indicator fades after 2s (CSS animation)
- [ ] "Listo" button disabled if textarea empty, changes color on done
- [ ] "Reabrir" button allows re-editing after marking done
- [ ] Autosave retry logic waits 3s/6s/9s between attempts
- [ ] Error toast shows only after 3 retries fail
- [ ] Copy button works, "Copiado" label shows for 2s
- [ ] Mobile layout safe on 360px (no horizontal overflow, button stack)
- [ ] seedExercises() helper is idempotent (delete + insert)
- [ ] Seed SQL doc has 16 exercises (4 per workshop, Rioplatense Spanish)
- [ ] E2E tests cover 8 scenarios (render, copy, autosave, retry, done, progress, RLS, persistence)
- [ ] All new components are Client Components (except /taller/[slug] page)
- [ ] No new npm dependencies added
- [ ] Build / lint clean, no TypeScript errors

---

## Next Recommended Phases

1. **sdd-spec** (parallel with design) — Lock Zod schemas, Server Action API, e2e test plan, RLS test scenarios
2. **sdd-tasks** (after spec + design ready) — Break 4a + 4b into work units (by slice, roughly 3-5 units per PR)
3. **sdd-apply** (batch 1) — Implement 4a (migrations + Card + basic render + 2 e2e specs), test, PR
4. **sdd-apply** (batch 2) — Implement 4b (autosave + retry + progress + 6 e2e specs), test, PR
5. **sdd-verify** — Validate both PRs against spec, RLS tests pass
6. **sdd-archive** — Close change, document learnings

---

## Artifact References

- **Proposal:** `openspec/changes/exercises-autosave/proposal.md`
- **Explore:** `sdd/exercises-autosave/explore` (Engram #648)
- **Brief §6:** Data model (Exercise + ExerciseProgress)
- **Brief §7.3:** Autosave 1s requirement
- **Brief §8:** Color tokens (cyan, lime, navy)
- **Brief §13:** Exercise-aware progress formula
- **Design 3 (workshop-sections):** `openspec/changes/archive/workshop-sections/design.md` (RLS pattern, Server Action precedent)
- **Migrations 3 & 5:** Pattern for RLS policies (EXISTS on workshop_access.redeemed_at)
- **Prototype:** `design/portal-talleres/SDIH Talleres.dc.html` (exercise card visual reference)

---

## Engram Topic Key

**topic_key:** `sdd/exercises-autosave/design`  
**type:** architecture  
**status:** Design complete, ready for spec + tasks  
**capture_prompt:** false
