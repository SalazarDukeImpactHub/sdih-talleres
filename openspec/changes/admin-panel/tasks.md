# Tasks — admin-panel

**Change ID:** admin-panel  
**Position in SDD plan:** 5 of 8  
**Status:** Tasks (ready for apply)  
**Slicing:** 4 chained PRs (5a ~440 lines, 5b ~540 lines, 5c ~580 lines, 5d ~290 lines)  
**Delivery Strategy:** Chained PRs approved by Jennifer (5a → 5b → 5c → 5d stacked)

---

## Review Workload Forecast

| Metric | Value | Notes |
|--------|-------|-------|
| **Estimated changed lines** | ~1,850 | 5a: ~440 (layout+guard+list), 5b: ~540 (CRUD+upload), 5c: ~580 (students+keys), 5d: ~290 (migration+crypto+refactor) |
| **400-line budget risk** | Low | 4 chained PRs distribute load; each slice autonomous. Total justified by admin infrastructure scope. |
| **Chained PRs recommended** | Yes | 4 slices: 5a foundational (shell), 5b extends (CRUD+upload), 5c adds student mgmt, 5d critical security (hash+refactor). All mergeable independently. |
| **Decision needed before apply** | No | All design decisions locked (D-1 to D-14 in design artifact). Service role + role-check pattern proven in changes 1-4. |
| **Chain strategy** | stacked-to-main | Slice 5a → PR#N merges to master; 5b → PR#N+1 branches from 5a merged; 5c → PR#N+2 branches from 5b merged; 5d → PR#N+3 branches from 5c merged |

**Forecast details:**
- Slice 5a: Layout + guard (50 LOC) + pages (100 LOC) + components WorkshopTable/Sidebar (120 LOC) + actions (40 LOC) + styling (20 LOC) + e2e tests (110 LOC) = **~440 LOC**
- Slice 5b: Form component + validation (120 LOC) + upload + Server Actions (150 LOC) + storage helper (50 LOC) + schema extend (50 LOC) + styling (80 LOC) + e2e tests (100 LOC) = **~550 LOC**
- Slice 5c: StudentList + modal components (160 LOC) + Server Actions createStudent/generateKey (100 LOC) + schema extend (30 LOC) + test helpers (50 LOC) + e2e tests (140 LOC) = **~480 LOC**
- Slice 5d: Migration SQL (40 LOC) + crypto utility (50 LOC) + redeemKey refactor (50 LOC) + test fixtures (50 LOC) + e2e tests (100 LOC) = **~290 LOC**
- **Total: ~1,760 LOC** (revisions from estimate; includes margin for comments + fixtures)

**Key findings:**
- No new npm dependencies required (crypto is Node.js builtin; Zod already present)
- Service role client pattern: `createAdminClient()` in `src/lib/supabase/admin.ts` + `requireAdmin()` in `src/lib/auth/require-admin.ts` (NEW helpers)
- SQL migrations for 5d provided in design D-5
- Redeemkey refactor touches archived change 2 code; test fixtures cover both hash + plaintext paths
- E2E gate per slice; suite estimate ~50-55 min serial (current ~38 min + ~15-20 min admin specs; parallelization blocked by DB singleton pattern)

---

## Pre-Apply Blockers (Read & Action Required)

### B-1: Create Admin Test User in Supabase (Manual Step — Jennifer)

**Blocker owner:** Jennifer Salazar Duque  
**Action:** Before `pnpm test:e2e [5a]` runs:

1. Create or reset admin user in Supabase `auth.users`:
   - Email: `admin@test.local` (or configure in env)
   - Password: strong temporary (stored securely)
   - Confirm email (set confirmed_at timestamp)

2. Ensure `public.users` row exists with:
   - `user_id` = auth user UUID
   - `email` = `admin@test.local`
   - `role` = `'admin'` (CRITICAL)
   - `name` = "Test Admin"

3. Verify:
   ```sql
   SELECT id, email, role FROM public.users WHERE role = 'admin' LIMIT 1;
   -- Should return 1 row with role='admin'
   ```

**Timing:** Apply 5a creates test helpers; Jennifer creates user BEFORE running e2e gate.

**Acceptance:** Admin user exists with role='admin'. Login helper in `tests/helpers/admin.ts` successfully authenticates.

---

### B-2: Create Supabase Storage Bucket `workshops` (Manual Step — Jennifer)

**Blocker owner:** Jennifer Salazar Duque  
**Action:** Before `pnpm test:e2e [5b]` runs:

1. Create Storage bucket in Supabase:
   - Name: `workshops`
   - Visibility: Private (RLS controlled)

2. Create RLS policies via Supabase dashboard or SQL:
   ```sql
   -- Policy 1: SELECT for all authenticated users (CDN read access)
   CREATE POLICY "storage_select_covers" ON storage.objects
     FOR SELECT USING (bucket_id = 'workshops');
   
   -- Policy 2: INSERT/UPDATE for service_role only (validated in Server Action)
   CREATE POLICY "storage_write_covers_admin" ON storage.objects
     FOR INSERT, UPDATE WITH CHECK (bucket_id = 'workshops' AND auth.role() = 'service_role');
   ```

3. Verify:
   ```sql
   SELECT policyname, roles FROM pg_policies WHERE tablename = 'objects';
   -- Should show storage_select_covers + storage_write_covers_admin
   ```

**Timing:** Apply 5b creates upload logic; Jennifer creates bucket + policies BEFORE running e2e gate 5b.

**Acceptance:** Bucket `workshops` exists. RLS policies allow SELECT for all, INSERT/UPDATE for service_role. Test: uploadCover() Server Action succeeds.

---

### B-3: Test Fixtures: Admin User Helper + Plaintext/Hashed Keys (Prepare for 5d)

**Blocker owner:** Apply phase (via helper function)  
**Action:** Tasks 5a.8, 5c.7, 5d.1 create helpers; Jennifer verifies before 5d e2e:

1. Helper `tests/helpers/admin.ts` (created in 5a.8):
   - `createOrResetAdminUser()` — returns singleton admin user (email, password, userId)
   - Called in beforeEach for all admin e2e tests

2. Helper `tests/helpers/seed-keys.ts` (created in 5c.7, extended in 5d.2):
   - `createPlaintextKey(userId, workshopId)` — legacy key (no hash) for backward-compat tests
   - `createHashedKey(userId, workshopId)` — new key (hash + salt) for 5c+ tests
   - Precalculate SHA-256(salt + plaintext) for fixtures

3. Verify in 5d:
   ```sql
   SELECT COUNT(*) FROM workshop_access WHERE access_key_hash IS NOT NULL;
   -- Should be >= 5 (from 5c tests + 5d migration backfill)
   ```

**Timing:** 5a.8 creates admin helper, 5c.7 creates key helpers, 5d.2 extends with precalculated fixtures.

**Acceptance:** Helpers exist and are called in e2e beforeEach. Both plaintext and hashed keys can be generated for testing.

---

### B-4: Redeemkey Refactor Requires Change 2 (Archived) Merged to Master

**Blocker owner:** Git workflow (orchestrator)  
**Action:** Before 5d PR is created:

- Ensure slice 5a, 5b, 5c are merged to master
- Do NOT create 5d PR until 5c is merged
- 5d refactors `src/app/(authenticated)/catalogo/actions.ts` (change 2 archivado)
- If 5c is not merged, 5d will have merge conflicts

**Timing:** 5d depends on 5a + 5b + 5c merged.

**Acceptance:** Master contains slice 5a, 5b, 5c before 5d branch is created.

---

## Slice 5a Tasks: Admin Shell & Workshop List

**Scope:** Layout with server-side guard + workshop list page + sidebar navigation + Server Action fetchWorkshops + admin test helper + e2e tests [5a basics]

**Target:** ~440 lines, autonomous, fully tested, mergeable to master alone

**Gate:** `pnpm build && pnpm lint && pnpm test && pnpm test:e2e [5a]` (scope: guard + list + auth)

---

### Task 5a.1: Create `(admin)` Route Group Layout with Server-Side Guard

**Type:** Route infrastructure  
**Files affected:**
- `src/app/(admin)/layout.tsx` (new)

**Acceptance:**
- [ ] File exists: `src/app/(admin)/layout.tsx` as Server Component
- [ ] Guard logic:
  - Call `getCurrentUser()` before rendering children
  - If not authenticated → `redirect("/auth/login")`
  - If authenticated but `role !== 'admin'` → `redirect("/catalogo")`
  - If role === 'admin' → render layout with children
- [ ] Layout structure:
  - Flex layout: sidebar (left) + main content (right)
  - Render `<AdminSidebar />` component (created in 5a.4)
  - Render `<AdminLayout />` wrapper with breadcrumbs (created in 5a.4)
  - Children render inside main content area
- [ ] Styling: nav area navy-900 bg, content area responsive (mobile collapse sidebar)
- [ ] Test: vitest unit test mocks getCurrentUser, verifies redirect logic (no auth → /login, alumno → /catalogo, admin → render)

**Dependency:** getCurrentUser() from change 1 (reused)  
**Estimated:** 50 LOC

---

### Task 5a.2: Create `/admin/talleres` Page (Workshop List)

**Type:** Route + Server Component  
**Files affected:**
- `src/app/(admin)/talleres/page.tsx` (new)

**Acceptance:**
- [ ] Server Component: fetch all workshops via fetchWorkshops() Server Action
- [ ] Props: none (page.tsx only fetches and renders)
- [ ] Pass workshops + filters to Client wrapper (component created in 5a.5)
- [ ] Breadcrumbs: "Admin > Talleres"
- [ ] Layout: page title "Talleres", filter controls, table below
- [ ] Test: Playwright test admin user navigates to /admin/talleres, page loads, workshops visible

**Dependency:** Task 5a.3 (fetchWorkshops Server Action)  
**Estimated:** 40 LOC

---

### Task 5a.3: Create Server Action `fetchWorkshops(filter?)`

**Type:** Server-side function  
**Files affected:**
- `src/app/(admin)/talleres/actions.ts` (new)

**Acceptance:**
- [ ] Signature: `async function fetchWorkshops(filter?: 'available'|'live'|'upcoming'|'completed'): Promise<Workshop[]>`
- [ ] No auth check (page already guarded by layout)
- [ ] Query: SELECT all workshops from DB, ORDER BY created_at DESC
- [ ] Filter logic: if filter provided, WHERE status = $1
- [ ] Return: array of Workshop objects (id, title, status, date, instructor)
- [ ] Test: vitest unit test mocks Supabase, verifies query structure

**Dependency:** None (DB query)  
**Estimated:** 40 LOC

---

### Task 5a.4: Create `AdminSidebar` and `AdminLayout` Components

**Type:** UI components  
**Files affected:**
- `src/components/admin/AdminSidebar.tsx` (new, Client Component)
- `src/components/admin/AdminLayout.tsx` (new, Server Component wrapper)

**Acceptance:**
- [ ] AdminSidebar (Client):
  - Props: none (uses usePathname for active state)
  - Render: logo, nav links (Talleres → /admin/talleres, Claves → /admin/claves optional)
  - Collapse button for mobile (hamburger icon)
  - Reuse existing Button + Icon components
  - Styling: navy-900 bg, cyan highlights (from design system)
- [ ] AdminLayout (Server):
  - Props: children (ReactNode)
  - Render: <AdminSidebar /> + <main>{children}</main>
  - Breadcrumbs placeholder (wired per page, e.g., "Talleres > [id]")
- [ ] Mobile: sidebar collapses to hamburger on <768px
- [ ] Test: Playwright test sidebar renders, nav links clickable, collapse button works on mobile

**Dependency:** Task 5a.1 (layout provides children)  
**Estimated:** 80 LOC (40 sidebar + 40 layout)

---

### Task 5a.5: Create `WorkshopTable` Component (List View with Filters)

**Type:** UI component  
**Files affected:**
- `src/components/admin/WorkshopTable.tsx` (new, Client Component)

**Acceptance:**
- [ ] Props: workshops: Workshop[], onFilterChange callback
- [ ] State: selectedFilter ('available'|'live'|'upcoming'|'completed'|'all')
- [ ] Render:
  - Filter dropdown / tabs (status filter)
  - Table with columns: ID, Title, Status, Date, Instructor, Actions
  - Actions column: Edit button (→ /admin/talleres/[id]), View button (→ /catalogo)
  - "New Workshop" button (→ /admin/talleres/new, deferred implementation in 5b)
- [ ] Filter logic: onChange → call onFilterChange(filter) → parent calls fetchWorkshops(filter)
- [ ] Styling: table responsive, mobile horizontal scroll or stack
- [ ] Test: Playwright test filter dropdown changes, table updates with new data

**Dependency:** Task 5a.3 (fetchWorkshops)  
**Estimated:** 80 LOC

---

### Task 5a.6: Helper Function `createAdminClient()` for Service Role

**Type:** Utility function  
**Files affected:**
- `src/lib/supabase/admin.ts` (new)

**Acceptance:**
- [ ] Export: `async function createAdminClient(): Promise<SupabaseClient>`
- [ ] Logic: create Supabase client with service_role key (from env.SUPABASE_SERVICE_ROLE_KEY)
- [ ] Returns: client object for use in admin Server Actions
- [ ] Test: vitest unit test verifies client is created (no actual DB call)

**Dependency:** None (config only)  
**Estimated:** 20 LOC

---

### Task 5a.7: Helper Function `requireAdmin()` for Role Check

**Type:** Utility function  
**Files affected:**
- `src/lib/auth/require-admin.ts` (new)

**Acceptance:**
- [ ] Export: `async function requireAdmin(): Promise<User>`
- [ ] Logic:
  - Call `getCurrentUser()`
  - If not authenticated → throw new Error("Unauthorized: not logged in")
  - If authenticated but role !== 'admin' → throw new Error("Unauthorized: admin role required")
  - Return user object
- [ ] Used in all admin Server Actions (5b, 5c, 5d)
- [ ] Test: vitest unit test mocks getCurrentUser, verifies error throwing

**Dependency:** getCurrentUser() from change 1  
**Estimated:** 20 LOC

---

### Task 5a.8: Create Test Helper `createOrResetAdminUser()`

**Type:** Test infrastructure  
**Files affected:**
- `tests/helpers/admin.ts` (new)

**Acceptance:**
- [ ] Export: `async function createOrResetAdminUser(): Promise<{ id: string, email: string, password: string }>`
- [ ] Idempotent: if admin user exists, return credentials; if not, create via admin API (service_role)
  - Uses `createAdminClient()` helper
  - Calls `admin.auth.admin.createUser({ email, password })`
  - Inserts row in `public.users` with role='admin'
- [ ] Returns: user ID, email, password (for test login)
- [ ] Called in e2e tests beforeEach
- [ ] Test: helper succeeds, user exists in DB

**Dependency:** Task 5a.6 (createAdminClient)  
**Estimated:** 50 LOC

---

### Task 5a.9: E2E Spec [5a-1] — Admin Guard: Unauthenticated User

**Type:** Test  
**Files affected:**
- `e2e/specs/admin/[5a-1]-admin-guard-unauthenticated.spec.ts` (new)

**Acceptance:**
- [ ] Test: unauthenticated user attempts GET /admin/talleres
- [ ] Verify: redirected to /auth/login (no admin content rendered)
- [ ] Test coverage: RF-5a-1 (guard → unauthenticated)

**Dependency:** Task 5a.1 (layout guard)  
**Estimated:** 25 LOC

---

### Task 5a.10: E2E Spec [5a-2] — Admin Guard: Alumno Role Blocked

**Type:** Test  
**Files affected:**
- `e2e/specs/admin/[5a-2]-admin-guard-alumno-blocked.spec.ts` (new)

**Acceptance:**
- [ ] Test: authenticated user with role='alumno' attempts /admin/talleres
- [ ] Verify: redirected to /catalogo (no admin content rendered)
- [ ] Test coverage: RF-5a-1 (guard → non-admin)

**Dependency:** Task 5a.1 (layout guard)  
**Estimated:** 25 LOC

---

### Task 5a.11: E2E Spec [5a-3] — Workshop List Renders

**Type:** Test  
**Files affected:**
- `e2e/specs/admin/[5a-3]-workshop-list-render.spec.ts` (new)

**Acceptance:**
- [ ] Test: admin user logs in, navigates /admin/talleres
- [ ] Setup: beforeEach calls createOrResetAdminUser(), creates 3+ test workshops (via seedWorkshop from change 2)
- [ ] Verify: table displays all workshops with columns (ID, Title, Status, Date, Instructor)
- [ ] Verify: action buttons (Edit, View) present for each row
- [ ] Verify: "New Workshop" button present (deferred link, not yet clickable)
- [ ] Test coverage: RF-5a-3 (workshop list)

**Dependency:** Task 5a.5 (WorkshopTable), Task 5a.8 (createOrResetAdminUser)  
**Estimated:** 50 LOC

---

### Task 5a.12: E2E Spec [5a-4] — Workshop Filter by Status

**Type:** Test  
**Files affected:**
- `e2e/specs/admin/[5a-4]-workshop-filter.spec.ts` (new)

**Acceptance:**
- [ ] Test: admin views workshop list, selects filter "en vivo"
- [ ] Verify: table updates to show only workshops with status='live'
- [ ] Verify: other statuses hidden
- [ ] Verify: filter state persists (optional, may reload page)
- [ ] Test coverage: RF-5a-3 (workshop filter)

**Dependency:** Task 5a.5 (WorkshopTable with filter), Task 5a.3 (fetchWorkshops with filter param)  
**Estimated:** 35 LOC

---

### Task 5a.13: E2E Gate & Verification (Slice 5a)

**Type:** QA  
**Acceptance:**
- [ ] Run: `pnpm build` (no errors)
- [ ] Run: `pnpm lint` (no errors in src/(admin)/, src/components/admin/, src/lib/auth/require-admin.ts, src/lib/supabase/admin.ts)
- [ ] Run: `pnpm test` (vitest: requireAdmin logic, createAdminClient structure, fetchWorkshops query)
- [ ] Run: `pnpm test:e2e [5a-1] [5a-2] [5a-3] [5a-4]` (all 4 specs pass)
- [ ] Verify: no RLS errors (403 or 42501)
- [ ] Verify: no TypeScript errors

**Dependency:** All tasks 5a.1–5a.12  
**Estimated:** (execution time ~7 min, no new code)

---

### Task 5a.14: Commit & PR 5a

**Type:** VCS  
**Acceptance:**
- [ ] Commit message follows conventional: `feat(admin-panel): add admin shell, workshop list, and guard [5a/4]`
- [ ] PR title: "feat: Admin panel shell & workshop list with role guard [5a/4]"
- [ ] PR description: links to spec + design, describes slice 5a scope, lists blocker B-1 (admin user creation)
- [ ] All commits logically grouped or squashed
- [ ] No merge until Jennifer confirms admin user created (B-1 complete)

**Dependency:** All tasks 5a.1–5a.13  
**Estimated:** (mechanical)

---

## Slice 5b Tasks: Workshop CRUD & Cover Upload

**Scope:** Create/edit workshop forms + cover image upload to Storage + Server Actions CRUD + content JSON validation + e2e tests [5b workflows]

**Target:** ~540 lines, autonomous, fully tested, mergeable independently (after 5a merged)

**Gate:** `pnpm build && pnpm lint && pnpm test && pnpm test:e2e [5b]` (scope: CRUD + upload + validation)

**Dependency:** Slice 5a merged to master

---

### Task 5b.1: Extend Zod Schemas for Workshop CRUD

**Type:** Validation schema  
**Files affected:**
- `src/lib/schemas/workshop.ts` (new or extend from change 3)

**Acceptance:**
- [ ] `createWorkshopSchema` exported:
  - title (string, required, max 200 chars)
  - description (string, required)
  - instructor (string, required)
  - date (ISO string, required)
  - duration (number, required, minutes)
  - prerequisites (string, optional)
  - status (enum: 'available'|'live'|'upcoming'|'completed', required)
  - cover (File or URL, optional for create, required at save)
  - content_json (object with sections, exercises, glossary, required)
- [ ] `updateWorkshopSchema` extends create schema (some fields optional)
- [ ] `workshopContentSchema` (nested Zod):
  - sections: array of { type, title, content_json }
  - exercises: array of { title, objective, prompt_text, order }, optional
  - glossary: array of { term, definition, category }, optional
- [ ] All schemas use z.object(), proper string/number constraints
- [ ] Type exports: `export type CreateWorkshopInput = z.infer<typeof createWorkshopSchema>`
- [ ] Test: vitest parse valid inputs, reject invalid (missing required, oversized, bad JSON)

**Dependency:** None  
**Estimated:** 50 LOC

---

### Task 5b.2: Create `WorkshopForm` Component (Create/Edit)

**Type:** UI component  
**Files affected:**
- `src/components/admin/WorkshopForm.tsx` (new, Client Component)

**Acceptance:**
- [ ] Props: mode ('create'|'edit'), initialData (workshop object, optional), onSuccess callback
- [ ] State: formData (controlled inputs), errors (validation errors), saving (boolean)
- [ ] Fields:
  - Input: title, instructor
  - Textarea: description, prerequisites
  - Date input: date picker
  - Select: duration (number), status
  - CoverUpload sub-component (created in 5b.3)
  - Textarea or JSON editor: content_json (parsed/validated)
- [ ] Validation: onChange → validate against Zod schema, display errors
- [ ] Submit: call Server Action createWorkshop (create mode) or updateWorkshop (edit mode)
- [ ] On success: call onSuccess callback (parent handles redirect)
- [ ] Error handling: display field-specific errors
- [ ] Mobile: responsive, buttons stack on mobile
- [ ] Test: Playwright test fill form, submit, verify API call

**Dependency:** Task 5b.1 (Zod schema)  
**Estimated:** 120 LOC

---

### Task 5b.3: Create `CoverUpload` Sub-Component

**Type:** UI component  
**Files affected:**
- `src/components/admin/CoverUpload.tsx` (new, Client Component)

**Acceptance:**
- [ ] Props: workshopId (string, UUID), onUploadSuccess callback, onError callback
- [ ] State: file (File|null), preview (URL|null), uploading (boolean)
- [ ] File input:
  - Accept: image/jpeg, image/png, image/webp
  - Max 5MB validation (client-side)
  - Preview: show image thumbnail after selection
- [ ] Upload logic (in parent form, not automatic):
  - Form submit → call uploadCover() Server Action with file
  - Return public URL
- [ ] Error handling: display size/type validation errors
- [ ] Test: Playwright test select valid file, preview appears; select oversized file, error shown

**Dependency:** Task 5b.4 (uploadCover Server Action)  
**Estimated:** 60 LOC

---

### Task 5b.4: Create Server Action `uploadCover(workshopId, formData)`

**Type:** Server-side function  
**Files affected:**
- `src/app/(admin)/talleres/actions.ts` (extend from 5a.3)

**Acceptance:**
- [ ] Signature: `async function uploadCover(workshopId: string, formData: FormData): Promise<{ success: boolean, url?: string, error?: string }>`
- [ ] Security:
  - Call `requireAdmin()` first (role check)
  - Verify workshopId exists and user has permission
- [ ] Validation:
  - Extract file from formData
  - Validate mimetype (image/jpeg, image/png, image/webp)
  - Validate file size (<5MB)
- [ ] Upload:
  - Create Supabase Storage client (regular auth, not service_role for RLS)
  - Call `supabase.storage.from('workshops').upload(path, file, { upsert: true })`
  - Path format: `{workshopId}/cover.{ext}`
  - Return public URL (CDN via Supabase)
- [ ] Error handling: return error messages (file too large, unsupported type, upload failed)
- [ ] Test: vitest mock Supabase Storage, verify upload call structure

**Dependency:** Task 5a.7 (requireAdmin), Task 5a.6 (createAdminClient optional)  
**Estimated:** 60 LOC

---

### Task 5b.5: Create Server Action `createWorkshop(formData)`

**Type:** Server-side function  
**Files affected:**
- `src/app/(admin)/talleres/actions.ts` (extend)

**Acceptance:**
- [ ] Signature: `async function createWorkshop(formData: FormData): Promise<{ success: boolean, workshopId?: string, error?: string }>`
- [ ] Security:
  - Call `requireAdmin()` first
- [ ] Validation:
  - Parse formData against createWorkshopSchema (Zod)
  - Validate content_json with workshopContentSchema
  - Return validation errors if invalid
- [ ] Database:
  - Insert into workshops table (title, description, instructor, date, duration, status, content_json)
  - Use `createAdminClient()` for service_role (bypasses RLS)
  - Return generated workshop ID
- [ ] Cover upload:
  - If cover file in formData, call uploadCover() and store URL in workshop.cover_url
- [ ] Redirect:
  - Do NOT redirect in Server Action; return success + workshopId
  - Client form calls onSuccess callback, parent does redirect
- [ ] Test: vitest mock DB, verify insert query, validation logic

**Dependency:** Task 5b.1 (Zod schema), Task 5b.4 (uploadCover), Task 5a.6 (createAdminClient)  
**Estimated:** 80 LOC

---

### Task 5b.6: Create Server Action `updateWorkshop(id, formData)` & `deleteWorkshop(id)`

**Type:** Server-side functions  
**Files affected:**
- `src/app/(admin)/talleres/actions.ts` (extend)

**Acceptance:**
- [ ] updateWorkshop:
  - Signature: `async function updateWorkshop(id: string, formData: FormData): Promise<{ success: boolean, error?: string }>`
  - Security: call `requireAdmin()`
  - Validation: parse against updateWorkshopSchema (optional fields)
  - Database: UPDATE workshops WHERE id = $1 (with service_role client)
  - Cover upload: if new cover file, call uploadCover() and update cover_url
  - Return success / error
- [ ] deleteWorkshop:
  - Signature: `async function deleteWorkshop(id: string): Promise<{ success: boolean, error?: string }>`
  - Security: call `requireAdmin()`
  - Database: DELETE FROM workshops WHERE id = $1 (with service_role)
  - Return success / error
- [ ] Test: vitest mock DB, verify UPDATE/DELETE queries

**Dependency:** Task 5b.5 (createWorkshop pattern)  
**Estimated:** 80 LOC

---

### Task 5b.7: Create Pages `/admin/talleres/new` and `/admin/talleres/[id]`

**Type:** Route pages  
**Files affected:**
- `src/app/(admin)/talleres/new/page.tsx` (new)
- `src/app/(admin)/talleres/[id]/page.tsx` (new)

**Acceptance:**
- [ ] /new page:
  - Server Component (wrapper)
  - Pass mode='create' to WorkshopForm
  - On success callback: redirect to /admin/talleres
- [ ] /[id] page:
  - Server Component
  - Fetch existing workshop by ID
  - Pass mode='edit' + initialData to WorkshopForm
  - On success callback: redirect to /admin/talleres
- [ ] Both: render breadcrumbs (Talleres > New, Talleres > [title])
- [ ] Test: Playwright test create form loads, edit form loads with pre-filled data

**Dependency:** Task 5b.2 (WorkshopForm), Task 5b.5/5b.6 (Server Actions)  
**Estimated:** 60 LOC

---

### Task 5b.8: Storage Helper Utility

**Type:** Utility function  
**Files affected:**
- `src/lib/storage.ts` (new or extend)

**Acceptance:**
- [ ] Export: `async function getPublicUrl(bucket: string, path: string): Promise<string>`
- [ ] Logic: construct Supabase Storage public URL from bucket + path
- [ ] Used in uploadCover to return URL
- [ ] Test: vitest mock, verify URL format

**Dependency:** None  
**Estimated:** 15 LOC

---

### Task 5b.9: E2E Spec [5b-1] — Create Workshop with Cover

**Type:** Test  
**Files affected:**
- `e2e/specs/admin/[5b-1]-workshop-create-with-cover.spec.ts` (new)

**Acceptance:**
- [ ] Test: admin logs in, navigates /admin/talleres/new
- [ ] Setup: beforeEach creates admin user (via createOrResetAdminUser)
- [ ] Fill form: title, description, instructor, date, duration, status, select cover image file
- [ ] Click "Create Workshop"
- [ ] Verify: workshop inserted in DB (query via admin client)
- [ ] Verify: cover uploaded to Storage
- [ ] Verify: redirected to /admin/talleres
- [ ] Verify: new workshop appears in list
- [ ] Test coverage: RF-5b-1, RF-5b-2

**Dependency:** Task 5b.5 (createWorkshop), Task 5b.3 (CoverUpload)  
**Estimated:** 60 LOC

---

### Task 5b.10: E2E Spec [5b-2] — Edit Workshop

**Type:** Test  
**Files affected:**
- `e2e/specs/admin/[5b-2]-workshop-edit.spec.ts` (new)

**Acceptance:**
- [ ] Test: admin navigates /admin/talleres/[id] (edit page)
- [ ] Setup: create test workshop via createWorkshop Server Action
- [ ] Verify: form pre-filled with existing data
- [ ] Modify title, description
- [ ] Click "Save"
- [ ] Verify: workshop updated in DB
- [ ] Verify: changes visible in list
- [ ] Test coverage: RF-5b-3

**Dependency:** Task 5b.6 (updateWorkshop)  
**Estimated:** 40 LOC

---

### Task 5b.11: E2E Spec [5b-3] — Delete Workshop with Confirmation

**Type:** Test  
**Files affected:**
- `e2e/specs/admin/[5b-3]-workshop-delete.spec.ts` (new)

**Acceptance:**
- [ ] Test: admin navigates /admin/talleres/[id], clicks "Delete Workshop"
- [ ] Verify: confirmation modal appears
- [ ] Click "Cancel" → modal closes, workshop still in DB
- [ ] Click "Delete Workshop" again, confirm deletion
- [ ] Verify: workshop deleted from DB
- [ ] Verify: redirected to /admin/talleres
- [ ] Verify: workshop no longer in list
- [ ] Test coverage: RF-5b-3

**Dependency:** Task 5b.6 (deleteWorkshop)  
**Estimated:** 40 LOC

---

### Task 5b.12: E2E Spec [5b-4] — Validation Errors (Missing Required, Oversized File)

**Type:** Test  
**Files affected:**
- `e2e/specs/admin/[5b-4]-workshop-validation.spec.ts` (new)

**Acceptance:**
- [ ] Test 1: submit form with missing title → error message "Title is required"
- [ ] Test 2: select cover file >5MB → error "File too large"
- [ ] Test 3: select unsupported file type (e.g., .gif) → error "Unsupported file type"
- [ ] Verify: form not submitted, data retained
- [ ] Test coverage: RF-5b-1, RF-5b-2

**Dependency:** Task 5b.1 (Zod schemas), Task 5b.2 (WorkshopForm validation)  
**Estimated:** 40 LOC

---

### Task 5b.13: E2E Gate & Verification (Slice 5b)

**Type:** QA  
**Acceptance:**
- [ ] Run: `pnpm build` (no errors)
- [ ] Run: `pnpm lint` (no errors in 5b changes)
- [ ] Run: `pnpm test` (vitest: Zod schemas, uploadCover logic, createWorkshop structure)
- [ ] Run: `pnpm test:e2e [5b-1] [5b-2] [5b-3] [5b-4]` (all 4 specs pass)
- [ ] Verify: no RLS errors on workshop writes
- [ ] Verify: Storage RLS allows upload (policy working)
- [ ] Verify: inherited [5a-*] tests still pass (no regressions)

**Dependency:** All tasks 5b.1–5b.12  
**Estimated:** (execution time ~8 min, no new code)

---

### Task 5b.14: Commit & PR 5b

**Type:** VCS  
**Acceptance:**
- [ ] Commit message: `feat(admin-panel): workshop CRUD and cover upload [5b/4]`
- [ ] PR title: "feat: Workshop CRUD & cover image upload [5b/4]"
- [ ] PR description: links to spec + design, depends on 5a merged, lists blocker B-2 (Storage bucket creation)
- [ ] Cherry-pick against 5a merged commit (branch from 5a, rebase if needed)
- [ ] All tests pass

**Dependency:** All tasks 5b.1–5b.13 + slice 5a merged to master  
**Estimated:** (mechanical)

---

## Slice 5c Tasks: Student List & Creation & Key Generation

**Scope:** Student list page with progress formula + create student modal + key generation + Server Actions + e2e tests [5c workflows]

**Target:** ~580 lines, autonomous, fully tested, mergeable independently (after 5b merged)

**Gate:** `pnpm build && pnpm lint && pnpm test && pnpm test:e2e [5c]` (scope: student CRUD + key generation)

**Dependency:** Slice 5b merged to master + getExerciseAwareProgress from change 4

---

### Task 5c.1: Extend Zod Schema for Student Creation

**Type:** Validation schema  
**Files affected:**
- `src/lib/schemas/user.ts` (new or extend)

**Acceptance:**
- [ ] `createStudentSchema` exported:
  - email (string, required, valid email format, unique)
  - passwordTemp (string, required, min 8 chars)
- [ ] Type exports: `export type CreateStudentInput = z.infer<typeof createStudentSchema>`
- [ ] Test: vitest parse valid inputs, reject invalid (bad email, weak password)

**Dependency:** None  
**Estimated:** 20 LOC

---

### Task 5c.2: Create `/admin/talleres/[id]/alumnos/page.tsx` (Student List)

**Type:** Route + Server Component  
**Files affected:**
- `src/app/(admin)/talleres/[id]/alumnos/page.tsx` (new)

**Acceptance:**
- [ ] Server Component: fetch students for workshop via fetchStudents() Server Action
- [ ] Fetch progress data: call getExerciseAwareProgress for each student (from change 4)
- [ ] Props: workshopId (from [id] param)
- [ ] Pass students + progress to Client wrapper (StudentList component, 5c.3)
- [ ] Breadcrumbs: "Talleres > [workshop title] > Alumnos"
- [ ] Test: Playwright test admin navigates to /admin/talleres/[id]/alumnos, students list loads

**Dependency:** Task 5c.4 (fetchStudents), change 4's getExerciseAwareProgress  
**Estimated:** 50 LOC

---

### Task 5c.3: Create `StudentList` Component

**Type:** UI component  
**Files affected:**
- `src/components/admin/StudentList.tsx` (new, Client Component)

**Acceptance:**
- [ ] Props: students (array), progressData (map of userId → progress %), workshopId (string), onStudentAdded callback
- [ ] Render: table with columns (Email, Name, Progress %, Actions)
- [ ] Progress column: displays percentage calculated by getExerciseAwareProgress
- [ ] Actions: Edit button (deferred to v1.1), Remove button (delete student)
- [ ] Button "New Student" → opens CreateStudentModal (5c.4)
- [ ] Modal success → onStudentAdded callback → parent refetches students list
- [ ] Mobile: table responsive
- [ ] Test: Playwright test table renders with correct data, New Student button opens modal

**Dependency:** Task 5c.4 (CreateStudentModal)  
**Estimated:** 80 LOC

---

### Task 5c.4: Create `CreateStudentModal` Component

**Type:** UI component  
**Files affected:**
- `src/components/admin/CreateStudentModal.tsx` (new, Client Component)

**Acceptance:**
- [ ] Props: workshopId (string), isOpen (boolean), onClose callback, onSuccess callback
- [ ] Modal: form with fields (Email, Password)
- [ ] Validation: onChange → validate against createStudentSchema (Zod)
- [ ] Submit: call createStudent() Server Action
- [ ] On success:
  - Display plaintext key ONE TIME in modal (last 4 chars also shown in masked format)
  - Copy button to copy key to clipboard
  - "Confirm" button to close modal
  - Key is NOT displayed again after modal closes (security)
- [ ] On error: display error message (duplicate email, weak password, auth error)
- [ ] Mobile: modal responsive
- [ ] Test: Playwright test fill form, submit, key displayed once, close modal, key gone

**Dependency:** Task 5c.5 (createStudent Server Action)  
**Estimated:** 80 LOC

---

### Task 5c.5: Create Server Action `createStudent(workshopId, email, passwordTemp)`

**Type:** Server-side function  
**Files affected:**
- `src/app/(admin)/talleres/[id]/alumnos/actions.ts` (new)

**Acceptance:**
- [ ] Signature: `async function createStudent(workshopId: string, email: string, passwordTemp: string): Promise<{ success: boolean, userId?: string, accessKey?: string, error?: string }>`
- [ ] Security:
  - Call `requireAdmin()` first
  - Verify workshopId exists and admin can access it
- [ ] Validation:
  - Parse input against createStudentSchema (Zod)
  - Check email uniqueness (select from auth.users)
- [ ] Create auth user:
  - Use createAdminClient() + admin.auth.admin.createUser()
  - Pass email, password, confirm email
  - Catch duplicate email error, return "Email already exists"
- [ ] Create public.users row:
  - user_id = auth user ID
  - email, name (optional, default to email prefix)
  - role = 'alumno'
  - password_changed = false (forces change on first login)
- [ ] Generate access key:
  - Call generateAccessKey() (defined in 5c.6)
  - Create workshop_access row (user_id, workshop_id, access_key plaintext, expires_at = now + 90 days)
  - Hash + salt added in 5d (not yet)
- [ ] Return:
  - success: true
  - accessKey: plaintext key (returned ONE TIME only for display)
  - Do NOT save plaintext in response; only DB
- [ ] Test: vitest mock Supabase, verify auth.users.create + users INSERT + workshop_access INSERT

**Dependency:** Task 5c.1 (Zod schema), Task 5a.7 (requireAdmin), Task 5c.6 (generateAccessKey)  
**Estimated:** 100 LOC

---

### Task 5c.6: Server Action `generateAccessKey(userId, workshopId)`

**Type:** Server-side function  
**Files affected:**
- `src/app/(admin)/talleres/[id]/alumnos/actions.ts` (extend from 5c.5)

**Acceptance:**
- [ ] Signature: `async function generateAccessKey(userId: string, workshopId: string): Promise<{ success: boolean, key: string, error?: string }>`
- [ ] Security: call `requireAdmin()` first
- [ ] Key generation:
  - Call generateAccessKeyString() utility (5c.7)
  - Format: alphanumeric, pattern like "RAG-1234-AB5X" (14 chars, ~50 bits entropy)
- [ ] Database:
  - Upsert into workshop_access (user_id, workshop_id, access_key)
  - expires_at = now + 90 days
  - (hash + salt added in 5d)
- [ ] Return: plaintext key (for modal display)
- [ ] Test: vitest mock, verify key format, DB upsert call

**Dependency:** Task 5c.7 (generateAccessKeyString utility)  
**Estimated:** 50 LOC

---

### Task 5c.7: Utility `generateAccessKeyString()`

**Type:** Utility function (later extended in 5d with hash functions)  
**Files affected:**
- `src/lib/crypto/access-key.ts` (new, or placeholder for 5d crypto module)

**Acceptance:**
- [ ] Export: `function generateAccessKeyString(): string`
- [ ] Logic: generate random alphanumeric key in format "RAG-1234-AB5X" (or similar)
- [ ] Entropy: ~50 bits (sufficient for single-use tokens)
- [ ] Test: vitest generate 100 keys, verify format + uniqueness

**Dependency:** None  
**Estimated:** 20 LOC (placeholder; extended in 5d with hash/verify functions)

---

### Task 5c.8: Create `KeyTable` Component

**Type:** UI component  
**Files affected:**
- `src/components/admin/KeyTable.tsx` (new, Client Component)

**Acceptance:**
- [ ] Props: keys (array of { userId, studentEmail, studentName, maskedKey (last 4 chars), status, createdAt }), onRegenerateKey callback
- [ ] Render: table with columns (Student Email, Student Name, Key (masked), Status, Created, Actions)
- [ ] Status column: "Pending" (not redeemed), "Redeemed" (redeemed_at set), "Expired" (expires_at < now)
- [ ] Actions column:
  - If status='Pending': "Regenerate Key" button → calls onRegenerateKey → refreshes list
  - If status='Redeemed': no action (read-only)
  - If status='Expired': "Regenerate Key" button
- [ ] Mobile: table responsive
- [ ] Test: Playwright test table renders, regenerate button works

**Dependency:** Task 5c.5 (createStudent returns access_key)  
**Estimated:** 60 LOC

---

### Task 5c.9: Helper `fetchStudents(workshopId)` Server Action

**Type:** Server-side function  
**Files affected:**
- `src/app/(admin)/talleres/[id]/alumnos/actions.ts` (extend)

**Acceptance:**
- [ ] Signature: `async function fetchStudents(workshopId: string): Promise<Student[]>`
- [ ] Query: SELECT user_id, email, name FROM users WHERE (implicit: users in this workshop via workshop_access)
- [ ] Join: with workshop_access to get access_key status + created_at
- [ ] Return: array of { userId, email, name, progressPercent, accessKeyStatus, createdAt }
- [ ] Test: vitest mock DB, verify query

**Dependency:** None  
**Estimated:** 30 LOC

---

### Task 5c.10: Test Helper `createPlaintextKey()` and `createHashedKey()` (Prepared for 5d)

**Type:** Test infrastructure  
**Files affected:**
- `tests/helpers/seed-keys.ts` (new)

**Acceptance:**
- [ ] Export: `async function createPlaintextKey(userId: string, workshopId: string): Promise<string>`
  - Creates workshop_access row with plaintext access_key (no hash/salt)
  - Returns plaintext key for testing
  - Used in 5d backward-compat tests
- [ ] Export: `async function createHashedKey(userId: string, workshopId: string): Promise<string>`
  - Creates workshop_access row with hash + salt (placeholder in 5c; fully implemented in 5d)
  - Returns plaintext key (for test setup)
  - Used in 5c+ tests
- [ ] Both idempotent (delete + insert)
- [ ] Test: vitest verify keys are created in DB

**Dependency:** None (placeholder; fully wired in 5d)  
**Estimated:** 50 LOC

---

### Task 5c.11: E2E Spec [5c-1] — Create Student

**Type:** Test  
**Files affected:**
- `e2e/specs/admin/[5c-1]-create-student.spec.ts` (new)

**Acceptance:**
- [ ] Test: admin navigates /admin/talleres/[id]/alumnos
- [ ] Setup: create test workshop
- [ ] Click "New Student" button
- [ ] Fill form: email, password
- [ ] Click "Create"
- [ ] Verify: modal displays plaintext key (e.g., "RAG-1234-AB5X")
- [ ] Verify: key can be copied to clipboard
- [ ] Close modal
- [ ] Verify: student appears in table with status "Pending"
- [ ] Verify: key no longer visible in UI (security)
- [ ] Test coverage: RF-5c-2, RF-5c-3

**Dependency:** Task 5c.4 (CreateStudentModal), Task 5c.5 (createStudent)  
**Estimated:** 60 LOC

---

### Task 5c.12: E2E Spec [5c-2] — Student Table Displays Progress

**Type:** Test  
**Files affected:**
- `e2e/specs/admin/[5c-2]-student-progress.spec.ts` (new)

**Acceptance:**
- [ ] Test: admin navigates /admin/talleres/[id]/alumnos
- [ ] Setup: create student, update student's exercise progress via DB (simulate completion)
- [ ] Verify: table shows correct progress % for student (via getExerciseAwareProgress)
- [ ] Progress updates without page reload (or after refresh)
- [ ] Test coverage: RF-5c-1

**Dependency:** Task 5c.2 (page.tsx fetches progress), change 4's getExerciseAwareProgress  
**Estimated:** 40 LOC

---

### Task 5c.13: E2E Spec [5c-3] — Duplicate Email Validation

**Type:** Test  
**Files affected:**
- `e2e/specs/admin/[5c-3]-student-duplicate-email.spec.ts` (new)

**Acceptance:**
- [ ] Test: admin tries to create 2 students with same email
- [ ] First creation succeeds
- [ ] Second creation fails: "Email already exists"
- [ ] Form not submitted, data retained
- [ ] Test coverage: RF-5c-2

**Dependency:** Task 5c.5 (createStudent validates email)  
**Estimated:** 35 LOC

---

### Task 5c.14: E2E Gate & Verification (Slice 5c)

**Type:** QA  
**Acceptance:**
- [ ] Run: `pnpm build` (no errors)
- [ ] Run: `pnpm lint` (no errors in 5c changes)
- [ ] Run: `pnpm test` (vitest: Zod schemas, generateAccessKeyString format, seed helpers)
- [ ] Run: `pnpm test:e2e [5c-1] [5c-2] [5c-3]` (all 3 specs pass)
- [ ] Verify: inherited [5a-*], [5b-*] tests still pass (no regressions)
- [ ] Verify: progress % calculation correct (exercise-aware formula from change 4)

**Dependency:** All tasks 5c.1–5c.13  
**Estimated:** (execution time ~8 min, no new code)

---

### Task 5c.15: Commit & PR 5c

**Type:** VCS  
**Acceptance:**
- [ ] Commit message: `feat(admin-panel): student management and key generation [5c/4]`
- [ ] PR title: "feat: Student list & creation & key generation [5c/4]"
- [ ] PR description: links to spec + design, depends on 5b merged, lists blocker B-3 (test helpers)
- [ ] Cherry-pick against 5b merged commit
- [ ] All tests pass

**Dependency:** All tasks 5c.1–5c.14 + slice 5b merged to master  
**Estimated:** (mechanical)

---

## Slice 5d Tasks: Hash Migration & redeemKey Refactor

**Scope:** SQL migration (add hash+salt columns, backfill), SHA-256 hash utility functions, refactor redeemKey() with hash verification + fallback legacy, test fixtures with both paths, e2e tests [5d security]

**Target:** ~290 lines, critical security, autonomous, mergeable independently (after 5c merged)

**Gate:** `pnpm build && pnpm lint && pnpm test && pnpm test:e2e [5d]` (scope: migration + hash verification + backward-compat)

**Dependency:** Slice 5c merged to master + change 2 (archived redeemKey) must be in master before 5d PR creation

---

### Task 5d.1: Create SQL Migration File

**Type:** Database infrastructure  
**Files affected:**
- `supabase/migrations/20260616_add_key_hash.sql` (new, timestamp before apply runs)

**Acceptance:**
- [ ] File exists with sequential timestamp (after change 4 migrations)
- [ ] Migration content (from design D-5):
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
- [ ] Columns created: access_key_salt (UUID), access_key_hash (TEXT)
- [ ] Backfill: all existing plaintext keys receive salt + hash
- [ ] Constraints: NOT NULL on both columns
- [ ] Rollback: migration is idempotent / reversible
- [ ] Test: manually run on local Supabase, verify table schema post-migration

**Dependency:** None (migration file only)  
**Estimated:** 40 LOC

---

### Task 5d.2: Create Crypto Utility Module `src/lib/crypto/access-key.ts`

**Type:** Utility functions  
**Files affected:**
- `src/lib/crypto/access-key.ts` (extend from 5c.7 placeholder)

**Acceptance:**
- [ ] Functions exported:
  1. `generateAccessKeyString(): string` — generate key in format "RAG-1234-AB5X" (from 5c.7, reuse)
  2. `hashAccessKey(plaintext: string, salt: string): string` — SHA-256(salt + plaintext) → hex string
  3. `verifyAccessKey(plaintext: string, hash: string, salt: string): boolean` — computed === hash
- [ ] Crypto implementation:
  - Use Node.js builtin `crypto.createHash('sha256')`
  - No external dependencies (Zod already in project)
- [ ] Performance: hash/verify complete in <100ms (per RNF-2)
- [ ] Test: vitest test hash function, verify function, edge cases (empty key, mismatched salt)

**Dependency:** Task 5c.7 (generateAccessKeyString existing)  
**Estimated:** 50 LOC

---

### Task 5d.3: Extend Test Helpers with Precalculated Key Fixtures

**Type:** Test infrastructure  
**Files affected:**
- `tests/helpers/seed-keys.ts` (extend from 5c.10)

**Acceptance:**
- [ ] Update `createHashedKey()`:
  - Now fully implemented with hash + salt
  - Uses hashAccessKey() from 5d.2
  - Precalculates salt + hash for deterministic testing
  - Returns plaintext key (for test setup, not stored in response)
- [ ] Update `createPlaintextKey()`:
  - Explicitly creates row with plaintext access_key (no hash/salt)
  - Used in backward-compat tests
- [ ] Both idempotent (delete existing, insert new)
- [ ] Test: vitest verify keys are hashed correctly in DB

**Dependency:** Task 5d.2 (hashAccessKey)  
**Estimated:** 30 LOC

---

### Task 5d.4: Refactor `redeemKey()` in Archived Change 2

**Type:** Server-side function refactor  
**Files affected:**
- `src/app/(authenticated)/catalogo/actions.ts` (modify from change 2)

**Acceptance:**
- [ ] Function signature: unchanged (same public interface)
- [ ] New logic:
  - Fetch workshop_access row by (user_id, access_key, workshop_id) — wait, access_key is plaintext input
  - Actually: fetch by key HASH (need to iterate existing keys? NO — use plaintext input, hash it, compare hashes)
  - **Correct approach:**
    1. Fetch workshop_access WHERE user_id = $1 AND workshop_id = $2
    2. If access_key_hash IS NOT NULL: verify using verifyAccessKey(input, hash, salt)
    3. If access_key_hash IS NULL (legacy): fallback to plaintext comparison, log warning
    4. If verified: update redeemed_at = now, return success
    5. If not verified: return error
- [ ] Error handling: "Key not found", "Key already redeemed", "Key expired"
- [ ] Logging: warn if plaintext key used (legacy fallback)
- [ ] Test: vitest mock both paths (hash + plaintext)

**Dependency:** Task 5d.2 (verifyAccessKey), Task 5d.3 (test fixtures with both key types)  
**Estimated:** 50 LOC

---

### Task 5d.5: E2E Spec [5d-1] — Redeem Hashed Key (New Flow)

**Type:** Test  
**Files affected:**
- `e2e/specs/admin/[5d-1]-redeem-hashed-key.spec.ts` (new)

**Acceptance:**
- [ ] Test: student logs in, navigates /catalogo
- [ ] Setup: admin creates student in 5c, gets plaintext key (hashed in DB per migration)
- [ ] Student enters key in modal
- [ ] Click "Unlock"
- [ ] Verify: redeemKey() executes, verifies hash
- [ ] Verify: redeemed_at updated in DB
- [ ] Verify: workshop content visible
- [ ] Test coverage: RF-5d-3 (hash verification)

**Dependency:** Task 5d.4 (redeemKey refactor), Task 5d.2 (hashAccessKey)  
**Estimated:** 40 LOC

---

### Task 5d.6: E2E Spec [5d-2] — Redeem Plaintext Key (Legacy Fallback)

**Type:** Test  
**Files affected:**
- `e2e/specs/admin/[5d-2]-redeem-plaintext-key-legacy.spec.ts` (new)

**Acceptance:**
- [ ] Test: student logs in with old plaintext key (from change 2-4, before migration)
- [ ] Setup: createPlaintextKey() helper creates legacy key (no hash)
- [ ] Student enters key in modal
- [ ] Click "Unlock"
- [ ] Verify: redeemKey() detects missing hash, falls back to plaintext comparison
- [ ] Verify: warning logged
- [ ] Verify: redeemed_at updated
- [ ] Verify: workshop content visible (backward-compat works)
- [ ] Test coverage: RF-5d-3 (fallback to plaintext)

**Dependency:** Task 5d.4 (redeemKey fallback), Task 5d.3 (createPlaintextKey fixture)  
**Estimated:** 40 LOC

---

### Task 5d.7: E2E Spec [5d-3] — Wrong Key Rejected

**Type:** Test  
**Files affected:**
- `e2e/specs/admin/[5d-3]-wrong-key-rejected.spec.ts` (new)

**Acceptance:**
- [ ] Test: student enters incorrect key
- [ ] Verify: redeemKey() returns error "Clave inválida"
- [ ] Verify: redeemed_at NOT updated
- [ ] Verify: workshop content NOT visible
- [ ] Test both: hashed key with wrong plaintext, plaintext key with wrong input
- [ ] Test coverage: RF-5d-3 (verification fails)

**Dependency:** Task 5d.4 (redeemKey error handling)  
**Estimated:** 30 LOC

---

### Task 5d.8: E2E Spec [5d-4] — Migration Backfill Correctness

**Type:** Test  
**Files affected:**
- `e2e/specs/admin/[5d-4]-migration-backfill.spec.ts` (new)

**Acceptance:**
- [ ] Test: verify migration ran (access_key_hash and access_key_salt columns exist)
- [ ] Setup: create plaintext keys BEFORE 5d apply, verify no hash (access_key_hash IS NULL initially)
- [ ] Apply 5d (migration runs)
- [ ] Verify: all existing plaintext keys now have hash + salt (access_key_hash IS NOT NULL)
- [ ] Verify: hash is correctly computed (sample key: hash(salt + plaintext) matches DB value)
- [ ] Test coverage: RF-5d-1 (migration adds columns), RF-5d-1 (backfill correctness)

**Dependency:** Task 5d.1 (migration), Task 5d.2 (hashAccessKey for verification)  
**Estimated:** 40 LOC

---

### Task 5d.9: E2E Gate & Verification (Slice 5d)

**Type:** QA  
**Acceptance:**
- [ ] Run: `pnpm build` (no errors)
- [ ] Run: `pnpm lint` (no errors in 5d changes)
- [ ] Run: `pnpm test` (vitest: hashAccessKey, verifyAccessKey, redeemKey logic, edge cases)
- [ ] Run: `pnpm test:e2e [5d-1] [5d-2] [5d-3] [5d-4]` (all 4 specs pass)
- [ ] Verify: inherited [5a-*], [5b-*], [5c-*] tests still pass (no regressions)
- [ ] Verify: full e2e suite ~50-55 min serial (acceptable, no parallelization)
- [ ] Verify: no RLS leaks (users cannot see other workshop keys)
- [ ] CRITICAL: no 42501 (RLS) or 403 errors on redeemKey

**Dependency:** All tasks 5d.1–5d.8  
**Estimated:** (execution time ~10 min, no new code)

---

### Task 5d.10: Commit & PR 5d

**Type:** VCS  
**Acceptance:**
- [ ] Commit message: `feat(admin-panel): hash migration, crypto utilities, redeemKey refactor [5d/4]`
- [ ] PR title: "feat: Hash migration & secure key redemption [5d/4] — CRITICAL SECURITY"
- [ ] PR description: links to spec + design, depends on 5c merged, describes hash algorithm + fallback logic, calls out risk (touches archived code change 2), requests thorough review
- [ ] Cherry-pick against 5c merged commit
- [ ] All tests pass (both hashed + plaintext paths tested)
- [ ] MERGE REQUIRES EXPLICIT APPROVAL (critical security change)

**Dependency:** All tasks 5d.1–5d.9 + slice 5c merged to master + change 2 in master  
**Estimated:** (mechanical, high-risk review)

---

## Task Dependencies & Parallelization

### Slice 5a Dependency Graph

```
5a.1 (layout guard)
  ↓
5a.3 (fetchWorkshops Server Action)
  ↓
5a.5 (WorkshopTable)
  ↓
5a.2 (page.tsx)

5a.1 → 5a.4 (AdminSidebar + AdminLayout)

5a.6 (createAdminClient) — standalone
5a.7 (requireAdmin) — standalone

5a.8 (createOrResetAdminUser) → depends on 5a.6
  ↓
5a.9, 5a.10 (guard tests) — parallel

5a.8 → 5a.11 (workshop list test)

5a.11, 5a.12 → 5a.13 (gate)
  ↓
5a.14 (PR)
```

**Parallelizable:** 5a.6, 5a.7 can start immediately; 5a.9 + 5a.10 can start after 5a.8.

### Slice 5b Dependency Graph

```
5a.merged → 5b.1 (Zod schemas)
               ↓
            5b.2 (WorkshopForm)
               ↓
            5b.7 (pages)

5b.1 → 5b.4 (uploadCover Server Action)
          ↓
       5b.3 (CoverUpload component)
          ↓
       5b.2 (form includes upload)

5b.1 → 5b.5 (createWorkshop)
          ↓
       5b.6 (updateWorkshop, deleteWorkshop)
          ↓
       5b.7 (pages call actions)

5b.8 (storage helper) — independent

5b.2–5b.7 → 5b.9–5b.12 (E2E tests) — parallel
               ↓
            5b.13 (gate)
               ↓
            5b.14 (PR)
```

**Parallelizable:** 5b.8 can start anytime; 5b.9–5b.12 tests can start after 5b.7 (pages exist).

### Slice 5c Dependency Graph

```
5b.merged → 5c.1 (Zod schema)
               ↓
            5c.4 (CreateStudentModal)
               ↓
            5c.5 (createStudent Server Action)
               ↓
            5c.9 (fetchStudents helper)

5c.5 → 5c.6 (generateAccessKey)
       5c.7 (generateAccessKeyString utility)
          ↓
       5c.10 (seed helpers: createPlaintextKey, createHashedKey)

5c.9 → 5c.2 (page.tsx) → 5c.3 (StudentList)

5c.5–5c.8 → 5c.11–5c.13 (E2E tests) — parallel
               ↓
            5c.14 (gate)
               ↓
            5c.15 (PR)
```

**Parallelizable:** 5c.7 (utility) and 5c.10 (helpers) can start after 5c.1; 5c.11–5c.13 can start after 5c.8 (KeyTable exists).

### Slice 5d Dependency Graph

```
5c.merged → 5d.1 (migration file)
               ↓
            5d.2 (crypto module)
               ↓
            5d.3 (seed helpers extend)
               ↓
            5d.4 (redeemKey refactor)

5d.2 → 5d.4 (verifyAccessKey)

5d.1–5d.4 → 5d.5–5d.8 (E2E tests) — parallel
               ↓
            5d.9 (gate)
               ↓
            5d.10 (PR — CRITICAL REVIEW)
```

**Parallelizable:** 5d.5–5d.8 tests can start after 5d.4 (redeemKey refactored).

---

## Commit Strategy

### Slice 5a Commits (Logical Grouping)

1. **Layout + Guard Infrastructure:**
   - `src/app/(admin)/layout.tsx`
   - `src/lib/auth/require-admin.ts`
   - `src/lib/supabase/admin.ts`
   - Message: `chore(admin-panel): add layout guard and admin client/role check helpers [5a]`

2. **Workshop List Components + Server Action:**
   - `src/app/(admin)/talleres/page.tsx`
   - `src/app/(admin)/talleres/actions.ts` (fetchWorkshops)
   - `src/components/admin/AdminSidebar.tsx`
   - `src/components/admin/AdminLayout.tsx`
   - `src/components/admin/WorkshopTable.tsx`
   - Message: `feat(admin-panel): workshop list with guard and navigation [5a]`

3. **Test Infrastructure + E2E:**
   - `tests/helpers/admin.ts`
   - `e2e/specs/admin/[5a-*].spec.ts` (4 specs)
   - Message: `test(admin-panel): add admin helper and guard/list e2e tests [5a]`

### Slice 5b Commits (Logical Grouping)

1. **Workshop CRUD Schemas + Server Actions:**
   - `src/lib/schemas/workshop.ts`
   - `src/lib/storage.ts`
   - `src/app/(admin)/talleres/actions.ts` (extend: uploadCover, createWorkshop, updateWorkshop, deleteWorkshop)
   - Message: `feat(admin-panel): workshop CRUD with Zod validation and storage upload [5b]`

2. **Workshop Form Components:**
   - `src/components/admin/WorkshopForm.tsx`
   - `src/components/admin/CoverUpload.tsx`
   - `src/app/(admin)/talleres/new/page.tsx`
   - `src/app/(admin)/talleres/[id]/page.tsx`
   - Message: `feat(admin-panel): workshop create/edit forms and cover upload UI [5b]`

3. **E2E Tests:**
   - `e2e/specs/admin/[5b-*].spec.ts` (4 specs)
   - Message: `test(admin-panel): CRUD and upload e2e tests [5b]`

### Slice 5c Commits (Logical Grouping)

1. **Student CRUD Schemas + Server Actions:**
   - `src/lib/schemas/user.ts`
   - `src/app/(admin)/talleres/[id]/alumnos/actions.ts` (createStudent, generateAccessKey, fetchStudents)
   - `src/lib/crypto/access-key.ts` (generateAccessKeyString)
   - Message: `feat(admin-panel): student creation and access key generation [5c]`

2. **Student List + Modal Components:**
   - `src/components/admin/StudentList.tsx`
   - `src/components/admin/CreateStudentModal.tsx`
   - `src/components/admin/KeyTable.tsx`
   - `src/app/(admin)/talleres/[id]/alumnos/page.tsx`
   - Message: `feat(admin-panel): student list and creation modal with key display [5c]`

3. **Test Helpers + E2E:**
   - `tests/helpers/seed-keys.ts`
   - `e2e/specs/admin/[5c-*].spec.ts` (3 specs)
   - Message: `test(admin-panel): student management and key generation e2e tests [5c]`

### Slice 5d Commits (Logical Grouping — CRITICAL REVIEW)

1. **Migration + Crypto Utilities:**
   - `supabase/migrations/20260616_add_key_hash.sql`
   - `src/lib/crypto/access-key.ts` (extend: hashAccessKey, verifyAccessKey)
   - Message: `chore(admin-panel): add hash migration and SHA-256 crypto utilities [5d]`

2. **RedeemKey Refactor (Archived Change 2):**
   - `src/app/(authenticated)/catalogo/actions.ts` (modify redeemKey)
   - Message: `refactor(admin-panel): update redeemKey to verify hashed keys with fallback [5d] — CRITICAL SECURITY`

3. **Test Fixtures + E2E:**
   - `tests/helpers/seed-keys.ts` (extend with precalculated fixtures)
   - `e2e/specs/admin/[5d-*].spec.ts` (4 specs covering hash + plaintext paths)
   - Message: `test(admin-panel): hash migration and redemption e2e tests [5d]`

---

## Risks & Mitigations (Cached from Design)

### Risk 1: Touching Archived Code (change 2 — redeemKey) — HIGH

**Description:** Slice 5d refactors `redeemKey()` in archived change 2. If merge is dirty or logic broken, all student key redemption fails.

**Mitigation:**
- PR 5d focused ONLY on hash verification + fallback
- Test fixtures cover plaintext legacy + hashed new paths exhaustively
- Triple-review required (author + peer + security)
- Rollback plan: revert 5d, leave plaintext keys until v1.1 polish

**Task Owner:** 5d.4, 5d.5–5d.8

---

### Risk 2: Storage RLS Misconfiguration — MEDIUM

**Description:** Bucket policy blocks INSERT admin; uploadCover fails.

**Mitigation:**
- Policy verified in design D-8
- E2E test 5b.9 validates: admin uploads → file appears → URL works
- Fallback: if RLS blocks, use storage bypass temporarily (revisit post-v1)

**Task Owner:** Task 5b.4, 5b.9

---

### Risk 3: User Creation in auth.users Quota — MEDIUM

**Description:** Server Action createStudent calls admin.auth.admin.createUser(). If quota exceeded or API misconfigured, fails.

**Mitigation:**
- Test helper creates ~5 test users in beforeEach; fail fast if quota
- Error handling in Server Action: clear message "Cannot create user, contact support"
- Do NOT stress-test with 1000 users; limit e2e to 5-10

**Task Owner:** Task 5c.5, 5c.11

---

### Risk 4: Hash Migration Correctness — HIGH

**Description:** Migration SQL backfill calculates hash. If SQL error, claves stay unhashed, redeemKey fails.

**Mitigation:**
- Migration written + tested locally (Supabase CLI) BEFORE merge
- SQL verification: insert plaintext key → run migration → verify hash computed correctly
- Rollback SQL included in migration (DROP columns if needed)
- Test 5d.8: verify backfill correctness (sample key hash matches expectation)

**Task Owner:** Task 5d.1, 5d.8

---

### Risk 5: JSON Content Schema Too Strict — LOW

**Description:** Zod schema rejects valid admin input.

**Mitigation:**
- Schema from change 3 (workshopContentSchema); change 5 reuses
- Specific error messages to admin ("Sections: 'title' required in item 3")
- If too strict, loosen schema + test (deferred to polish if needed)

**Task Owner:** Task 5b.1

---

### Risk 6: E2E Suite Timeout — MEDIUM

**Description:** Suite ~38 min now. 5a+5b+5c+5d add ~40-45 specs → ~50-55 min total. If infra slow, timeout.

**Mitigation:**
- Admin specs are happy-path + security (not exhaustive UI)
- Reuse helpers (createOrResetAdminUser, seed workshops) to avoid duplication
- If timeout, move UI detail specs to polish/v1.1
- Monitor suite duration in CI post-merge

**Task Owner:** Each slice's e2e task

---

### Risk 7: Backward-Compat Plaintext Keys — LOW

**Description:** redeemKey fallback to plaintext doesn't work; old alumnos can't redeem.

**Mitigation:**
- Test fixture createPlaintextKey creates legacy key (no hash)
- Test 5d.6: redeemKey with plaintext input must work
- Log warning when plaintext used (helps ID legacy keys)

**Task Owner:** Task 5d.3, 5d.6

---

## Divergence Reconciliation Summary

**Spec vs Design:**

All major divergences reconciled:
- Spec: "fetchWorkshops(filter)" Server Action — **Design:** confirmed D-1 route group, D-3 server-side guard
- Spec: "Admin layout with sidebar navigation" — **Design:** detailed D-2 (vertical sidebar with collapse on mobile)
- Spec: "createWorkshop form" — **Design:** D-2 specifies WorkshopForm structure, form fields, validation
- Spec: "Upload cover to Storage" — **Design:** D-8 bucket policies, upload Server Action, path structure
- Spec: "createStudent Server Action" — **Design:** D-10 covers signature, auth.users creation, public.users row
- Spec: "Hash migration + refactor redeemKey" — **Design:** D-5 (SQL migration), D-6 (hash utility), D-7 (redeemKey logic)

**No unresolved conflicts.** Design is more prescriptive; spec is functional. Tasks align with both.

---

## Acceptance & Sign-Off

**Spec → Tasks Alignment:**
- [x] RF-5a-1 (admin guard) → Tasks 5a.1, 5a.9–5a.10
- [x] RF-5a-2 (sidebar) → Task 5a.4
- [x] RF-5a-3 (workshop list) → Tasks 5a.2–5a.3, 5a.5, 5a.11–5a.12
- [x] RF-5b-1 (create form) → Tasks 5b.1–5b.2, 5b.7, 5b.9
- [x] RF-5b-2 (upload cover) → Tasks 5b.3–5b.4, 5b.9
- [x] RF-5b-3 (edit form) → Tasks 5b.6–5b.7, 5b.10
- [x] RF-5b-4 (content JSON validation) → Task 5b.1, 5b.5
- [x] RF-5c-1 (student list) → Tasks 5c.2–5c.3, 5c.12
- [x] RF-5c-2 (create student) → Tasks 5c.4–5c.5, 5c.11
- [x] RF-5c-3 (key generation) → Tasks 5c.6–5c.8, 5c.11
- [x] RF-5d-1 (hash migration) → Tasks 5d.1, 5d.8
- [x] RF-5d-2 (SHA-256 utility) → Task 5d.2
- [x] RF-5d-3 (refactor redeemKey) → Tasks 5d.4–5d.7

**Design → Tasks Alignment:**
- [x] D-1 (route structure) → Task 5a.1
- [x] D-2 (sidebar layout) → Task 5a.4
- [x] D-3 (server-side guard) → Task 5a.1
- [x] D-4 (service_role pattern) → Tasks 5a.6–5a.7
- [x] D-5 (SQL migration) → Task 5d.1
- [x] D-6 (hash functions) → Task 5d.2
- [x] D-7 (redeemKey refactor) → Task 5d.4
- [x] D-8 (Storage RLS) → Task 5b.4
- [x] D-9 (components) → Tasks 5a.4, 5b.2, 5c.3–5c.4
- [x] D-10 (createStudent) → Task 5c.5
- [x] D-11 (content validation) → Task 5b.1
- [x] D-12 (test helper) → Task 5a.8
- [x] D-13 (test fixtures) → Task 5d.3
- [x] D-14 (LOC estimation) → all tasks respect estimates

**Pre-Apply Blockers:**
- [x] B-1 (admin user creation) → Task 5a.8 requires Jennifer action
- [x] B-2 (Storage bucket) → Task 5b.4 requires Jennifer action
- [x] B-3 (test helpers) → Tasks 5a.8, 5c.7, 5d.3 prepare helpers
- [x] B-4 (git workflow) → 5d depends on 5c merged

**Ready for apply.** All tasks scoped, dependencies mapped, risks cached, committed strategy defined.

---

## Next Recommended Phases

1. **sdd-apply** (batch 1, slice 5a) — Implement tasks 5a.1–5a.14, test, PR to master
2. **Jennifer** (manual step) — Create admin user in Supabase (B-1)
3. **E2E Gate 5a** — `pnpm test:e2e [5a-*]` (task 5a.13)
4. **PR 5a Merge** (task 5a.14)
5. **sdd-apply** (batch 2, slice 5b) — Implement tasks 5b.1–5b.14, test, PR to master
6. **Jennifer** (manual step) — Create Storage bucket `workshops` with RLS (B-2)
7. **E2E Gate 5b** — `pnpm test:e2e [5a-*] [5b-*]` full suite (task 5b.13)
8. **PR 5b Merge** (task 5b.14)
9. **sdd-apply** (batch 3, slice 5c) — Implement tasks 5c.1–5c.15, test, PR to master
10. **E2E Gate 5c** — `pnpm test:e2e [5a-*] [5b-*] [5c-*]` (task 5c.14)
11. **PR 5c Merge** (task 5c.15)
12. **sdd-apply** (batch 4, slice 5d — CRITICAL) — Implement tasks 5d.1–5d.10, test, PR to master
13. **Jennifer** (manual step) — Run migration SQL (task 5d.1 prepared file)
14. **E2E Gate 5d** — `pnpm test:e2e [all]` full suite (task 5d.9) — expect ~50-55 min serial
15. **PR 5d Merge** (task 5d.10 — CRITICAL REVIEW REQUIRED)
16. **sdd-verify** — Validate all 4 PRs against spec
17. **sdd-archive** — Close change 5

---

**Tasks artifact by:** sdd-tasks (automated)  
**Date:** 2026-06-16  
**Artifact store:** openspec  
**Next phase:** sdd-apply slice 5a  
**Project:** sdih-talleres
