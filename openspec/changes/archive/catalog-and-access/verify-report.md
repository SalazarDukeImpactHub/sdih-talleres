# Verify Report — catalog-and-access

**Change ID:** catalog-and-access
**Status:** PASS
**Fecha:** 2026-06-12
**Spec:** ./spec.md · **Design:** ./design.md · **Tasks:** ./tasks.md
**PRs:** #1 (slice 2a) y #2 (slice 2b) — ambos mergeados a master

## Resumen ejecutivo

Change 2 completamente implementado en dos slices encadenados: 2a (migraciones + catálogo read-only) y 2b (modal + canje de claves). 12/12 RF PASS, 8/8 RNF PASS, 15/15 escenarios Gherkin cubiertos por e2e. Gates: build, lint, Vitest (27 pass / 2 skip) y **e2e 52/52 PASSED (5.4m, chromium + Mobile Chrome)** — verificado independientemente por el orchestrator. 0 CRITICAL, 0 WARNING, 1 SUGGESTION.

## Auditoría RF (12/12 PASS)

| RF | Qué | Evidencia |
|---|---|---|
| RF-1 [2a] | Tabla workshops + RLS | `supabase/migrations/20260612000001_create_workshops_table.sql` |
| RF-2 [2a] | Tabla workshop_access + RLS + UNIQUE + CHECK | `supabase/migrations/20260612000002_create_workshop_access_table.sql` |
| RF-3 [2a] | Página /catalogo con grid responsive + Suspense | `src/app/(authenticated)/catalogo/page.tsx` |
| RF-4 [2a] | WorkshopCard (cover fallback, candado, botones) | `src/components/catalog/WorkshopCard.tsx` |
| RF-5 [2a] | StatusBadge 4 estados | `src/components/catalog/StatusBadge.tsx` |
| RF-6 [2a] | fetchWorkshops con LEFT JOIN sin N+1 | `catalogo/actions.ts:1-98` |
| RF-7 [2a] | Helper resetWorkshopsAndAccess idempotente | `tests/playwright/_helpers/supabase-admin.ts:117-221` |
| RF-8 [2b] | AccessKeyModal con máquina de estados | `src/components/catalog/AccessKeyModal.tsx` |
| RF-9 [2b] | redeemKey (Zod + case-insensitive + expiry + double-redeem) | `catalogo/actions.ts:107-205` |
| RF-10 [2b] | accessKeySchema con normalización uppercase | `src/lib/schemas/workshop.ts` |
| RF-11 [2b] | Wiring Ingresar → modal → router.refresh | `WorkshopCard.tsx:116-123` |
| RF-12 [2b] | Success feedback + auto-close + card actualizada | `AccessKeyModal.tsx:154-161` |

## Auditoría RNF (8/8 PASS)

- **Seguridad**: RLS en ambas tablas con test e2e de aislamiento [2a-9]; Zod server-side; errores genéricos sin filtrar claves; UNIQUE + redeemed_at contra double-redeem
- **Performance**: una sola query LEFT JOIN, índices en user_id y (user_id, workshop_id, redeemed_at), Suspense skeleton
- **Responsive**: 1/2/3/4 cols en 360/768/1024/1440, validado por e2e en los 3 breakpoints
- **A11y**: aria-modal, aria-labelledby, Escape cierra, auto-focus, labels, contraste AA
- **i18n**: voseo rioplatense en toda la UI, fechas es-AR
- **Tipografía/colores**: tokens del brief §8, sin hex hardcodeado
- **Animaciones**: sdLive en badge "en vivo", validada por computed style en e2e
- **Restricciones**: "Continuar" disabled con tooltip (ruta /taller llega en change 3)

## Gherkin: 15/15 COVERED

Todos los escenarios mapeados a specs e2e concretos (catalog.spec.ts [2a-1..9] y [2b-1..10]).

## Decisiones D-1 a D-12: todas respetadas

Incluye: modal viviendo en WorkshopCard (client-side, datos serializables — lección del boundary bug), claves planas v1, expiry 30d, canje permanente, fixtures idempotentes.

## Scope audit

- Creep: ninguno · Gap: ninguno

## Findings

- **CRITICAL: 0** · **WARNING: 0**
- **SUGGESTION (1)**: agregar `aria-describedby` en el input del modal linkeando al hint/error (5 min, diferir a polish de v1.1)

## Bugs corregidos durante el ciclo (lecciones)

1. Server Component pasaba función (`onEnterClick`) a Client Component — crasheaba el catálogo entero. Patrón corregido: el modal vive dentro del Client Component con props serializables.
2. Specs e2e sin login — nuevo helper `loginAsSeedUser()` en `_helpers/auth.ts`.
3. Aislamiento entre specs: `resetSeedUser()` obligatorio en beforeEach de cualquier spec que loguee (auth-forced cambia la password a mitad de test).
4. Assertion obsoleta del placeholder del change 1 actualizada.
5. Test de animación reescrito con getComputedStyle.

## Veredicto

**PASS — listo para archive.** Engram observation #622.
