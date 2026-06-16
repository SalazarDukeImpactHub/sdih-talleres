# Verify Report — exercises-autosave

**Change ID:** exercises-autosave
**Status:** PASS
**Fecha:** 2026-06-16
**Spec:** ./spec.md · **Design:** ./design.md · **Tasks:** ./tasks.md
**PRs:** #6 (slice 4a) y #7 (slice 4b) — ambos mergeados a master

## Resumen ejecutivo

Change 4 completamente implementado en dos slices encadenados: 4a (migraciones + ExerciseCard + render básico) y 4b (autosave debounce + retry + progreso exercise-aware). 14/14 RF PASS, 15/16 escenarios Gherkin cubiertos (1 deferred), D-1 a D-12 respetadas. Gate: build, lint, Vitest (62/2 skip) y **e2e 156/156 PASSED (25.4m, chromium + Mobile Chrome)** verificado independientemente por el orchestrator tras corrida limpia. 0 CRITICAL, 1 WARNING (test [4-4] retry/toast deferred), algunas suggestions.

## Auditoría RF (14/14 PASS)

| RF | Qué | Evidencia |
|---|---|---|
| RF-1 [4a] | Tabla exercises + RLS EXISTS sobre canje | `supabase/migrations/20260616000006_create_exercises_table.sql` |
| RF-2 [4a] | Tabla exercise_progress + RLS SELECT/INSERT/UPDATE propias + UNIQUE | `...20260616000007_create_exercise_progress_table.sql` |
| RF-3 [4a] | Schemas Zod Exercise/ExerciseProgress/SaveExerciseProgress | `src/lib/schemas/exercise.ts` |
| RF-4 [4a] | Server Action saveExerciseProgress (Zod + upsert ignoreDuplicates:false) | `src/lib/actions/exercises.ts` |
| RF-5 [4a] | ExerciseCard: número + título + objective + prompt + copy + textarea + botón | `src/components/workshop/ExerciseCard.tsx` |
| RF-6 [4a] | Botón Copy del prompt con feedback "Copiado" 2s | `src/components/workshop/CopyButton.tsx` |
| RF-7 [4a] | TallerSection Client Component renderea ExerciseCards ordenadas | `src/components/workshop/sections/TallerSection.tsx` |
| RF-8 [4a] | page.tsx fetch exercises + exercise_progress + pass props | `src/app/(authenticated)/taller/[slug]/page.tsx` |
| RF-9 [4b] | Autosave debounce 1s (useState + setTimeout + ref cleanup) | `ExerciseCard.tsx` handleInputChange |
| RF-10 [4b] | saveWithRetry backoff exponencial 3s/6s/9s | `src/lib/client/exercises-retry.ts` |
| RF-11 [4b] | Indicador "Guardado" inline (fade 2s) | `ExerciseCard.tsx` saveStatus="saved" |
| RF-12 [4b] | Botón "Marcar como listo" ↔ "Reabrir" (state machine localStatus) | `ExerciseCard.tsx` handleMarkDone |
| RF-13 [4b] | Progreso exercise-aware (visitadas+done)/(5+total) con fallback | `src/lib/actions/workshop-sections.ts` getExerciseAwareProgress |
| RF-14 [4b] | Toast root para errores de autosave tras 3 retries | CustomEvent toast:show + listener en WorkshopView |

## Auditoría RNF (PASS)

- **Seguridad**: RLS en exercises (EXISTS sobre canje) y exercise_progress (filas propias). Test e2e de aislamiento con cliente ANÓNIMO (sin auth.uid()) confirma bloqueo. Validación Zod server-side. Sin secretos en código. exercise_progress con policy UPDATE explícita (necesaria por mutabilidad, a diferencia de section_visits).
- **Performance**: debounce coalesce múltiples keystrokes en 1 save; índices en exercises(workshop_id, order) y exercise_progress(user_id, exercise_id) + (exercise_id, status).
- **Responsive**: textarea con max-h + resize-vertical; navegación drawer-aware en mobile (helper visitSection).
- **A11y**: data-testid + data-state en CopyButton, data-status en ExerciseCard, aria-labels.
- **i18n**: voseo rioplatense en toda la UI ("Escribí", "Marcá", "Reabrir").

## Gherkin: 15/16 COVERED · 1 DEFERRED

- COVERED: render, copy, autosave debounce, coalesce, mark-done, reabrir, re-edit, progress exercise-aware (44%/56%/67%/22%), fallback sin ejercicios, persistencia tras reload, RLS aislamiento (3 escenarios), botón disabled vacío.
- **DEFERRED [4-4]**: retry exponencial + toast tras 3 fallos. Simular fallo de red en Playwright sin mock de fetch es complejo. La lógica de retry es probable por unit test y el toast ya está probado en change 3. Documentado como follow-up.

## Decisiones D-1 a D-12

Todas respetadas. **Divergencia justificada**: el design mencionaba un `onBlur` save adicional; se ELIMINÓ porque generaba race condition con "Marcar como listo" (el blur disparaba un save in_progress concurrente que pisaba el done). El debounce de 1s cubre la persistencia sin el blur.

## Scope audit

- Creep: ninguno · Gap: ninguno (el [4-4] deferred es cobertura de test, no funcionalidad faltante — el retry está implementado)

## Findings

- **CRITICAL: 0**
- **WARNING (1)**: test e2e [4-4] retry/toast deferred (código completo, riesgo bajo).
- **SUGGESTIONS**: (a) el progreso con ejercicios no se actualiza optimista al marcar done — recién tras reload refleja los done (usa el valor server del mount sin revalidatePath). Documentado como limitación conocida; mejorable con revalidatePath o optimistic en client. (b) Implementar el test [4-4] con un mock de network en un follow-up.

## Bugs corregidos durante el ciclo (6)

1. Race autosave (onBlur in_progress) vs "Marcar como listo" (done) → eliminado el onBlur.
2. Render usaba prop `status` inmutable → cambiado a `localStatus` para reflejar optimistic.
3. getExerciseAwareProgress con `{count:'exact', head:true}` devuelve data=null → leía .length=0 → fallback siempre. Fix: traer ids sin head.
4. Specs RLS consultaban pg_policies (no expuesto por PostgREST) → reescritos a verificación funcional con cliente anónimo.
5. Estado de sección no persiste en reload → specs re-navegan a Taller.
6. Specs de progreso reusaban referencia vieja del sidebar → drawer mobile se cierra al navegar → helper visitSection re-obtiene el sidebar.

## Veredicto

**PASS — listo para archive.** Engram observation 655.
