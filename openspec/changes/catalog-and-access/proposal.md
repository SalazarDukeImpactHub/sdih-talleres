# Proposal: catalog-and-access (Change 2 of 8)

**Change ID:** `catalog-and-access`  
**Position:** 2 of 8 (SDIH Talleres v1)  
**Status:** Draft  
**Date:** 2026-06-12

---

## Intent

Implementar el primer flujo post-login del alumno: catálogo visual de talleres con desbloqueo por clave de acceso. Los alumnos ven todos los talleres (algunos con candado), pueden abrir un modal para ingresar una clave, y al validarla ganan acceso permanente al contenido de ese taller.

**Success Criteria:** Alumno sin acceso ve un catálogo de cards con estado y candado → ingresa clave válida → estado cambia a desbloqueado → actualización persiste → alumno puede acceder al taller en cambios futuros (ver contenido).

---

## Scope: In and Out

### In Scope — Change 2

**Data Model:**
- `workshops` table (slug, title, description, instructor, date_live, duration, prerequisites, status ∈ {disponible, en vivo, próximamente, completado}, cover_image, created_at, updated_at)
- `workshop_access` table (user_id, workshop_id, access_key, redeemed_at, expires_at, created_at, updated_at; UNIQUE(user_id, workshop_id))
- RLS policies for both tables (SELECT all workshops for authenticated; SELECT/UPDATE only own workshop_access; INSERT via service_role)

**UI / Components:**
- Replace `/catalogo` placeholder with responsive grid of workshop cards
- `WorkshopCard` — shows title, description, instructor, date_live, status badge, "Ingresar" or "Continuar" button
- `StatusBadge` — 4-state component (disponible/cyan, en vivo/magenta with animation, próximamente/yellow, completado/lime)
- `AccessKeyModal` — form to enter key, states (idle/loading/error/success), validation
- Locked workshops show a lock icon; unlocked show "Continuar" button (no navigation yet)

**Server-Side:**
- Server Action `fetchWorkshops(userId)` — returns all workshops + user's workshop_access (to show which are unlocked)
- Server Action `redeemKey(userId, workshopId, accessKey)` — validates key (case-insensitive, checks expiry), creates/updates WorkshopAccess, returns success or error
- Zod schema for access key validation

**Testing:**
- e2e specs: catalog view, filter by status, open modal, redeem invalid/valid keys, persistence after refresh, double-redeem handling
- Unit tests for key validation schema
- Test helpers extended: `resetWorkshopsAndAccess()` for seed workshops + access state

**Constraints & Decisions:**
- Access key: plain text (Approach C), case-insensitive, alphanumeric + hyphens. Format is free (no pattern enforced yet).
- Expiry: default 30 days from created_at. Once `redeemed_at IS NOT NULL`, access is permanent (expires_at only blocks NEW redemptions).
- UNIQUE(user_id, workshop_id) prevents duplicate access rows. If user tries to redeem again, return "Ya tenés acceso a este taller".
- RLS: Workshop SELECT for all authenticated (visibility); WorkshopAccess SELECT/UPDATE only own rows (redemption), INSERT via service_role (admin creates keys manually in change 5).

### Out of Scope — Deferred to Future Changes

- **Taller content / sections / exercises** → Change 3 (access gates at Section level)
- **Key generation from admin panel** → Change 5 (manual SQL insert for now; Jennifer curates claves)
- **Automatic key rotation / expiry cleanup** → Change 5+ (deferred to cron/job)
- **Email notifications on access granted** → Change 6
- **WhatsApp message on access granted** → Change 7
- **VPN / access control** → Change 8
- **Bulk key creation / import** → Change 5

---

## Technical Approach

### Approach Selected: C (Plain-Text Key + Expiry)

**Rationale for v1 pragmatism:**
1. Jennifer creates keys manually via SQL (change 5 will automate)
2. Hash + salt overhead not justified yet; text plain is testable and auditable in early stages
3. Expiry (30d default) provides temporal security without cron complexity in v1
4. Refactor to bcrypt in change 5 when admin panel automates key generation
5. Aligns with existing password-seed pattern (Talleres2026!) and testing strategy

**Implementation:**
- `access_key TEXT NOT NULL` in WorkshopAccess
- `expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days')`
- Server Action: `accessKey.trim().toUpperCase() === storedKey.toUpperCase() AND expires_at > now()`
- No hashing in this change; security via RLS + brief expiry window

---

## Data Model

### workshops Table

```sql
CREATE TABLE public.workshops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  instructor TEXT NOT NULL,
  date_live TIMESTAMPTZ,
  duration_min INTEGER,
  prerequisites TEXT,
  status TEXT NOT NULL CHECK (status IN ('disponible', 'en vivo', 'próximamente', 'completado')),
  cover_image TEXT,
  whatsapp_message_template TEXT,
  price_display TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: All authenticated users can SELECT (catalog is visible to all)
-- Only admin (service_role) can INSERT/UPDATE/DELETE
ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workshops_select_for_authenticated" ON public.workshops
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "workshops_admin_full" ON public.workshops
  FOR ALL USING (auth.role() = 'service_role');

-- Grant to authenticated role
GRANT SELECT ON public.workshops TO authenticated;
GRANT ALL ON public.workshops TO service_role;
```

### workshop_access Table

```sql
CREATE TABLE public.workshop_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  workshop_id UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  access_key TEXT NOT NULL,
  redeemed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- One access per user per workshop
  UNIQUE(user_id, workshop_id),
  
  -- Check: expiry is in the future at creation
  CHECK (expires_at > created_at)
);

-- RLS: Each user sees only their own access rows
-- Redemption (updating redeemed_at) is user-initiated
ALTER TABLE public.workshop_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workshop_access_select_own" ON public.workshop_access
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "workshop_access_update_own_redeem" ON public.workshop_access
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "workshop_access_admin_full" ON public.workshop_access
  FOR ALL USING (auth.role() = 'service_role');

-- Grant to authenticated and service_role
GRANT SELECT, UPDATE ON public.workshop_access TO authenticated;
GRANT ALL ON public.workshop_access TO service_role;
```

---

## Slice Architecture: 2a and 2b

Change 2 is split into two delivery-ready slices to respect the 400-line budget. Each slice is independently testable and mergeable.

### Slice 2a: Migrations + Catalog (Read-Only)

**Scope:**
- Create `workshops` table with RLS policies, indexes, grants
- Create `workshop_access` table (structure only, no redemption logic yet)
- Replace `/catalogo/page.tsx` placeholder with grid layout
- `WorkshopCard` component (title, description, status badge, "Ingresar" button disabled or placeholder)
- `StatusBadge` component (4-state, animations)
- Server Action `fetchWorkshops(userId)` — fetch all workshops + user's unlocked access
- Seed workshop data for testing (4 items: disponible, en vivo, próximamente, completado)
- e2e specs: catalog view, filter by status, card display, correct state badges
- Test helpers: `resetWorkshopsAndAccess()`

**Estimated lines:** ~350 (migraciones ~90 + componentes ~170 + page/actions ~70 + tests ~120)

**Deliverable:** User opens `/catalogo` and sees grid of all workshops with correct status badges. Locked workshops show "Ingresar" (button inactive for now). No modal yet. No access changes possible in 2a.

**Verify gate:** Build + vitest + pnpm test:e2e (Playwright with e2e-gate)

**Branch:** `change/catalog-and-access-2a` (PR targets master)

### Slice 2b: Modal + Key Redemption

**Scope:**
- `AccessKeyModal` component (form, idle/loading/error/success states)
- Server Action `redeemKey(userId, workshopId, accessKey)` — validate key, create/update WorkshopAccess, set `redeemed_at`
- Zod schema: `accessKeySchema` (alphanumeric + hyphens, 3-20 chars, trim + uppercase)
- Enable "Ingresar" button; on click, open modal
- After success: close modal, refresh card state (or trigger refetch), show success toast
- Handle double-redeem: UNIQUE constraint → 409 conflict → "Ya tenés acceso a este taller"
- e2e specs: open modal, redeem invalid key (error), redeem valid key (success), modal closes, card updates, persistence after refresh
- Test helper extension: seed workshop_access with unlocked workshops

**Estimated lines:** ~350 (modal ~80 + action + schema ~50 + tests ~120 + UI wiring ~100)

**Deliverable:** User opens `/catalogo` → clicks "Ingresar" on locked workshop → modal appears → enters valid key → success state → modal closes → card now shows "Continuar" → refresh persists. Invalid key shows error, modal stays open.

**Verify gate:** Build + vitest + pnpm test:e2e (Playwright with e2e-gate)

**Branch:** `change/catalog-and-access-2b` (PR targets 2a; stacked)

**Dependencies:** 2b depends on 2a being merged first. Both must have migrations in place and test fixtures.

---

## Routes and Components Affected

### Pages
- `src/app/(authenticated)/catalogo/page.tsx` — replace placeholder (40 lines)

### Server Actions
- `src/app/(authenticated)/catalogo/actions.ts` — new file with fetchWorkshops, redeemKey (60 lines total)

### Components (in `src/components/catalog/`)
- `WorkshopCard.tsx` — card layout with image, title, description, badge, button (60 lines)
- `StatusBadge.tsx` — 4-state badge with optional animation (30 lines)
- `AccessKeyModal.tsx` — modal form, states, error/success messages (80 lines)

### Schemas
- `src/lib/schemas/workshop.ts` — Zod schemas for access key validation (20 lines)

### Tests
- `tests/playwright/catalog.spec.ts` — e2e specs for catalog, modal, redemption (120 lines)
- `tests/unit/schemas/workshop.test.ts` — unit tests for key validation (30 lines)
- `tests/helpers/supabase-admin.ts` — extend with `resetWorkshopsAndAccess()` (40 lines)

### Styling
- `src/app/globals.css` — add @keyframes sdLive (animate dot for "en vivo") and sdPulse if needed (15 lines)

---

## Acceptance Criteria by Slice

### Slice 2a Acceptance (Catalog Read-Only)

1. [x] `workshops` table exists with all columns from spec; RLS policies allow SELECT for authenticated
2. [x] `workshop_access` table exists with structure; RLS allows SELECT for own rows only
3. [x] `/catalogo/page.tsx` renders a responsive grid of workshop cards
4. [x] Each card displays: title, description, instructor, date_live, cover_image (or fallback)
5. [x] Status badge shows correct state (disponible/cyan, en vivo/magenta, próximamente/yellow, completado/lime)
6. [x] Locked workshops (no access yet) show a lock icon or visual indicator
7. [x] "Ingresar" button visible but inactive (placeholder; will enable in 2b)
8. [x] Server Action `fetchWorkshops` returns all workshops + user's WorkshopAccess rows
9. [x] e2e: Navigate to `/catalogo`, see 4 workshop cards, correct badges, correct lock states
10. [x] e2e: Filter by status (if implemented in 2a; otherwise defer to 2b)
11. [x] Test helper `resetWorkshopsAndAccess()` seeds 4 workshops and correct unlock states per spec

**Hard Constraint (from brief §11):** "Ningún alumno puede ver contenido de un taller que no desbloqueó" — in 2a, only workshop catalog is visible; content sections/exercises are gated in change 3.

### Slice 2b Acceptance (Modal + Redemption)

1. [x] `AccessKeyModal` component renders when user clicks "Ingresar" on locked workshop
2. [x] Modal shows: title ("Ingresar a [Workshop Title]"), hint text, input field, submit button
3. [x] Invalid key → error message "Clave inválida o expirada" → modal stays open
4. [x] Valid key → success message "¡Acceso concedido!" + close button or auto-close
5. [x] After success, card refreshes to show "Continuar" instead of "Ingresar" (or disables lock)
6. [x] After refresh, locked workshop remains unlocked (persistence check)
7. [x] Double-redeem (same user, same workshop, different key) → conflict error → "Ya tenés acceso a este taller"
8. [x] Server Action `redeemKey` validates key (case-insensitive, trim), checks expiry, creates WorkshopAccess, sets `redeemed_at`
9. [x] Zod schema validates access_key format (alphanumeric + hyphens, 3-20 chars)
10. [x] e2e: Open modal, enter invalid key, see error
11. [x] e2e: Open modal, enter valid key, see success, modal closes, card updates, refresh persists
12. [x] e2e: User A redeems key for Workshop 1; User B (different token) cannot see User A's access row (RLS verified)

---

## Design Decisions & Rationale

### 1. Plain-Text Access Key (Approach C)

**Decision:** Store `access_key` as plain TEXT in `workshop_access` table. No hashing in v1.

**Rationale:**
- Jennifer creates keys manually via SQL until change 5 automates key generation
- Hashing adds complexity (bcrypt/argon2 dependencies, iteration cost) without proportional benefit in v1
- Plain text is auditable (can inspect key in tests) and aligns with seed-password pattern (Talleres2026!)
- Refactor to bcrypt in change 5 when admin panel / key generation is automated
- Risk is mitigated: RLS prevents unauthorized access to WorkshopAccess rows; expiry enforces time limit

### 2. Expiry Default 30 Days

**Decision:** `expires_at NOT NULL DEFAULT (now() + interval '30 days')`. Required at creation.

**Rationale:**
- Brief §9 mentions "claves de un solo uso" and temporal tracking; 30d is a reasonable window for v1 self-serve
- Prevents indefinite key validity (security window)
- In practice: Jennifer sets specific expiry dates when creating keys for events; default is a fallback
- Deferred: Automatic cleanup (delete expired access) happens in change 5 via cron/admin job

### 3. Permanent Access After Redemption

**Decision:** `redeemed_at IS NOT NULL` = permanent access. `expires_at` only blocks NEW redemptions, not access to redeemed workshops.

**Rationale:**
- Brief intent: student unlocks once, attends the taller whenever; not a subscription model
- After redemption, student's access to workshop content (sections/exercises) is managed by change 3+ content policies, not by `workshop_access.expires_at`
- Simplifies UX: no surprise loss of access if key expires after redemption
- Aligns with "canje" (exchange) semantics: key is consumed once, access is granted forever

### 4. UNIQUE(user_id, workshop_id)

**Decision:** Constraint at table level. One access per user per workshop.

**Rationale:**
- Brief §12: one key per student per taller
- Prevents duplicate rows; if user tries to redeem a second key, database conflict (409) → Server Action returns "Ya tenés acceso"
- Clean semantics: no ambiguity about "which key did you use to unlock this?"

### 5. RLS: Users Control Their Own Redemptions

**Decision:** `workshop_access` allows authenticated users to UPDATE their own rows (set `redeemed_at`). INSERT only via service_role (admin).

**Rationale:**
- In v1, Jennifer inserts keys manually. She uses service_role (admin client) for bulk inserts.
- Student initiates redemption (click "Ingresar", enter key, Server Action calls UPDATE)
- Student cannot see other users' keys or access rows (RLS SELECT filters to own user_id)
- Change 5 automates key generation (still uses service_role for INSERT); students continue redeeming via UPDATE

### 6. Split into 2a + 2b

**Decision:** Change 2 is delivered as two slices, ~350 lines each.

**Rationale:**
- Total change is ~700 lines (migraciones, componentes, tests, actions); exceeds 400-line budget
- Slice 2a (migrations + catalog read-only) is independently valuable: users see what's available
- Slice 2b (modal + redemption) adds interactivity; depends on 2a structure
- Both slices are mergeable separately (2a → master, 2b → stacked on 2a)
- Allows faster feedback loop; test each slice independently
- Verify gate (e2e + build) applied to both slices; no gap in coverage

---

## Open Decisions for Design Phase

1. **Card layout on mobile:** 1 column or 2 columns? Current spec assumes 3-4 on desktop.
   - **Defer to sdd-design:** Designer to specify breakpoints (tailwind sm/md/lg/xl)

2. **Cover image fallback:** If `cover_image IS NULL`, what visual? Gradient? Icon? Solid color?
   - **Defer to sdd-design:** Designer to provide CSS fallback or component logic

3. **"Continuar" button navigation:** Deferred to change 3. What happens if user clicks "Continuar"?
   - **Known:** Will link to `/taller/[slug]` with content sections. For now, button shows but doesn't navigate (or shows 404 friendly page).

4. **Filter by status:** Should 2a include status-filter dropdown, or is it purely visual distinction?
   - **Defer to sdd-design:** If filter added, confirm interaction; otherwise, filter deferred to 2b or change 3

5. **Success toast / notification:** After modal closes, does a toast appear? Or just modal close?
   - **Defer to sdd-design:** Confirm UX pattern (modal as sole feedback vs. toast + modal)

---

## External Blockers (Pre-Apply)

These tasks must be completed BEFORE `sdd-apply` begins. Jennifer owns them.

1. **SQL Migration: Create `workshops` table**
   - File: `supabase/migrations/{timestamp}_create_workshops_table.sql`
   - Content: table definition + indexes + RLS policies (from this spec, ~40 lines)
   - Action: Jennifer runs via `npx supabase migration up` in Supabase CLI

2. **SQL Migration: Create `workshop_access` table**
   - File: `supabase/migrations/{timestamp}_create_workshop_access_table.sql`
   - Content: table definition + FK constraints + RLS policies (from this spec, ~50 lines)
   - Action: Jennifer runs via `npx supabase migration up`

3. **Seed Workshops via SQL**
   - Action: Jennifer manually INSERT 4 seed workshops (disponible, en vivo, próximamente, completado)
   - Example:
     ```sql
     INSERT INTO public.workshops (slug, title, description, instructor, status, date_live)
     VALUES
       ('rag-intro', 'RAG Intro', 'Introduction to RAG systems', 'Dr. AI', 'disponible', now() + interval '7 days'),
       ('embeddings', 'Embeddings Deep Dive', 'Advanced embeddings', 'Dr. AI', 'en vivo', now()),
       ('future-tech', 'Future of AI', 'Speculation and trends', 'Dr. AI', 'próximamente', now() + interval '30 days'),
       ('completed', 'Past Workshop', 'Already happened', 'Dr. AI', 'completado', now() - interval '7 days');
     ```
   - Store workshop IDs for e2e test fixtures

4. **Seed Access Keys for Testing**
   - Action: Jennifer INSERT 2 workshop_access rows for seed_user (uid in helpers/supabase-admin.ts)
   - Example:
     ```sql
     INSERT INTO public.workshop_access (user_id, workshop_id, access_key, redeemed_at, expires_at)
     VALUES
       ('<seed-uid>', '<ws-1-uuid>', 'RAG-STARTER', now(), now() + interval '30 days'),
       ('<seed-uid>', '<ws-2-uuid>', 'LIVE-2024', now(), now() + interval '30 days');
     ```
   - This sets up the "2 unlocked, 2 locked" state for e2e tests

---

## Review Workload Forecast

**Slice 2a:** ~350 lines
- Migraciones: 90 lines
- Componentes: 170 lines
- Page + actions: 70 lines
- Tests: 120 lines (+ 40 helper extension)

**Slice 2b:** ~350 lines
- Modal component: 80 lines
- Server Action: 50 lines
- Schema + validation: 20 lines
- Tests: 120 lines
- UI wiring (button enable): ~30 lines

**Total:** ~700 lines across two slices

**Chained PRs:** Yes (2a → 2b stacked)
- PR 2a targets `master` (changes ~350 lines)
- PR 2b targets 2a branch (changes ~350 lines)
- No single PR exceeds 400 lines; parallel review possible
- E2E gate applied to both

**Decision needed before apply:** NO — delivery strategy (chained PRs) is already decided and cached by orchestrator.

**Budget risk:** Low — split into 2a/2b prevents any single PR from exceeding 400 lines.

---

## Risks & Mitigations

### Risk 1: RLS Misconfiguration (Medium)

**Description:** WorkshopAccess RLS allows users to SELECT/UPDATE only their own rows. If policy is too permissive (e.g., allows UPDATE of other users' rows), unauthorized access is possible.

**Mitigation:**
- Test explicitly in e2e: Create WorkshopAccess for User A, try to access/update as User B (different token) → expect 403 or 0 rows returned
- Review RLS policies in design phase
- Document in code: RLS policy intent with comment

### Risk 2: Double-Redeem Handling (Low)

**Description:** User A and User B both try to redeem the same key for the same workshop simultaneously. UNIQUE(user_id, workshop_id) prevents only duplicate user+workshop combos, not duplicate keys used.

**Mitigation:**
- In practice: each key is unique (generated by admin); reusing keys is not supported in v1
- If key is reused (bug), first user to redeem wins; second gets 409 conflict
- Server Action must return clear error: "Clave inválida o ya utilizada" (catch both cases)
- Change 5 (auto-gen) will assign unique IDs per key to prevent reuse

### Risk 3: Expiry Clock Skew (Low)

**Description:** Server clock differs from Supabase clock. `expires_at > now()` check fails unexpectedly.

**Mitigation:**
- Use Supabase server time in DB checks (via SQL function or CHECK constraint)
- Server Action uses `new Date()` for clientside validation; accept small skew (5-min tolerance)
- Log expiry checks in tests; monitor in production

### Risk 4: Design Assets Incomplete (Low)

**Description:** Figma/design lacks specific details for card layout, modal animation, badge styling.

**Mitigation:**
- Design phase reviews prototype and specifies missing assets
- Fallback to Tailwind defaults (card with border, modal with overlay)
- Animations (sdLive dot) already prototyped; extract from design HTML

### Risk 5: Test Seed Data Divergence (Low)

**Description:** If test fixtures (4 seed workshops) are not created/maintained, e2e specs fail intermittently.

**Mitigation:**
- `resetWorkshopsAndAccess()` helper is idempotent; recreates fixtures each test
- Document fixture creation in test comments
- If manual creation fails, helper logs clear errors

### Risk 6: Migrations Ordering (Low)

**Description:** If migrations run in wrong order, foreign key constraint fails.

**Rationale & Fix:**
- Always create `workshops` BEFORE `workshop_access` (FK dependency)
- Use Supabase migration CLI with sequential timestamps to ensure order
- Test migration up + down in local dev

---

## Deliverables Summary

### Slice 2a
- SQL migrations: 2 files (~90 lines total)
- React components: 2 files (~90 lines total)
- Page + actions: 2 files (~70 lines)
- Tests: 2 files + 1 helper extension (~190 lines)
- Styling: globals.css additions (~15 lines)
- **Total 2a:** ~350 lines + migrations

### Slice 2b
- Modal component: 1 file (~80 lines)
- Server Action + schema: 2 files (~70 lines)
- Tests: 1 file extensions (~120 lines)
- **Total 2b:** ~270 lines (net, since 2a provides infra)

### Integration Points
- Catalog page wires to fetchWorkshops (2a) + redeemKey (2b)
- Test fixtures support both slices; no redundant setup
- RLS policies ensure security across both slices

---

## Architecture Continuity

### Inherited from Change 1 (auth-and-shell)

- Server Actions pattern (co-located in `/actions.ts`)
- Zod schemas in `src/lib/schemas/`
- RLS for table-level auth (users table established pattern)
- React 19 + useActionState hook
- Playwright e2e with workers=1, admin helpers, ws transport
- Dark mode established; no additional design burden
- PascalCase components / camelCase functions

### Established for Downstream (Changes 3+)

- **Workshop model:** Foundational for Sections (change 3), Exercises (change 3), Progress (change 4), Leaderboards (change 4)
- **Access model:** User-Workshop link; will extend to Section-level RLS in change 3
- **Seed testing pattern:** `resetWorkshopsAndAccess()` can be extended for sections/exercises
- **Key redemption UX:** Modal pattern reused if needed (e.g., coupon codes in change 5+)

---

## Metrics & Verification

### Lines of Code
- **Functional code:** ~280 lines (migrations + components + actions + schemas)
- **Test code:** ~250 lines (e2e + unit + helpers)
- **Configuration/styling:** ~20 lines
- **Total:** ~550 lines per slice (2a ~350, 2b ~200 net new given shared infra)

### Test Coverage
- **Unit:** Key validation schema (100% coverage expected)
- **Integration:** None in v1 (defer to change 5 when admin panel exists)
- **E2E:** 7 specs (catalog view, filter, modal, redeem invalid, redeem valid, persistence, already-unlocked)
- **Gate:** pnpm test:e2e (Playwright with e2e-gate) must pass for both slices

### Performance
- **Catalog load:** fetchWorkshops queries workshops + workshop_access left-join; expect <200ms for ~50 workshops
- **Redemption:** redeemKey (validate + update) expect <100ms (single row update)
- **Defer:** Indexing optimization (if needed) to change 5 post-launch analysis

---

## Conclusion

**Change 2 (catalog-and-access)** is the student-facing entry point post-login. It establishes the data model (workshops + access), the catalog UX (grid + status badges), and the redemption flow (modal + key validation). Delivered in two slices (2a: read-only catalog; 2b: modal + redemption), respecting the 400-line budget and allowing staged rollout. All design decisions support pragmatism in v1 (plain-text keys, manual seed) while leaving clean refactor paths for v1.1+ (bcrypt, automation). RLS and UNIQUE constraints ensure security and data consistency. Ready for spec phase.

