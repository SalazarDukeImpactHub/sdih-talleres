# Design: admin-panel (Change 5 of 8)

**Change ID:** `admin-panel`  
**Status:** Design Phase Complete  
**Date:** 2026-06-16  

---

## Executive Summary

**Admin Panel Architecture:** Implement a server-side role-gated admin interface with 4 chained PRs (5a: shell+list, 5b: CRUD+upload, 5c: students+keys, 5d: hash migration). Pattern: Server Actions with service_role + explicit Node.js role validation (not RLS). Storage bucket for workshop covers. SHA-256 hash for access keys (no new deps). Reuse `getCurrentUser()`, `getExerciseAwareProgress()`, Zod schemas from changes 1-4. Total ~1,850 LOC across 4 slices, ~45 e2e specs. Risk: refactoring archived redeemKey (change 2) and hash migration correctness — mitigated by test fixtures + triple review.

---

## Architectural Decisions D-1 through D-14

### D-1: Admin Route Structure and Route Groups

**Decision:** Routes organized under `(admin)` route group with layout-level guard.

```
/admin
├── /admin/talleres (list all workshops)
├── /admin/talleres/new (create workshop)
├── /admin/talleres/[id] (edit workshop)
├── /admin/talleres/[id]/alumnos (students list + new student form)
└── /admin/claves (optional: keys table)
```

**Alternatives:** Flat routes `/admin-*` (simpler, rejected: no guard inheritance), nested per-section editors (rejected: brief wants JSON upload).

**Rationale:** Route groups `(admin)` enable single guard at layout level; all children inherit. Hierarchical structure mirrors workflow. Co-located `actions.ts` groups all workshop-related Server Actions.

---

### D-2: Admin Layout: Sidebar vs Topbar

**Decision:** Vertical sidebar (left) with navigation. Standard admin UX (GitHub, Linear, Vercel).

**Components:**
- `AdminSidebar.tsx` (nav links, collapse on mobile)
- `AdminLayout.tsx` (sidebar shell, flex layout)
- Breadcrumbs below topbar for deep routes

**Alternatives:** Horizontal topbar (rejected: admin workflows need left-side context).

**Rationale:** Sidebar is proven admin pattern, takes less vertical space, collapses on mobile. Reuses navy-900 bg + cyan highlights.

---

### D-3: Server-Side Guard in (admin)/layout.tsx

**Decision:** Guard as Server Component in `(admin)/layout.tsx`.

```typescript
export default async function AdminLayout({ children }) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  if (user.role !== "admin") redirect("/catalogo");
  // render with sidebar + children
}
```

**Alternatives:** Middleware (rejected: redundant with Server Action checks), client-side (rejected: less secure).

**Rationale:** Proven pattern (used in `(authenticated)` layout). Redirect at render time, before child pages mount. Combined with Server Action role-checks = defense-in-depth.

---

### D-4: Server Actions with service_role + role Validation

**Decision:** Each admin Server Action calls `requireAdmin()` FIRST, then uses service_role client.

```typescript
export async function createWorkshop(formData) {
  const admin = await requireAdmin(); // throws if not admin
  const adminClient = await createAdminClient(); // service_role
  // proceed with DB write
}
```

**Helper functions (NEW):**
- `createAdminClient()` in `src/lib/supabase/admin.ts` (service_role client)
- `requireAdmin()` in `src/lib/auth/require-admin.ts` (role check)

**Applied to:** createWorkshop, updateWorkshop, deleteWorkshop, uploadCover, createStudent, generateAccessKey.

**Alternatives:** RLS policies for admin (rejected: doesn't easily access auth.users claims, more complex).

**Rationale:** Pattern from changes 1-4. service_role bypasses RLS (correct for admin). Explicit role check in Node.js is more testeable than RLS.

---

### D-5: SQL Migration for Hash + Salt Columns

**Decision:** Add `access_key_hash` (TEXT) + `access_key_salt` (UUID) to workshop_access. Backfill existing plaintext keys via SHA-256. Keep `access_key` column for backward-compat (drop in polish).

**Migration SQL:**

```sql
BEGIN;
ALTER TABLE public.workshop_access
ADD COLUMN access_key_salt UUID DEFAULT gen_random_uuid(),
ADD COLUMN access_key_hash TEXT;

UPDATE public.workshop_access
SET 
  access_key_salt = COALESCE(access_key_salt, gen_random_uuid()),
  access_key_hash = COALESCE(access_key_hash, 
    encode(digest(access_key_salt::text || COALESCE(access_key, ''), 'sha256'), 'hex'))
WHERE access_key IS NOT NULL AND access_key_hash IS NULL;

ALTER TABLE public.workshop_access
ALTER COLUMN access_key_hash SET NOT NULL,
ALTER COLUMN access_key_salt SET NOT NULL;
COMMIT;
```

**Fallback:** If pgcrypto unavailable, Node.js backfill script.

**Alternatives:** Bcrypt (rejected: overkill for one-shot keys, slower), drop plaintext immediately (rejected: breaks backward-compat).

**Rationale:** Hash + salt prevents plaintext exposure. SHA-256 is standard for session tokens. Keep plaintext during v1; drop in polish allows safe rollback.

---

### D-6: Hash and Verification Functions

**Decision:** Utility module `src/lib/crypto/access-key.ts` (Node.js crypto, no external deps).

```typescript
export function generateAccessKey(): string {
  // "RAG-1234-AB5X" (14 chars, ~50 bits entropy)
}

export function hashAccessKey(plain: string, salt: string): string {
  // SHA256(salt + plain) → hex
}

export function verifyAccessKey(plain: string, hash: string, salt: string): boolean {
  // computed === hash
}
```

**Alternatives:** WebCrypto async (rejected: no benefit), Argon2 (rejected: overkill).

**Rationale:** crypto is Node.js builtin. Synchronous hashing fits Server Action pattern. Salt + hash prevents rainbow tables.

---

### D-7: Update redeemKey() to Hash-Based Verification

**Decision:** Refactor `redeemKey()` in `src/app/(authenticated)/catalogo/actions.ts` (change 2, archived) to verify against hash. Fallback to plaintext for legacy keys (backward-compat).

```typescript
export async function redeemKey(input) {
  const { access_key_hash, access_key_salt, access_key } = await fetch();
  
  if (access_key_hash && access_key_salt) {
    // New: hash verification
    keyValid = verifyAccessKey(input.key, access_key_hash, access_key_salt);
  } else if (access_key) {
    // Legacy: plaintext (warn in logs)
    keyValid = (access_key === input.key.toUpperCase());
  }
  
  if (keyValid) { update redeemed_at; return success; }
  return error;
}
```

**Test Fixture:** Cover both paths (legacy + hashed).

**Alternatives:** Remove fallback immediately (rejected: breaks backward-compat).

**Rationale:** Hash prevents plaintext exposure. Fallback ensures legacy keys (changes 2-4) work. Warning logs identify legacy keys.

---

### D-8: Storage Bucket and Upload Pattern

**Decision:** Supabase Storage bucket `workshops`, RLS-controlled, public CDN read access.

**Bucket:**
- Name: `workshops`
- Path: `{workshopId}/cover.{ext}`

**RLS Policies:**
```sql
-- SELECT for authenticated (CDN read)
-- INSERT/UPDATE for service_role (validated in Server Action)
```

**Upload Server Action:**
```typescript
export async function uploadCover(workshopId, formData) {
  await requireAdmin();
  const file = formData.get("cover");
  // validate: mimetype, size (<5MB)
  // upload to "workshops" bucket
  // return public URL
}
```

**Alternatives:** Presigned URLs (rejected: add complexity), private bucket (rejected: brief doesn't require privacy).

**Rationale:** Bucket-level RLS sufficient. Server Action auth guards writes. Public CDN enables fast delivery.

---

### D-9: Admin Components, Server vs Client, Reusability

**Decision:** Components by Server/Client boundary. Reuse existing (AuthCard, FormError, SubmitButton, StatusBadge).

| Component | Type | Purpose | LOC |
|-----------|------|---------|-----|
| AdminLayout | Server | Sidebar + breadcrumbs shell | 40 |
| AdminSidebar | Client | Nav links, collapse | 40 |
| WorkshopTable | Client | List + filters + actions | 80 |
| WorkshopForm | Client | Create/edit form | 120 |
| CoverUpload | Client | File input + preview | 60 |
| StudentList | Client | Students + progress % | 80 |
| CreateStudentModal | Client | New student form | 80 |
| KeyTable | Client | Keys list | 60 |

**Reused:** AuthCard, FormError, SubmitButton, StatusBadge, Input, Button (no changes).

**Serialization:** All props JSON-serializable (strings, numbers, arrays, objects).

**Alternatives:** All Client Components (rejected: higher hydration cost), complex lib (rejected: overkill).

**Rationale:** Consistent with design system. Server Components reduce JS for shell+list. Client for interactivity.

---

### D-10: Create Student Server Action

**Decision:** `createStudent(workshopId, email, passwordTemp)` creates auth.users + public.users row.

```typescript
export async function createStudent(workshopId, email, passwordTemp) {
  await requireAdmin();
  // validate: email, password
  // create auth.users via admin.auth.admin.createUser()
  // create public.users with role='alumno', password_changed=false
  // return success
}
```

**Schema:**
```typescript
createStudentSchema = z.object({
  email: z.string().email(),
  passwordTemp: z.string().min(8)
});
```

**Alternatives:** Email-only with link (rejected: requires change 6), random password (ok, but manual is simpler).

**Rationale:** Admin-initiated creation is standard. `password_changed=false` forces change on first login. No email sent here (change 6).

---

### D-11: Generate Access Key Server Action

**Decision:** `generateAccessKey(userId, workshopId)` creates workshop_access with hashed key. Returns plaintext **once only**.

```typescript
export async function generateAccessKey(userId, workshopId) {
  await requireAdmin();
  const plainKey = generateAccessKey(); // "RAG-1234-AB5X"
  const salt = crypto.randomUUID();
  const hash = hashAccessKey(plainKey, salt);
  await upsert(workshop_access: { user_id, workshop_id, hash, salt, expires_at });
  return { success: true, key: plainKey }; // plaintext ONE TIME
}
```

**Key Display:** Show last 4 chars only in table. Plaintext shown once in modal after generation.

**Alternatives:** Auto-email (deferred to change 6), QR code (nice-to-have, deferred), persistent display (security risk).

**Rationale:** Plaintext returned once prevents accidental exposure. Hash + salt in DB. 90-day expiry limits window.

---

### D-12: Content JSON Validation via Zod Schema

**Decision:** content_json stored as TEXT. Validated with Zod before save. Schema matches change 3.

```typescript
workshopContentSchema = z.object({
  sections: z.array(sectionSchema),
  exercises: z.array(exerciseSchema).optional(),
  glossary: z.array(glossaryTermSchema).optional()
});

createWorkshopSchema = z.object({
  title, description, instructor, ... ,
  content_json: workshopContentSchema
});
```

**Validation in Server Action:**
```typescript
const parsed = createWorkshopSchema.safeParse(formData);
if (!parsed.success) return { errors: formatZodErrors(parsed.error) };
// insert with content_json = JSON.stringify(parsed.data.content_json)
```

**Alternatives:** UI form builder (deferred to polish), no validation (rejected: risk of bad data).

**Rationale:** Prevents malformed JSON. Clear errors to admin. Reusable for create + update.

---

### D-13: Test Helper for e2e Admin Scenarios

**Decision:** Extend `tests/helpers/supabase-admin.ts` with admin user + key helpers.

```typescript
export async function createOrResetAdminUser() {
  // singleton admin user for tests
  return { id, email: "admin@test.local", password: "AdminTest123!" };
}

export async function createPlaintextKey(userId, workshopId) {
  // legacy key (no hash) for backward-compat tests
}

export async function createHashedKey(userId, workshopId) {
  // new key (hash + salt) for slice 5c+ tests
}
```

**Usage:** e2e specs test both legacy + hashed paths.

**Alternatives:** Separate factory (rejected: adds complexity).

**Rationale:** Singleton avoids recreating on every test. Helpers support both paths.

---

### D-14: Spec → File Mapping, LOC Estimation, Dependencies

**Decision:** Map requirements to files, estimate lines per slice.

**Slice 5a: Shell + List (~440 LOC)**
- layout.tsx (50), page.tsx (40), actions.ts (40), sidebar+layout components (80), table (80), breadcrumbs (30), global.css (20), e2e tests (100)

**Slice 5b: CRUD + Upload (~540 LOC)**
- new/page.tsx (40), [id]/page.tsx (40), form component (120), upload component (60), actions extend (100), storage helper (50), schema extend (50), e2e tests (80)

**Slice 5c: Students + Keys (~580 LOC)**
- alumnos/page.tsx (50), student list (80), modal (80), key table (60), actions.ts (100), schema extend (30), db-helpers (30), test helpers (50), e2e tests (100)

**Slice 5d: Hash Migration + Refactor (~290 LOC)**
- crypto/access-key.ts (50), migration SQL (40), redeemKey refactor (50), key test helpers (50), e2e tests (100)

**Total: ~1,850 LOC**

**New Dependencies:** ZERO. crypto is Node.js builtin. Zod already in project.

**Reused:** getCurrentUser, getExerciseAwareProgress, Zod schemas, components (AuthCard, FormError, SubmitButton, StatusBadge, Input, Button), test helpers (seedWorkshop, seedStudentUser, seedExercises).

---

## SQL Migrations

**File:** `supabase/migrations/20260616_add_key_hash.sql`

```sql
BEGIN;

ALTER TABLE public.workshop_access
ADD COLUMN access_key_salt UUID DEFAULT gen_random_uuid(),
ADD COLUMN access_key_hash TEXT;

UPDATE public.workshop_access
SET 
  access_key_salt = COALESCE(access_key_salt, gen_random_uuid()),
  access_key_hash = COALESCE(access_key_hash, 
    encode(digest(access_key_salt::text || COALESCE(access_key, ''), 'sha256'), 'hex'))
WHERE access_key IS NOT NULL AND access_key_hash IS NULL;

ALTER TABLE public.workshop_access
ALTER COLUMN access_key_hash SET NOT NULL,
ALTER COLUMN access_key_salt SET NOT NULL;

-- Future: ALTER TABLE public.workshop_access DROP COLUMN access_key;

COMMIT;
```

---

## Risks and Mitigations

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Refactoring archived redeemKey (change 2) | HIGH | Test fixture covers legacy + hashed paths. Fallback logic. Triple-review PR. Rollback plan. |
| Storage RLS misconfiguration | MEDIUM | Policy reviewed in design. e2e: admin uploads → file appears → URL works. |
| Hash migration correctness | HIGH | Test locally. Test: insert → migrate → verify hash. Explicit rollback in migration. |
| E2E suite timeout | MEDIUM | Happy-path + security specs only. Reuse helpers. Move UI details to polish if needed. |
| Backward-compat plaintext keys | LOW | Test fixture: legacy key without hash. redeemKey() fallback. Warning logs. |
| User creation quota | MEDIUM | Test: create 5 users, fail fast if quota. Clear error to admin. |
| Content JSON too strict | LOW | Schema from change 3. Specific error messages. Loosen if needed. |

---

## ADR Candidates

1. **ADR-005: Server-Side Role Check vs RLS for Admin**
   - Decision: Server Actions + Node.js role check (simpler, more testeable)
   - Trade-off: Doesn't scale to fine-grained row-level admin controls

2. **ADR-006: SHA-256 Hash for Access Keys**
   - Decision: SHA-256 + salt (not Bcrypt)
   - Rationale: Keys are randomly generated, not passwords. SHA-256 sufficient, faster.

3. **ADR-007: Service Role Client for Admin Server Actions**
   - Decision: service_role bypasses RLS; explicit role check in Node.js provides security
   - Trade-off: Requires server-only environment (safe, enforced)

---

## Open Issues

1. Notification to students when key generated → deferred to change 6
2. Bulk student import → v1.1
3. Audit log for admin actions → v1.1
4. Drop plaintext access_key → post-v1 polish
5. QR code for key sharing → polish

---

## Conclusion

**Admin Panel Design** provides Jennifer with CRUD for workshops, students, and access keys. Architecture leverages patterns from changes 1-4 (Server Actions + role checks, Zod validation, e2e gate). Four chained PRs (5a: shell+list, 5b: CRUD+upload, 5c: students+keys, 5d: hash migration) respect 400 LOC/PR budget while enabling early feedback. Hash migration (5d) is isolated and triple-reviewed for security. Ready for specification and task breakdown.

**Design Approved:** 2026-06-16  
**Next Phase:** sdd-spec (parallel) → sdd-tasks
