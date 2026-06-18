# Archive Report — admin-panel (change 5 de 8)

**Cerrado**: 2026-06-17
**Entregado en**: 4 PRs encadenados (#8, #9, #10, #11)
**Branch flow**: `master` → `change/admin-panel` → `change/admin-panel-5b` → `change/admin-panel-5c` → `change/admin-panel-5d` → `master`

## Commits mergeados a master

| Slice | Commit | PR | Resumen |
|-------|--------|----|---------|
| 5a | `4ed698e` | [#8](https://github.com/SalazarDukeImpactHub/sdih-talleres/pull/8) | Shell admin + lista de talleres con guard layout/page |
| 5b | `2f2d273` | [#9](https://github.com/SalazarDukeImpactHub/sdih-talleres/pull/9) | Workshop CRUD + cover upload a Storage bucket + ADR D-15 |
| 5c | `f6b56e3`, `06f288d`, `d4eb9d2` | [#10](https://github.com/SalazarDukeImpactHub/sdih-talleres/pull/10) | Lista alumnos + crear alumno + generar clave plaintext |
| 5d | `990d550` | [#11](https://github.com/SalazarDukeImpactHub/sdih-talleres/pull/11) | Hash SHA-256+salt + `redeemKey()` refactor con fallback legacy |

## Decisiones arquitectónicas claves

- **D-1 a D-14** documentadas en `design.md` (route group, guards, service_role, hash strategy, slicing, etc.)
- **D-15** (introducida durante 5b): workshops solo metadata. Sections/exercises/glossary viven en sus tablas relacionales (changes 3 y 4). La columna `content_json` que asumía el design original nunca existió y agregarla duplicaría datos normalizados → rechazado.
- **Hash con fallback** (introducida en 5d): `redeemKey()` prueba primero `verifyAccessKey(key, hash, salt)`. Si no hay hash o no matchea, fallback a `access_key` plaintext case-insensitive (defense in depth + backward-compat con claves preexistentes).

## Bug fixes de raíz durante apply (no parches)

**Slice 5b**:
- Route group `(admin)` con paréntesis NO crea segmento `/admin` en URL → folder literal `src/app/admin/`.
- `useActionState` con wrapper async sobre `formAction` rompe el redirect post-submit → `<form action={formAction}>` directo, conversión datetime server-side.
- `<Image>` con `data:` URL falla por config default → `<img>` plain para previews cliente.
- Edit page no mapeaba `duration_min` → `duration` → input number vacío bloqueaba submit por HTML5 `required`.
- `confirm()` browser + `router.refresh()` disparaban HMR mid-redirect → modal inline custom + sin refresh.

**Slice 5c**:
- Sub-agent inventó selectores `data-testid="input-email"` y `btn-submit` para el form de login real (que usa `input[name="email"]` y `button[type="submit"]`) → patrón histórico restaurado en los 3 specs.

**Slice 5d**: ningún bug mayor; el path principal hash funcionó al primer build.

## Trade-offs vivos

- **`access_key` plaintext sigue `NOT NULL`** y coexiste con `access_key_hash` + `access_key_salt`. Post-v1 se planifica `DROP COLUMN access_key` cuando todas las claves vivas hayan sido emitidas con hash.
- **Normalización de input en redeem**: `key.toUpperCase()` antes de comparar (hash o plaintext). El admin emite claves en uppercase. Esto preserva el [2b-6] (lowercase funciona) sin tener que rehashear variantes.

## Lecciones reusables (para changes 6, 7, 8)

1. **NO toques `middleware.ts` si no es del scope del change**. Los guards van en layout/page/Server Action.
2. **NO uses route groups con paréntesis para crear prefijo URL**. Usá folder literal cuando querés `/admin/*`.
3. **Guards server-side en Next 16 usan `redirect()`, NO `throw`** — layout y page rendean en paralelo y el throw colisiona con el redirect.
4. **En specs e2e usá el singleton `supabaseAdmin`** del helper. NO instancies `createClient()` propio (Node 20 sin native WebSocket falla con `RealtimeClient`).
5. **`useActionState` requiere `<form action={formAction}>` directo**, no wrappers async.
6. **Reporter Playwright**: `[["list"], ["html", { open: "never" }]]` da visibilidad en vivo.

## Stats

- ~2,500 LOC nuevas en producción + tests
- 12 specs e2e admin nuevos (4 del 5a, 5 del 5b, 3 del 5c) — 0 nuevos del 5d (reusó los catalog [2b-*])
- 35/35 verde en chromium aislado (admin + catalog 2a+2b + auth) en 4.5 min con código del 5d en master
- 0 regresiones detectadas en specs preexistentes (auth, catalog, workshop, exercises)

## Pendientes deferred (no bloqueantes para v1)

- **Notification email** cuando se genera clave de acceso → scope del change 6.
- **DROP COLUMN access_key** → post-v1 cuando todas las claves vivas tengan hash.
- **Editor visual de sections/exercises** desde admin → v1.1 (por ahora Jennifer carga vía Supabase dashboard).
- **Edit/eliminar alumno desde admin** → v1.1.
- **Bulk import de alumnos** → v1.1.

## Próximo

**Change 6**: transactional emails (Resend) para notificar a alumnos su clave generada por admin.
