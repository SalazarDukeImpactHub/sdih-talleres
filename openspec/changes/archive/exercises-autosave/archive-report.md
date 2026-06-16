# Archive Report — exercises-autosave

**Change ID:** exercises-autosave
**Status:** Archived
**Fecha cierre:** 2026-06-16
**Posición en plan SDD:** 4 de 8 (brief §13)

## Resumen ejecutivo

Ejercicios accionables en la sección Taller: el alumno lee el prompt del instructor, lo copia con un click, escribe su respuesta en un textarea con autosave (debounce 1s + retry exponencial), y marca el ejercicio como completado (re-editable con "Reabrir"). La barra de progreso pasó a ser exercise-aware. Entregado en **2 chained PRs** (#6 slice 4a, #7 slice 4b). Verify PASS con 0 critical.

## Stats del change

| Métrica | Valor |
|---|---|
| Slices / PRs | 2 (4a ~490 líneas · 4b ~480) |
| Vitest | 62 passed / 2 skipped |
| Playwright e2e | **156/156 PASSED** (25.4m, chromium + Mobile Chrome) |
| Build / lint | limpios (1 warning pre-existente de isMobile, ajeno al change) |
| Findings verify | 0 critical · 1 warning · 2 suggestions |
| Tablas nuevas | exercises + exercise_progress |

## Commits del change

- `docs(sdd)` plan exercises-autosave
- `86ecbad` feat: slice 4a — migraciones + ExerciseCard + render básico
- `a8cc166` fix: slice 4a verde end-to-end (126/126)
- `51824a0` Merge PR #6 (slice 4a)
- `6c2737d` feat: slice 4b — autosave debounce + retry + progress exercise-aware
- `53aefc4` fix: progress specs drawer-aware en mobile
- `5a83a5c` Merge PR #7 (slice 4b)

## Decisiones cacheadas en este change (heredan a changes 5-8)

| Decisión | Valor |
|---|---|
| Autosave | Solo autosave (sin botón Guardar manual), debounce 1s + retry exp 3s/6s/9s + toast tras 3 fallos |
| Botón Listo | Disabled si textarea vacía · re-editable con "Reabrir" (vuelve a in_progress) |
| prompt_text | Plain TEXT (sin ADR — prompts simples del prototipo) |
| exercise_progress | RLS con policy UPDATE explícita (mutable, a diferencia de section_visits append-only) |
| upsert mutable | `ignoreDuplicates: false` + policy UPDATE cuando la tabla necesita actualizar |
| Progreso | exercise-aware (visitadas + done)/(5 + total_exercises), fallback a visitadas/5 |
| Optimistic | El render de estado usa `localStatus` (no el prop server inmutable) |

## Lecciones institucionalizadas (TODOS los changes futuros)

1. **Componentes con UI mutable llevan `data-testid` + `data-state`** — el selector debe basarse en testid + estado, NO en el texto del botón que cambia. (CopyButton, ExerciseCard).
2. **`{ count: 'exact', head: true }` devuelve `data: null`** — el count va en el campo `count`, no en `data.length`. Para contar Y leer, traer los ids sin head.
3. **RLS NO se verifica vía pg_policies/information_schema** (PostgREST no los expone) — la prueba correcta es funcional con un cliente anónimo (sin auth.uid()).
4. **El estado de sección activa es client-side** (no en la URL) — tras un reload la app vuelve a Inicio; los specs deben re-navegar.
5. **En mobile el drawer se cierra al navegar** — re-obtener el sidebar con `getWorkshopSidebar` antes de cada click (helper visitSection).
6. **Autosave + acción explícita generan race** — un onBlur save concurrente con un click de "done" puede pisarlo. El debounce alcanza; evitar saves redundantes en blur.
7. **Verificar persistencia async con poll DB** (helper pollExerciseProgress), no `waitForTimeout` fijo.
8. **NUNCA lanzar el gate e2e dos veces en paralelo** — compiten por el puerto 3000 y el seed user, abortan la suite ("did not run"). Una sola instancia.

## Pendientes que heredan otros changes

| Pendiente | Va en |
|---|---|
| Test e2e [4-4] retry/toast con mock de network | Polish / follow-up |
| Progreso optimista con ejercicios (revalidatePath en vez de reload) | Polish v1.1 |
| CRUD de exercises desde admin (reemplaza seed SQL) + hash de access_key | Change 5 (admin-panel) |
| Migración middleware → proxy (Next 16 deprecation) | Change 8 |
| **Refactor de la suite e2e: un seed user por spec** → habilita fullyParallel + workers>1 → baja de ~38min a ~8min. La suite serial larga es la causa de la flakiness de infra. | **PRIORIDAD antes de change 5** |

## Estado final

**ARCHIVED** — mergeado a master en PRs #6 y #7. Próximo paso recomendado: el **refactor de la suite e2e** (un seed user por spec) ANTES del change 5 (admin-panel). La suite en ~38min serial ya causó dos incidentes (flakiness mobile + contaminación por doble-lanzamiento del gate).
