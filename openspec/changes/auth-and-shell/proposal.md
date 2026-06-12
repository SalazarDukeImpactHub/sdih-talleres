# Proposal — auth-and-shell

**Change ID:** auth-and-shell  
**Position in SDD Plan:** 1 of 8  
**Status:** Draft  
**Date:** 2026-06-12  
**Reference Brief:** docs/brief.md  

---

## Intent

Establish secure authentication and the authenticated shell layout, enabling students to log in with email/password, complete mandatory first-login password change, and access the protected portal. This is the foundation for all subsequent features (catalog, workshops, admin panel, etc.).

---

## Scope Included

- Root middleware (`src/middleware.ts`) that refreshes Supabase session on every request
- Public login route (`/auth/login`) with email/password form validated via Zod on the server
- Server Action for `signInWithPassword()` that checks the `password_changed` flag in the `users` table
- Forced password change route (`/auth/change-password`) for users with `password_changed: false`
- Server Action for `updateUser()` that updates password and sets `password_changed: true`
- Authenticated shell layout with minimal top bar: logo + session indicator + logout button
- Protected entry route (tentatively `/catalog`, confirmed in design phase) that requires authentication
- Public `/restricted` route displaying static "Acceso restringido — necesitás VPN" message with brain isotipo and support link
- Flash messaging for session expiration (optional but recommended)

---

## Scope Explicitly Excluded (Delegated to Other Changes or Out of v1)

- **VPN enforcement:** Change 8 will implement IP allowlist/middleware header validation. Change 1 includes only the stub visual route `/restricted` with no actual VPN detection logic.
- **Email delivery (Resend):** Change 6 will wire transactional emails. Initial user creation (with temporary password) is an admin script or panel action; change 1 does NOT depend on RESEND_API_KEY or Resend integration.
- **Catalog of workshops:** Change 2 will build the catalog view and unlock-via-access-key modal.
- **Workshop content (5 sections):** Change 3.
- **Admin panel (CRUD + key generation):** Change 5.
- **WhatsApp button:** Change 7.
- **Google OAuth:** Explicitly out of v1 (phase 2).

---

## Approach (Base Recommended by sdd-explore)

**Approach A: Custom forms + Server Actions + Zod 4 + Supabase Auth (`@supabase/ssr`)**

Rationale from observation #600:
- Aligns with Next.js 16 App Router philosophy (Server Actions, SSR, minimal client React on auth pages).
- Enforces AGENTS.md blocker: "Inputs validados" via Zod on the server.
- Server Action for `signIn()` validates → calls `supabase.auth.signInWithPassword()` → checks `password_changed` flag → redirects to `/auth/change-password` if false, or authenticated entry if true.
- Root middleware invokes `updateSession()` from `src/lib/supabase/middleware.ts` to keep cookies fresh.
- Custom password-change form derived from login design is trivial (~50 lines Tailwind).
- RLS policies are validated in later tests (change 2+), not blocking this change.
- Design fidelity: prototype is fully custom (no pre-built auth UI component needed).

**Not recommended (from exploration):**
- `@supabase/auth-ui-react`: Adds React component overhead, harder to customize for forced password change, design doesn't benefit from the dependency.
- Passwordless/magic links: Violates brief §6 (email/password) and adds email complexity to change 1.

---

## Data Model Touched in This Change

**Table: `auth.users` (Supabase native)**
- Managed by Supabase Auth
- Stores: `id`, `email`, `encrypted_password`, `email_confirmed_at`, `last_sign_in_at`, custom metadata if needed
- We do NOT manage password hashing — Supabase Auth (bcrypt by default) handles it.

**Table: `public.users` (custom extension — CREATE in design or setup phase)**
- `id` (UUID, references `auth.users.id`)
- `email` (TEXT, denormalized for RLS queries)
- `name` (TEXT, default null)
- `role` (TEXT, 'alumno' | 'admin', default 'alumno')
- `password_changed` (BOOLEAN, default false)
- `created_at` (TIMESTAMPTZ, default now())
- RLS policy: Users can only read their own row; admins can read all (deferred to design phase).

---

## Routes in This Change

| Route | Type | Auth Required | Description |
|-------|------|---------------|-------------|
| `/` | Public | No | Landing/redirect route: if authenticated → redirect to `/catalog` (or authenticated entry), if not → redirect to `/auth/login` |
| `/auth/login` | Public | No | Email + password login form, Zod validated on server |
| `/auth/change-password` | Protected | Yes (with `password_changed: false` flag) | Forced password change form on first login; current + new + confirm password |
| `/catalog` | Protected | Yes | Authenticated entry point (shell layout); exact route name confirmed in design phase |
| `/restricted` | Public | No | Static "Acceso restringido — necesitás VPN" message with brain isotipo and support link (stub visual, no VPN logic) |

---

## Acceptance Criteria for This Change

(Subset of brief §11, scoped to auth-and-shell)

- [ ] User with `password_changed: false` can log in, be redirected to `/auth/change-password`, change password, and be redirected to authenticated entry point
- [ ] User with `password_changed: true` lands directly at authenticated entry point after login
- [ ] Session expiration redirects to `/auth/login` (optional flash message recommended)
- [ ] All form inputs (email, password, current password, new password, confirm password) validated with Zod on the server
- [ ] Root middleware refreshes Supabase session on every request without breaking Server Components (using `@supabase/ssr` pattern)
- [ ] `/restricted` route renders correctly and is accessible (mobile viewport 360px minimum)
- [ ] Build passes cleanly (`pnpm build`) with no Next.js 16 warnings
- [ ] Logout button clears session and redirects to `/auth/login`

---

## Open Decisions for Design Phase

These are architectural/UX decisions that design phase will resolve. Do not implement yet:

1. **Password hashing strategy**  
   - Supabase Auth default is bcrypt. Brief §10 mentions "argon2/bcrypt" but doesn't mandate.  
   - Decision: Confirm Jennifer's preference. If bcrypt (Supabase default) is acceptable, no custom code needed. If argon2 required, plan `@node-rs/argon2` or similar for custom hashing in a future change.

2. **Test runner for change 1**  
   - Project currently has `test_runner: none` (from sdd-init).  
   - Decision: Use Vitest (unit tests for auth Server Actions) + Playwright (e2e for login flow), or defer testing to change 2+? Brief §12 says "mínimo: RLS por alumno + flujos de acceso" but may apply to later changes.

3. **Authenticated entry route name**  
   - Brief §7.2 calls it "Catálogo" but exact route is `/catalog` vs `/dashboard` vs other?  
   - Decision: Pick final route name (affects middleware redirects and design phase).

4. **Table `users` structure**  
   - Is `public.users` an extension of Supabase's `auth.users`, or a standalone table with a foreign key?  
   - Decision: Prefer extension pattern (FK to `auth.users.id`) for RLS compatibility (see AGENTS.md blocker).

5. **Flash messaging on session expiration**  
   - Is a toast/flash notification required when session expires, or silent redirect to `/auth/login`?  
   - Decision: Recommend flash for UX, but not blocking if kept simple.

---

## Constraints Inherited from Brief (Cached — Not Subject to Re-negotiation)

These are client decisions from §12 (cacheadas):

- **VPN enforcement stub only:** Include `/restricted` visual, NOT real VPN middleware (change 8).
- **No Resend in change 1:** Email delivery is change 6. Initial users created via admin script/panel action.
- **Tagline:** "Inteligencia con alma" (visual identity element).
- **Color palette:** Navy dark mode only (no light mode in v1).
- **RLS mandatory (AGENTS.md blocker):** Any table with per-student data must have RLS policies active before deploy.

---

## Risks for Apply Phase

(From sdd-explore observation #600, condensed)

1. **Supabase Auth + Next.js 16 SSR interaction**  
   - Cookie handling in Server Components vs. Server Actions can be tricky.  
   - Mitigation: Use Server Actions for auth mutations only; rely on `@supabase/ssr` middleware pattern.

2. **Password hashing control**  
   - Supabase Auth handles bcrypt/argon2 internally; developers don't control it.  
   - Mitigation: Confirm with Jennifer in design phase if Supabase default (bcrypt) is acceptable.

3. **`password_changed` flag logic**  
   - Flag exists in custom `public.users` table but Supabase Auth doesn't natively manage it.  
   - App must: set flag = false on initial creation, check after login, update after password change.  
   - Mitigation: Implement this flow explicitly in Server Actions; add tests.

4. **No test runner currently configured**  
   - Project has `test_runner: none`.  
   - Mitigation: Design phase decides whether to scaffold Vitest + Playwright or defer.

5. **Design mismatch (HTML copy-paste temptation)**  
   - Prototype HTML uses inline styles; app uses Tailwind 4 utilities.  
   - SVG neural background might be heavy on mobile.  
   - Mitigation: Derive visual hierarchy from prototype, implement in Tailwind + React; optimize for 360px viewport.

6. **Middleware refresh without breaking Server Components**  
   - `setAll()` in Server Components silently fails (per sdd-explore note on `@supabase/ssr` v0.12).  
   - Mitigation: Use Server Actions for mutations; middleware only refreshes (`updateSession()`).

---

## Review Workload Estimate

Rough line count estimate (for delivery_strategy ask-on-risk):

- Root middleware + Supabase session refresh: ~40 lines
- Login form component (HTML + validation): ~80 lines
- Login Server Action: ~50 lines
- Change-password form component: ~60 lines
- Change-password Server Action: ~50 lines
- Authenticated shell layout: ~50 lines
- `/restricted` route stub: ~20 lines
- Type definitions / interfaces: ~50 lines
- **Total estimate: ~400 lines (at the boundary)**

If RLS policies are included in this change (deferred to design phase), estimate could exceed 400 lines, requiring discussion of chained PRs or size:exception.

---

## Dependencies

- **None.** This is change 1; no prior changes block it.
- Supabase project must exist with auth enabled.
- `.env.local` must be populated with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

---

## External Blockers (Human Actions Required Before sdd-apply)

Before implementation starts:

1. **Supabase project created** with email/password auth enabled and RLS policies framework ready.
2. **Table `public.users` created** with schema: `id`, `email`, `name`, `role`, `password_changed`, `created_at`.
3. **Test user created** in Supabase with `email: test@example.com`, `password_changed: false`.
4. **`.env.local` populated** with valid Supabase keys (public + service role).
5. **Design phase completed** with decisions on: password hashing, test runner, entry route name, table structure, flash messaging.

---

## Appendix: Design Assets Available

From brief §8–9 and sdd-explore:

**Login Screen (in prototype):**
- Location: `design/portal-talleres/SDIH Talleres.dc.html`, lines 62–143
- Reusable: Email/password input styles (12px rounded, dark bg, cyan focus glow), button styles (cyan primary, outline secondary), card backdrop blur.

**Change-Password Screen (NOT in prototype):**
- Must be derived from login: same card layout, message "Cambiá tu contraseña antes de continuar", fields for current + new + confirm password.

**Shell Top Bar (in prototype — Catalog view):**
- Logo, search placeholder (optional), notifications (optional), user avatar.
- For change 1: minimal bar with logo + logout button sufficient.

**Microanimations (reusable in change 1):**
- `sdRise`: fade + slide up from 8px (suitable for login/change-password card entrance).
- Other animations (pulse, check, toast) used in later changes.

