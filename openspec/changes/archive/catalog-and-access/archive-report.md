# Archive Report — catalog-and-access

**Change ID:** catalog-and-access
**Status:** Archived
**Fecha cierre:** 2026-06-12
**Posición en plan SDD:** 2 de 8 (brief §13)

## Resumen ejecutivo

Catálogo de talleres completo: tablas `workshops` + `workshop_access` con RLS, grid responsive con 4 estados visuales, modal de desbloqueo por clave única con canje permanente. Entregado en **2 chained PRs** (primera vez que el proyecto usa el patrón): PR #1 (slice 2a, catálogo read-only) y PR #2 (slice 2b, modal + canje). Verify PASS con 0 critical / 0 warning.

## Stats del change

| Métrica | Valor |
|---|---|
| Slices / PRs | 2 (2a: ~440 líneas con tests · 2b: ~530) |
| Tasks ejecutadas | 45/45 (20 bloques) |
| Vitest | 27 passed / 2 skipped |
| Playwright e2e | **52/52 PASSED** (5.4m, 2 viewports) |
| Build / lint | limpios |
| Findings verify | 0 critical · 0 warning · 1 suggestion |

## Commits del change

- `4c7b7ce` docs(sdd): planificación (proposal + spec + design + tasks)
- `0c48f7b` feat: slice 2a — tablas + catálogo con badges
- `abb9ac5` fix: server/client boundary + aislamiento de specs e2e
- `8b158cf` Merge PR #1 (slice 2a)
- `988e439` feat: slice 2b — modal de clave + canje
- `6791ae2` Merge PR #2 (slice 2b)

## Decisiones cacheadas en este change (heredan a changes 3-8)

| Decisión | Valor |
|---|---|
| Claves de acceso | Texto plano en v1 + expires_at 30 días · refactor a hash en change 5 |
| Formato de clave | Alfanumérica con guiones, case-insensitive (normaliza a uppercase) |
| Canje | Permanente una vez canjeada — expiry solo bloquea canjes nuevos |
| Constraint | UNIQUE(user_id, workshop_id) — una clave por taller por alumno |
| RLS workshops | SELECT para todo autenticado (catálogo visible con candados) |
| RLS workshop_access | SELECT/UPDATE solo filas propias · INSERT vía service_role |
| Patrón modal | Client Component (WorkshopCard) con estado interno y props serializables |
| Data fetch | Una query con LEFT JOIN — RLS filtra los accesos del user |
| Cover fallback | Gradiente navy-700→navy-800 (sin imagen placeholder) |
| Filtro por estado | Diferido a v1.1 (el brief no lo exige) |
| Chained PRs | Patrón validado: funciona bien, repetir en changes que superen ~400 líneas |

## Lecciones institucionalizadas (TODOS los changes futuros)

1. **Server Components NUNCA pasan funciones a Client Components** — error runtime que crashea la página. El estado interactivo vive en el Client Component con props serializables.
2. **Specs e2e de rutas protegidas**: `loginAsSeedUser(page)` en beforeEach (helper en `tests/playwright/_helpers/auth.ts`).
3. **Aislamiento entre specs**: reset COMPLETO del estado en beforeEach (`resetSeedUser()` + fixtures propios). "Pasa aislado" no es suficiente — tiene que pasar en suite completa.
4. **Al reemplazar UI de un change anterior, actualizar los specs viejos** que asserteaban el contenido reemplazado.
5. **Verificar merges en el remote** (`git fetch` + log de origin/master) antes de crear branches — un "mergeado" verbal puede no estar materializado.
6. **Sub-agentes de fases SDD necesitan paths absolutos explícitos** del proyecto — el workspace padre también tiene openspec/ y contamina.

## Pendientes que heredan otros changes

| Pendiente | Va en |
|---|---|
| Ruta /taller/[slug] (botón "Continuar" hoy disabled) | Change 3 |
| Generación de claves desde admin + hash | Change 5 |
| aria-describedby en input del modal | Polish v1.1 |
| Un seed user por spec e2e (hoy workers=1 compensa) | Cuando la suite supere ~10 min |

## Estado final

**ARCHIVED** — mergeado a master en 2 PRs. Próximo change recomendado: `workshop-sections` (3 de 8) — las 5 secciones del taller. Nota previa: decisión arquitectónica abierta sobre el modelado de `content_json` (bloques tipados vs markdown) — meter `/arquitecto` antes del design.
