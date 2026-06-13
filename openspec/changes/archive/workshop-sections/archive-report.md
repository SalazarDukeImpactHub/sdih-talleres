# Archive Report — workshop-sections

**Change ID:** workshop-sections
**Status:** Archived
**Fecha cierre:** 2026-06-13
**Posición en plan SDD:** 3 de 8 (brief §13)

## Resumen ejecutivo

Workshop detail view completo: `/taller/[slug]` con guard de canje, 5 secciones (Inicio · Aprendizaje · Taller · Instalación · Glosario), sidebar con drawer mobile, ProgressBar gradiente con progreso optimista persistido server-side, footer con 4 redes (IG/LinkedIn/TikTok/YT). Entregado en **2 chained PRs** (#3 slice 3a, #4 slice 3b). Verify PASS con 0 critical / 0 warning.

## Stats del change

| Métrica | Valor |
|---|---|
| Slices / PRs | 2 (3a: ~1.200 líneas con tests · 3b: ~1.300) |
| Tasks ejecutadas | 37/37 |
| Vitest | 44 passed / 2 skipped |
| Playwright e2e | **109/110 PASSED** (14.7m, chromium + Mobile Chrome) · 1 skipped documentado |
| Build / lint | limpios |
| Findings verify | 0 critical · 0 warning · 1-2 suggestion |
| ADR generados | **ADR-001** (content_json: schema fijo por tipo) — Aceptado |

## Commits del change

- `86f152c` docs(sdd): plan + ADR-001
- `c7b0c54` feat: slice 3a — migraciones + ruta /taller/[slug] + sidebar + secciones
- `c927f0e` fix: slice 3a verde end-to-end (boundary mobile, progreso optimista, helpers)
- `da03b93` Merge PR #3 (slice 3a)
- `f1fa60d` feat: slice 3b — Taller/Instalación/Glosario + redes + e2e
- `b150ff5` Merge PR #4 (slice 3b)

## Decisiones cacheadas en este change (heredan a changes 4-8)

| Decisión | Valor |
|---|---|
| `content_json` de secciones | Discriminated union Zod por tipo (ADR-001) — admin panel del change 5 carga formularios fijos por tipo |
| Progreso | `section_visits` server-side + optimista client-side (set en useState, callback desde SectionRenderer al confirmar Server Action) |
| RLS secciones/glosario | `EXISTS` sobre `workshop_access.redeemed_at IS NOT NULL` — patrón reutilizable para tablas que dependen de canje |
| Drawer mobile | Component separado del sidebar desktop con aria-label propio (`Workshop sections mobile`) — el helper `getWorkshopSidebar(page)` detecta viewport |
| Singleton del admin client | `let _adminClient: any = null` en `_helpers/supabase-admin.ts` — evita saturar pool de WebSockets en suites largas |
| `upsert()` con RLS | SIEMPRE `ignoreDuplicates: true` (= ON CONFLICT DO NOTHING) cuando la policy UPDATE no existe |
| Selectores e2e | Roles + aria-labels, NUNCA jerarquías frágiles de DOM ni `text=` sin scope |
| Clipboard en Playwright | `test.use({ permissions: ['clipboard-read', 'clipboard-write'] })` en cada spec |

## Lecciones institucionalizadas (TODOS los changes futuros)

1. **`createClient()` por llamada satura el pool en suites largas** — Supabase Realtime usa WebSocket por defecto. 110+ clientes simultáneos rompen FK constraints intermitentemente sin error claro. Singleton siempre.
2. **`upsert()` con RLS sin policy UPDATE = silent fail** — internamente dispara `ON CONFLICT DO UPDATE` que exige policy UPDATE. `ignoreDuplicates: true` lo arregla.
3. **Race condition de `useEffect` para viewport detection** — primer render tiene default `false`. Mejor chequear el estado real del DOM (`if (showDrawer) setShowDrawer(false)`) en vez de derived state.
4. **Overflow horizontal en mobile** — defensa en profundidad con `overflow-x-hidden` en el outer + `min-w-0` en flex children + `overflow-x-hidden` en el main.
5. **Servidor→Cliente boundary** (reconfirmado del change 2) — funciones NUNCA cruzan; el estado interactivo vive en Client Components con props serializables.
6. **El gate completo descubre bugs que correr aislado oculta** — los specs en suite serial someten a Supabase a stress que revela problemas de pool. Workers=1 + paciencia, siempre.

## Pendientes que heredan otros changes

| Pendiente | Va en |
|---|---|
| Rellenar `TallerSection` con ejercicios reales + autosave | Change 4 (`exercises-autosave`) |
| Barra de progreso exercise-aware (no solo visitadas/5) | Change 4 |
| CRUD de Workshop/Section/GlossaryTerm desde admin panel | Change 5 |
| Hash de access_key (claves planas en v1) | Change 5 |
| Migración `middleware` → `proxy` (Next 16 deprecation warning) | Change 8 |
| Refactorizar `workshop-e2e-full-flow.spec.ts` en 2-3 specs más cortos | Polish v1.1 (destrabar el skipped) |
| Setear 4 env vars de redes reales (`NEXT_PUBLIC_{IG,LI,TT,YT}_URL`) | Acción humana de Jennifer (anytime) |
| Un seed user por spec (para paralelizar la suite) | Cuando la suite supere ~15 min |

## Estado final

**ARCHIVED** — mergeado a master en PRs #3 y #4. Próximo change recomendado: **`exercises-autosave` (4 de 8)**. La sección Taller pasa de placeholder a ejercicios reales (Exercise + ExerciseProgress tables, textarea con autosave debounce 1s, marcar como completados). El brief §6 ya tiene el modelo de datos. Antes del propose: evaluar si los ejercicios necesitan ADR propio o caen naturales en el patrón existente.
