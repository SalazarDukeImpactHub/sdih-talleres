# Tasks — catalog-and-access

**Change ID:** catalog-and-access  
**Status:** Ready for apply  
**Fecha:** 2026-06-12  
**Proposal:** ./proposal.md  
**Spec:** ./spec.md  
**Design:** ./design.md

---

## Review Workload Forecast

- **Slice 2a estimated changed lines (code only):** ~280 (migrations + components + page/actions)
- **Slice 2a estimated changed lines (with tests + helpers):** ~440
- **Slice 2b estimated changed lines (code only):** ~115 (modal + schema + wiring)
- **Slice 2b estimated changed lines (with tests):** ~345
- **Total functional (2a + 2b):** ~785 lines (exceeds 400-line budget per slice, but justified by split delivery)
- **400-line budget risk:** None per slice when split; chained PRs mitigates review load
- **Decision needed before apply:** No (resolved: chained PRs approved)
- **Delivery method:** Chained PRs
  - PR 2a (~440 lines) → `master` (includes migrations + seed helper)
  - PR 2b (~345 lines) stacked on 2a (includes modal + redemption)
- **Reason logged:** Slice 2a is independently valuable (read-only catalog); 2b adds interactivity. Both slices depend on SQL migrations (pre-apply blocker managed by Jennifer).

---

## Pre-apply blockers (acciones humanas de Jennifer, fuera del scope de sdd-apply)

Tareas para **Jennifer** ANTES de que sdd-apply pueda arrancvar y validar e2e:

- [ ] **B-1**: Correr las 2 migraciones SQL en Supabase SQL Editor.
  - Migración 1: `supabase/migrations/{ts}_create_workshops_table.sql` (creada en T-2a.1.1)
  - Migración 2: `supabase/migrations/{ts}_create_workshop_access_table.sql` (creada en T-2a.1.2)
  - Alternativa: via CLI si está instalada (`supabase migration up`)
  - **Blocker:** Ambas migraciones deben ejecutarse en el mismo contexto (transacción) para evitar FK constraint errors
  - **Paso:** PAUSE antes de que sdd-apply ejecute tests e2e. Después de que sdd-apply cree los archivos .sql, Jennifer corre B-1 manualmente.

- [ ] **B-2**: Seed workshops mediante SQL seed script.
  - Script: `docs/database/seed-workshops.sql` (creado en T-2a.2.1)
  - Contiene: 4 INSERT para talleres (disponible, en vivo, próximamente, completado) con UUIDs generados por DB
  - Alternativa: helper `resetWorkshopsAndAccess()` (T-2a.4.1) crea fixtures dinámicamente en cada test, SIN necesidad de seed manual
  - **Recomendación:** Confiar en helper idempotente; B-2 es opcional si tests pasan con helper

---

## Apply tasks (sdd-apply las consume en orden)

Agrupadas en **Bloques de Slice 2a** y **Bloques de Slice 2b**. Cada bloque puede ser un commit independiente (work-unit-commits skill).

---

## SLICE 2A: Migrations + Catalog (Read-Only)

### Bloque 1: SQL Migrations

- [ ] **T-2a.1.1**: Crear archivo de migración SQL para tabla `workshops`.
  - Ruta: `supabase/migrations/20260612000000_create_workshops_table.sql`
  - Contenido: SQL completo del design D-2 (CREATE TABLE + indices + RLS policies)
  - Incluir comentarios: lista de pasos B-1 para Jennifer
  - No ejecutar aún (Jennifer hace B-1 manualmente)

- [ ] **T-2a.1.2**: Crear archivo de migración SQL para tabla `workshop_access`.
  - Ruta: `supabase/migrations/20260612000001_create_workshop_access_table.sql`
  - Contenido: SQL completo del design D-2 (CREATE TABLE + FK constraints + indices + RLS policies)
  - Documentar en comentarios: "Ejecutar después de create_workshops_table"
  - No ejecutar aún (Jennifer hace B-1 manualmente)

- [ ] **T-2a.1.3**: Crear seed script documentation.
  - Ruta: `docs/database/seed-workshops.sql`
  - Contenido: SQL INSERT para 4 talleres (spec fixture exactas) con placeholder para SEED_USER_ID
  - Nota: Este archivo es referencia; preferencia es usar helper idempotente en tests
  - Incluir instrucciones comentadas para Jennifer

---

### Bloque 2: Schemas Zod

- [ ] **T-2a.2.1**: Crear `src/lib/schemas/workshop.ts`.
  - Contenido: `accessKeySchema` (será usado en 2b, pero definido acá)
    - `key`: string, min 3, max 20, regex `/^[A-Z0-9\-]+$/i`, transform a UPPERCASE
    - `workshopId`: string, UUID validation
  - Exportar tipos inferidos: `AccessKeyInput`
  - **Nota:** Schema se define en 2a aunque se usa en 2b, para que compile sin errores en 2a

---

### Bloque 3: Server Action `fetchWorkshops`

- [ ] **T-2a.3.1**: Crear `src/app/(authenticated)/catalogo/actions.ts`.
  - Contenido: Server Action `fetchWorkshops(userId: string)`
  - Query SQL: LEFT JOIN workshops × workshop_access, filtrado por user_id
  - Return: array de workshops con boolean `is_unlocked`
  - Error handling: catch DB errors, log, return empty array + alert
  - No secrets en logs

---

### Bloque 4: Components — StatusBadge

- [ ] **T-2a.4.1**: Crear `src/components/catalog/StatusBadge.tsx`.
  - Props: `status: 'disponible' | 'en vivo' | 'próximamente' | 'completado'`
  - 4-state badge:
    - **disponible** (cyan #19C6E6): dot static, fondo navy blur
    - **en vivo** (magenta #D946EF): dot animado (keyframe sdLive pulsando), fondo navy blur
    - **próximamente** (yellow #FACC15): dot static, fondo navy blur
    - **completado** (lime #A3E635): dot static, fondo navy blur
  - ARIA: aria-label con estado completo
  - Responsive: padding + text-size ajustados en mobile

---

### Bloque 5: Components — WorkshopCard

- [ ] **T-2a.5.1**: Crear `src/components/catalog/WorkshopCard.tsx`.
  - Props:
    - `workshop`: { id, slug, title, description, instructor, date_live, duration_min, status, cover_image }
    - `isUnlocked: boolean`
    - `onEnterClick?: () => void` (para 2b: abre modal)
  - Estructura:
    - Cover image: si `cover_image` exists, renderizar; sino, fallback gradient (design D-3)
    - Title + description (truncate respectivamente)
    - Instructor + date_live
    - StatusBadge component
    - Lock icon si `!isUnlocked`
    - Botón: "Continuar" (disabled + tooltip "Disponible próximamente") si unlocked
    - Botón: "Ingresar" (clickeable, abre modal en 2b) si locked
  - Responsive: card width 100% mobile, flex wrap desktop
  - Accesibilidad: aria-labels en iconos, semántica correcta

---

### Bloque 6: Page `/catalogo`

- [ ] **T-2a.6.1**: Crear `src/app/(authenticated)/catalogo/page.tsx`.
  - Server Component
  - Fetch user ID from session (via createServerClient)
  - Call `fetchWorkshops(userId)` Server Action
  - Renderizar:
    - Título "Catálogo"
    - Grid layout (design D-4: 1 col 360px, 2 col 768px, 3 col 1024px, 4 col 1440px+)
    - Map workshops → `<WorkshopCard>` con isUnlocked
    - Fallback loading state (esqueleto de cards)
  - Error boundary si fetch falla
  - Responsive layout sin scroll horizontal en 360px

---

### Bloque 7: Styling Animations

- [ ] **T-2a.7.1**: Agregar `@keyframes sdLive` a `src/app/globals.css`.
  - Animación: pulse dot de badge "en vivo" (2s loop, scale 0.8 → 1.0)
  - Patrón:
    ```css
    @keyframes sdLive {
      0%, 100% { transform: scale(0.8); opacity: 1; }
      50% { transform: scale(1); opacity: 0.8; }
    }
    ```

---

### Bloque 8: Test Helpers — `resetWorkshopsAndAccess()`

- [ ] **T-2a.8.1**: Extender `tests/helpers/supabase-admin.ts` con `resetWorkshopsAndAccess()`.
  - Función: async, idempotent (delete all + recreate)
  - Crea admin client (service_role context)
  - Delete: workshop_access + workshops (todas las filas)
  - Insert: 4 seed workshops exactos (spec RF-7)
    - ws-1: `rag-intro`, `RAG Intro`, `disponible`, date_live +7 days
    - ws-2: `embeddings`, `Embeddings Deep Dive`, `en vivo`, date_live now
    - ws-3: `future-tech`, `Future of AI`, `próximamente`, date_live +30 days
    - ws-4: `completed`, `Past Workshop`, `completado`, date_live -7 days
  - Insert: 2 workshop_access rows para seed_user (unlocked a ws-1 + ws-2)
    - key: 'RAG-STARTER' para ws-1
    - key: 'LIVE-2024' para ws-2
    - redeemed_at = now() (ambas)
  - Return: `{ workshops, seedUserId }`

---

### Bloque 9: Unit Tests — Schema Validation

- [ ] **T-2a.9.1**: Crear `tests/unit/schemas/workshop.test.ts`.
  - Tests para `accessKeySchema` (aunque se usa en 2b, validamos acá):
    - [ ] Valid key "FUTURE-2024" → parses OK
    - [ ] Too short "AB" → error "mínimo 3"
    - [ ] Too long "A".repeat(21) → error "máximo 20"
    - [ ] Invalid chars "future@2024!" → error "letras, números, guiones"
    - [ ] Case-insensitive "future-2024" → transforms to "FUTURE-2024"
    - [ ] Trimmed "  FUTURE-2024  " → "FUTURE-2024"
    - [ ] Invalid UUID workshopId → error
  - Uso: describe, test (vitest globals)

---

### Bloque 10: E2E Tests — Catalog View (2a specs)

- [ ] **T-2a.10.1**: Crear `tests/playwright/catalog.spec.ts`.
  - Setup: beforeEach → `resetWorkshopsAndAccess()`
  - **Spec 1: catalog-load**
    - Navigate to `/catalogo`
    - Expect: 4 cards visible (RAG Intro, Embeddings, Future of AI, Past Workshop)
    - Expect: titles, descriptions rendered
  - **Spec 2: catalog-badges-render**
    - Check: badge colors + states correct
    - RAG (cyan), Embeddings (magenta with animation), Future (yellow), Past (lime)
  - **Spec 3: catalog-unlock-state**
    - Check: 2 cards show "Continuar" button (unlocked: RAG, Embeddings)
    - Check: 2 cards show "Ingresar" button (locked: Future, Past)
    - Check: lock icon visible on locked cards
  - **Spec 4: catalog-responsive-360**
    - Set viewport to 360x800
    - Expect: grid 1 column
    - Expect: no horizontal scroll
    - Expect: cards full width, readable text
  - **Spec 5: catalog-responsive-768**
    - Set viewport to 768x1024
    - Expect: grid 2 columns
  - **Spec 6: catalog-responsive-1024**
    - Set viewport to 1024x768
    - Expect: grid 3-4 columns
  - **Spec 7: cover-image-fallback**
    - Verify: cards without cover_image render fallback gradient (no broken image)
  - **Spec 8: sdlive-animation**
    - Verify: Embeddings badge dot has animation (check computed styles, @keyframes sdLive running)
  - **Spec 9: rls-isolation**
    - Create second auth session (User B)
    - Query `workshop_access` as User B
    - Expect: 0 rows returned (User A's access filtered by RLS)

---

### Bloque 11: Build + Lint Validation (2a)

- [ ] **T-2a.11.1**: Validación local 2a.
  - `pnpm install` → sin errores
  - `pnpm lint` → no errores nuevos en src/components/catalog/, src/app/catalogo/
  - `pnpm build` → compila sin warnings
  - `pnpm test` (vitest) → tests unit pasan (T-2a.9.1)
  - `pnpm test:e2e` → 2a specs pasan (T-2a.10.1, specs 1-9)

---

### Bloque 12: Commit + PR 2a

- [ ] **T-2a.12.1**: Commit work-units de 2a.
  - **Commit 1:** feat(catalog-and-access/2a): SQL migrations
    - T-2a.1.1, T-2a.1.2, T-2a.1.3
  - **Commit 2:** feat(catalog-and-access/2a): schemas + server action fetchWorkshops
    - T-2a.2.1, T-2a.3.1
  - **Commit 3:** feat(catalog-and-access/2a): components (StatusBadge, WorkshopCard) + page
    - T-2a.4.1, T-2a.5.1, T-2a.6.1
  - **Commit 4:** feat(catalog-and-access/2a): styling animations + test infra
    - T-2a.7.1, T-2a.8.1, T-2a.9.1, T-2a.10.1

- [ ] **T-2a.12.2**: PR 2a → master.
  - Title: `feat(catalog-and-access/2a): migrations + read-only catalog`
  - Descripción: Slice 2a deliverable (migrations + grid + 4 states)
  - Chained: No (primera parte)
  - Build + lint + test gate: Green
  - **PAUSE aquí:** Jennifer ejecuta B-1 (migraciones SQL en Supabase)
  - Aftermerge: Tabla `workshops` + `workshop_access` live en Supabase

---

## SLICE 2B: Modal + Key Redemption

### Bloque 13: Components — AccessKeyModal

- [ ] **T-2b.13.1**: Crear `src/components/catalog/AccessKeyModal.tsx`.
  - Props:
    - `isOpen: boolean`
    - `workshopTitle: string`
    - `onClose: () => void`
    - `onSuccess?: () => void`
  - States (via useActionState):
    - `idle`: form visible
    - `loading`: button disabled, spinner
    - `error`: red text error message
    - `success`: green checkmark + "¡Acceso concedido!"
  - Form:
    - Input `name="key"` type="text", placeholder, focus visible (cyan glow)
    - Submit button "Enviar"
    - Error message (red)
    - Success message (green checkmark)
  - Interactions:
    - Form submission → Server Action `redeemKey`
    - Escape key → close modal (no loading state)
    - Success → auto-close after 2s or manual close button
  - ARIA: role="dialog", aria-labelledby, aria-describedby, focus trap
  - Responsive: 90% width, max-width 400px, centered on screen

---

### Bloque 14: Server Action `redeemKey`

- [ ] **T-2b.14.1**: Extender `src/app/(authenticated)/catalogo/actions.ts` con `redeemKey`.
  - Server Action: `redeemKey(userId: string, workshopId: string, accessKey: string)`
  - Validation:
    - Zod parse `accessKeySchema` → normalize key to UPPERCASE
    - If invalid → return `{ success: false, error: "Clave inválida o expirada" }`
  - Database query:
    - SELECT workshop_access row for (user_id, workshop_id)
    - If exists AND redeemed_at IS NOT NULL → return `{ success: false, error: "Ya tenés acceso a este taller" }`
    - If exists AND redeemed_at IS NULL:
      - Check key matches (case-insensitive) AND expires_at > now()
      - If match + valid → UPDATE set redeemed_at = now()
      - If no match or expired → return error
    - If not exists → return error "Clave inválida o expirada"
  - UNIQUE constraint handling:
    - If 409 conflict (duplicate user_id, workshop_id) → return "Ya tenés acceso a este taller"
  - Success → return `{ success: true, message: "¡Acceso concedido!" }`
  - Error handling: log errors (no key in logs), return safe messages
  - **Critical:** No secrets in logs, no expose key in errors

---

### Bloque 15: UI Wiring — Modal Trigger

- [ ] **T-2b.15.1**: Actualizar `src/components/catalog/WorkshopCard.tsx`.
  - Add state: `isModalOpen` (useState)
  - Add event handler: onClick "Ingresar" button → `setIsModalOpen(true)`
  - Add props: `onRedeemSuccess?: () => void` (callback from parent)
  - Renderizar `<AccessKeyModal>` conditionally si locked + isModalOpen
  - Pass props: workshopTitle, onClose, onSuccess
  - Post-redemption: trigger refetch via parent callback or useOptimistic
    - Simplest approach: parent (Page) re-fetches `fetchWorkshops` after success
    - Alternative: useOptimistic to update card state immediately

---

### Bloque 16: Card Update After Redemption

- [ ] **T-2b.16.1**: Actualizar `src/app/(authenticated)/catalogo/page.tsx`.
  - Add state management OR Server Action refresh mechanism
  - Approach: After modal success, trigger `revalidatePath('/catalogo')`
    - Use `revalidatePath` in redeemKey Server Action post-success
    - Page automatically re-fetches workshops and re-renders
  - Alternative: useOptimistic in client-side
    - Store optimistic is_unlocked state
    - Update immediately on success
    - Verify on page load that DB persisted (prevents stale state)

---

### Bloque 17: E2E Tests — Modal + Redemption (2b specs)

- [ ] **T-2b.17.1**: Extender `tests/playwright/catalog.spec.ts` con 2b specs.
  - Setup: beforeEach → `resetWorkshopsAndAccess()`
  - **Spec 10: modal-open**
    - Click "Ingresar" on locked workshop (Future of AI)
    - Expect: modal appears with title "Ingresar a Future of AI"
    - Expect: input visible with focus
    - Expect: button "Enviar" visible
  - **Spec 11: modal-close-escape**
    - Modal open → press Escape
    - Expect: modal closes, no DB changes
    - Expect: focus returns to card
  - **Spec 12: redeem-invalid-key**
    - Modal open → enter "INVALID-KEY"
    - Click "Enviar"
    - Expect: button loading state (spinner, disabled)
    - Expect: error message "Clave inválida o expirada"
    - Expect: modal stays open, input focus
  - **Spec 13: redeem-valid-key**
    - Modal open → enter "FUTURE-TECH-2024" (assume seed helper creates valid key)
    - **Blocker:** spec doesn't define which unlocked workshop has a valid key for redemption
      - **Resolution:** In seed, create ws-3 (Future) with access_key 'FUTURE-TECH-2024' + redeemed_at = NULL (not yet redeemed)
      - Re-visit T-2a.8.1 if needed
    - Click "Enviar"
    - Expect: button loading
    - Expect: success message + checkmark
    - Expect: modal auto-closes after 2s
  - **Spec 14: card-updates-after-redeem**
    - After successful redeem of Future of AI
    - Expect: card now shows "Continuar" button (not "Ingresar")
    - Expect: no lock icon
  - **Spec 15: redeem-persistence-refresh**
    - After success, refresh page
    - Expect: `/catalogo` re-fetches workshops
    - Expect: Future of AI still shows "Continuar" (access persisted in DB)
  - **Spec 16: redeem-expired-key**
    - Create workshop_access with expires_at < now()
    - Attempt redeem
    - Expect: error "Clave inválida o expirada"
  - **Spec 17: redeem-case-insensitive**
    - Enter key "future-tech-2024" (lowercase)
    - Expect: normalizes to "FUTURE-TECH-2024"
    - Expect: matches stored key "FUTURE-TECH-2024"
    - Expect: success
  - **Spec 18: already-unlocked-no-modal**
    - Card showing "Continuar" (already unlocked)
    - Button is disabled
    - Click does nothing (or show tooltip "Ya tenés acceso")
  - **Spec 19: double-redeem-blocked**
    - Attempt second redeem for same workshop
    - Expect: UNIQUE constraint error handled
    - Expect: "Ya tenés acceso a este taller"
  - **Spec 20: modal-loading-state**
    - While redeeming, button shows loading (spinner, disabled)
    - Input disabled
    - Escape key does NOT close (only allowed on idle/error/success)
  - **Spec 21: modal-success-feedback**
    - Success state shows green checkmark
    - Text: "¡Acceso concedido!"
    - Button: "Cerrar" or auto-close 2s
  - **Spec 22: rls-prevents-cross-user-redeem**
    - Create User A with access to Workshop 1
    - Create User B session
    - Attempt to redeem key for User A's workshop via User B
    - Expect: either error or UPDATE fails (RLS blocks)

---

### Bloque 18: Unit + E2E Validation (2b)

- [ ] **T-2b.18.1**: Validación local 2b.
  - `pnpm lint` → no errores en src/components/catalog/AccessKeyModal.tsx, src/app/catalogo/actions.ts
  - `pnpm build` → compila sin warnings
  - `pnpm test` (vitest) → unit tests pasan
  - `pnpm test:e2e` → ALL 2b specs pasan (Specs 10-22)
  - **Critical gate:** `pnpm test:e2e` must pass completamente (todos los specs, incluyendo 2a + 2b)

---

### Bloque 19: Commit + PR 2b (Stacked)

- [ ] **T-2b.19.1**: Commit work-units de 2b.
  - **Commit 1:** feat(catalog-and-access/2b): AccessKeyModal component
    - T-2b.13.1
  - **Commit 2:** feat(catalog-and-access/2b): Server Action redeemKey + schema validation
    - T-2b.14.1 (extend actions.ts), T-2a.2.1 está ya en 2a
  - **Commit 3:** feat(catalog-and-access/2b): UI wiring + card update
    - T-2b.15.1, T-2b.16.1
  - **Commit 4:** feat(catalog-and-access/2b): E2E tests (modal + redemption)
    - T-2b.17.1

- [ ] **T-2b.19.2**: PR 2b → branch 2a (stacked).
  - Title: `feat(catalog-and-access/2b): modal + key redemption`
  - Descripción: Slice 2b deliverable (modal form, redeemKey action, success feedback)
  - Chained: Yes, stacks on PR 2a
  - Base branch: 2a's merge commit or PR branch `change/catalog-and-access`
  - Build + lint + test gate: Green (all 22 e2e specs pass)
  - Merge after 2a is merged: GitHub UI handles stacking automatically

---

## Dependencias entre bloques

```
Bloque 1 (SQL migrations) ← B-1 (Jennifer executes after sdd-apply creates files)
  ↓
  ├─→ Bloque 2 (schemas) ← Bloque 3 (fetchWorkshops uses schema)
  │     ↓
  │     ├─→ Bloque 3 (fetchWorkshops action)
  │     │     ↓
  │     │     ├─→ Bloque 6 (page calls fetchWorkshops)
  │     │     │     ↓
  │     │     │     └─→ Bloque 4 (StatusBadge) + Bloque 5 (WorkshopCard renders badge)
  │     │
  │     └─→ Bloque 14 (redeemKey action uses schema)
  │           ↓
  │           └─→ Bloque 13 (modal calls redeemKey)
  │                 ↓
  │                 └─→ Bloque 15 (WorkshopCard triggers modal)
  │
  ├─→ Bloque 7 (styling: sdLive animation)
  │     ↓
  │     └─→ Bloque 4 (StatusBadge uses animation)
  │
  └─→ Bloque 8 (test helper resetWorkshopsAndAccess)
        ↓
        ├─→ Bloque 10 (e2e tests use helper)
        └─→ Bloque 17 (e2e tests use helper)

Bloque 9 (unit tests schemas) ← Independiente (aunque schema está en Bloque 2)

Bloques 11-12 (2a validation + commit) ← Bloque 10 (todos los specs pasan)

Bloque 16 (page update logic) ← Bloque 6 (page exists), Bloque 14 (action exists)

Bloque 17 (2b e2e tests) ← Bloque 13, 14, 15, 16 (todos los componentes + actions)

Bloque 18 (2b validation) ← Bloque 17 (tests definidas)

Bloque 19 (PR 2b) ← Bloque 18 (validation green)

SECUENCIA OBLIGATORIA:
  1 → (2 || 3) → (4 || 5 || 7) → 6 → 8 → 9 → 10 → 11 → 12
  (simultáneamente en paralelo)
  13 → 14 → (15 || 16) → 17 → 18 → 19
  
BLOQUE 8 (helper) puede ejecutarse en paralelo a 2-7, pero es necesario para tests (10, 17)
```

**Resumen de paralelismo:**
- **Secuencial obligatorio 2a:** 1 → (2 || 3) → (4 || 5 || 7) → 6 → 8 → (9 || 10) → 11 → 12
- **Secuencial obligatorio 2b:** 13 → 14 → (15 || 16) → 17 → 18 → 19
- **Paralelo recomendado 2a internamente:** Bloques 4, 5, 7 pueden ejecutarse en paralelo después de Bloque 3
- **Paralelo 2a vs 2b:** Bloque 12 (PR 2a) debe mergearse ANTES de que Bloque 13 (PR 2b) sea viable (dependencia de código merged)
  - Alternativa: 2b puede desarrollarse en paralelo en rama separada, pero PR 2b debe apuntar a rama 2a

---

## Estrategia de commits (work-unit-commits skill)

**Patrón recomendado:** 1-2 commits por bloque lógico cuando todas las tasks están verdes localmente.

### Slice 2a — 4 commits

```
feat(catalog-and-access/2a): SQL migrations

Changes:
- T-2a.1.1 to T-2a.1.3: create migrations + seed script
- Includes: workshops table, workshop_access table, RLS policies

Closes change 2 slice 2a task block 1/12.
```

```
feat(catalog-and-access/2a): schemas + Server Action fetchWorkshops

Changes:
- T-2a.2.1: create accessKeySchema (Zod)
- T-2a.3.1: create fetchWorkshops Server Action

Closes change 2 slice 2a task block 2/12.
```

```
feat(catalog-and-access/2a): components + page /catalogo

Changes:
- T-2a.4.1: create StatusBadge component (4 states + animation)
- T-2a.5.1: create WorkshopCard component
- T-2a.6.1: create /catalogo page with responsive grid
- T-2a.7.1: add @keyframes sdLive to globals.css

Closes change 2 slice 2a task block 3/12.
```

```
feat(catalog-and-access/2a): test infrastructure + e2e specs

Changes:
- T-2a.8.1: extend supabase-admin.ts with resetWorkshopsAndAccess() helper
- T-2a.9.1: create unit tests for accessKeySchema validation
- T-2a.10.1: create e2e specs 1-9 (catalog view, badges, responsive, RLS)

Closes change 2 slice 2a task block 4/12.
```

### Slice 2b — 4 commits

```
feat(catalog-and-access/2b): AccessKeyModal component

Changes:
- T-2b.13.1: create AccessKeyModal with state machine (idle/loading/error/success)

Closes change 2 slice 2b task block 1/8.
```

```
feat(catalog-and-access/2b): Server Action redeemKey + validation

Changes:
- T-2b.14.1: create redeemKey Server Action in actions.ts

Closes change 2 slice 2b task block 2/8.
```

```
feat(catalog-and-access/2b): UI wiring + card update logic

Changes:
- T-2b.15.1: update WorkshopCard to trigger modal + handle success
- T-2b.16.1: update /catalogo page to refresh on redemption

Closes change 2 slice 2b task block 3/8.
```

```
feat(catalog-and-access/2b): e2e tests (modal + redemption)

Changes:
- T-2b.17.1: extend catalog.spec.ts with specs 10-22 (modal, invalid key, valid key, persistence, RLS)

Closes change 2 slice 2b task block 4/8.
```

---

## Riesgos cacheados del design (sdd-apply debe respetar estos)

1. **RLS Misconfiguration (Risk 1 del design) — Medium impacto, mitigable**
   - Problema: Workshop_access SELECT/UPDATE policies pueden ser insuficientemente restrictivas
   - Mitigation en apply: Implementar explícitamente `USING (auth.uid() = user_id)` en ambas policies
   - Verificación: Spec 9 (2a) + Spec 22 (2b) incluyen test RLS cross-user, esperando 0 filas o error
   - Owner: Apply phase

2. **Double-Redeem Race (Risk 2 del design) — Low impacto, mitigable**
   - Problema: Dos requests simultáneos para (user, workshop) → UNIQUE constraint 409 conflict
   - Mitigation: Server Action `redeemKey` debe catch 409 → return "Ya tenés acceso"
   - Verificación: Spec 19 (2b) test double-redeem handling
   - Owner: Apply phase (implementador maneja exception en redeemKey)

3. **Expiry Clock Skew (Risk 3) — Low impacto, mitigable**
   - Problema: Server local vs Supabase clock desincronizados → `expires_at > now()` falla
   - Mitigation: SQL checks usan Supabase server time; Server Action acepta ±5 min skew
   - Verificación: Spec 16 (2b) test expired key
   - Owner: Apply phase, no blocker para design

4. **Missing Design Assets (Risk 4) — Low impacto, mitigable**
   - Problema: Figma/prototipo carece detalles exactos (padding, animation timing)
   - Mitigation: Extraer del prototipo HTML o usar Tailwind defaults
   - Design D-3 (cover fallback) + D-4 (breakpoints) cierran esto
   - Owner: Design phase (cerrado ✅)

5. **Test Fixture Isolation (Risk 5) — Low impacto, mitigable**
   - Problema: `resetWorkshopsAndAccess()` no idempotente → test interference
   - Mitigation: Helper idempotent (DELETE + RECREATE every test)
   - Verificación: T-2a.8.1 especifica delete all + insert fresh fixtures
   - Owner: Apply phase (implementador verifica idempotency)

6. **Modal Loading State Hang (Risk 6) — Low impacto, mitigable**
   - Problema: Network error → modal en loading indefinidamente
   - Mitigation: Timeout 10s, error message "Reintentá", retry button en error state
   - Verificación: T-2b.13.1 debe incluir timeout handling
   - Owner: Apply phase

---

## Open issues

**Ninguno.** Todas las decisiones están cerradas por orchestrator + design.

**Notas de diseño resueltas:**
- ¿Cover image fallback? → CSS gradient (D-3, implementado en T-2a.5.1)
- ¿Breakpoints responsive? → 1/2/3/4 cols a 360/768/1024/1440px (D-4, implementado en T-2a.6.1)
- ¿Button "Continuar" disabled? → Sí, hasta change 3 (D-5, especificado en T-2a.5.1)
- ¿Filter dropdown? → Deferred a 2b o change 3 (D-6, not blocking)
- ¿Toast vs modal feedback? → Modal solamente (D-7, implementado en T-2b.13.1)

---

## Resumen ejecutivo de tareas

### Slice 2a: Migrations + Catalog (Read-Only)

**Total de bloques:** 12  
**Total de tasks:** ~30  
**Líneas estimadas de código:**
- Migraciones: 90
- Componentes: 90
- Page + actions: 70
- Tests + helpers: 180 (incluye specs 1-9)
- **Subtotal 2a:** ~440 líneas

**Duración estimada:** 6-8 horas (por implementador experimentado)
- Bloques 1-3 (setup): 1.5 horas
- Bloques 4-7 (components + page): 2.5 horas
- Bloques 8-11 (tests + validation): 2 horas
- Bloque 12 (PR + merge): 1 hora

### Slice 2b: Modal + Key Redemption

**Total de bloques:** 8  
**Total de tasks:** ~15  
**Líneas estimadas de código:**
- Modal: 80
- Server Action + schema: 60 (schema ya en 2a)
- Wiring: 35
- Tests: 170 (specs 10-22)
- **Subtotal 2b:** ~345 líneas

**Duración estimada:** 5-6 horas (por implementador experimentado)
- Bloques 13-14 (modal + action): 1.5 horas
- Bloques 15-16 (wiring + update): 1 hora
- Bloque 17 (e2e tests): 2 horas
- Bloque 18-19 (validation + PR): 1.5 horas

### Total Change 2

**Tareas totales:** ~45  
**Líneas funcionales:** ~785 (440 + 345)  
**Duración total:** 11-14 horas  

**Ruta crítica:**
1. Bloques 1 → 2 → 3 → (4 || 5 || 7) → 6 → 8 → (9 || 10) → 11 → 12
2. Bloques 13 → 14 → (15 || 16) → 17 → 18 → 19

**Paralelización:**
- Bloques 4, 5, 7 pueden ejecutarse en paralelo (después de 3)
- Bloques 9, 10 pueden ejecutarse en paralelo (después de 8)
- Bloques 15, 16 pueden ejecutarse en paralelo (después de 14)

---

## Pre-apply — Condiciones para empezar sdd-apply

1. ✅ Spec completa + design completo (entregados)
2. ✅ Change 1 (auth-and-shell) mergeado a master
3. ⏳ Jennifer completa B-1 ANTES de que tests e2e se ejecuten:
   - Crea y configura proyecto Supabase (si es necesario)
   - Corre migraciones SQL en dashboard o via CLI (archivos creados en T-2a.1.1, T-2a.1.2)
4. ⏳ Jennifer opcionalmente completa B-2:
   - Seed workshops vía SQL (doc en T-2a.1.3)
   - Alternativa: Helper `resetWorkshopsAndAccess()` (T-2a.8.1) es suficiente para tests

**Blocking strategy:**
- T-2a.1.1, T-2a.1.2 cran los archivos .sql
- PAUSE aquí: sdd-apply avisa a Jennifer → B-1 (ejecutar SQL)
- Después de B-1 completado: sdd-apply continúa con tests e2e (T-2a.10.1)
- T-2a.10.1 usa helper (T-2a.8.1) que crea fixtures dinámicamente → B-2 no es requerida

---

## Próximos pasos

1. **sdd-apply inicia:** Bloques 1-12 (slice 2a) en orden respetando dependencias
2. **B-1 blocker:** Después de T-2a.1.2, pausa para Jennifer correr migraciones SQL
3. **Continúa apply:** Bloques 3-12 (spec, actions, components, tests)
4. **Slice 2a validación:** T-2a.11.1 pasa (build + lint + test + e2e)
5. **Slice 2a commit:** T-2a.12.1, T-2a.12.2 (PR 2a → master)
6. **Merge 2a:** PR review + merge a master
7. **sdd-apply inicia 2b:** Bloques 13-19 (slice 2b) en orden respetando dependencias
8. **Slice 2b validación:** T-2b.18.1 pasa (build + lint + test + e2e 1-22)
9. **Slice 2b commit:** T-2b.19.1, T-2b.19.2 (PR 2b → stacked on 2a)
10. **Merge 2b:** PR review + merge (auto-handled by GitHub stacking)
11. **Merge final:** Ambas PRs en master, change 2 cierra
12. **Next change:** Change 3 (sections + content) puede iniciarse

---

## Verificación Final Expected Outputs

- **Spec 2a:** Todos los 9 specs (1-9) pasan: `pnpm test:e2e` grep "catalog-"
- **Spec 2b:** Todos los 13 specs (10-22) pasan: `pnpm test:e2e` grep "modal-|redeem-|already-|double-"
- **Build:** `pnpm build` compila sin warnings
- **Lint:** `pnpm lint` sin errores
- **DB:** `workshops` + `workshop_access` tables live en Supabase
- **RLS:** Confirmed isolated (Spec 9 + Spec 22)

---

## Mapping Spec RFs → Tasks

| RF | Descripción | Slice | Bloques |
|----|-------------|-------|---------|
| RF-1 | Tabla workshops | 2a | Bloque 1 (T-2a.1.1) |
| RF-2 | Tabla workshop_access | 2a | Bloque 1 (T-2a.1.2) |
| RF-3 | Grid catalogo | 2a | Bloque 6 (T-2a.6.1) |
| RF-4 | WorkshopCard | 2a | Bloque 5 (T-2a.5.1) |
| RF-5 | StatusBadge | 2a | Bloque 4 (T-2a.4.1) |
| RF-6 | fetchWorkshops | 2a | Bloque 3 (T-2a.3.1) |
| RF-7 | resetWorkshopsAndAccess | 2a | Bloque 8 (T-2a.8.1) |
| RF-8 | AccessKeyModal | 2b | Bloque 13 (T-2b.13.1) |
| RF-9 | redeemKey | 2b | Bloque 14 (T-2b.14.1) |
| RF-10 | accessKeySchema | 2a/2b | Bloque 2 (T-2a.2.1) |
| RF-11 | UI wiring | 2b | Bloque 15 (T-2b.15.1) |
| RF-12 | Success feedback | 2b | Bloque 16 (T-2b.16.1) |

---

## Conclusión

**Change 2 (catalog-and-access)** desglosa en 45 tasks organizadas en 20 bloques (12 para 2a, 8 para 2b). Ambas slices son independientes verticalmente; 2a es un catálogo read-only funcional, 2b añade interactividad de canje. Los bloques respetan dependencias secuenciales obligatorias dentro de cada slice y parallelismo donde es posible. Pre-apply blocker (B-1: migraciones SQL) es responsabilidad de Jennifer y se pausa después de T-2a.1.2. Todos los tests e2e (22 specs) están especificados y linkados a RFs del spec. Listos para apply.
