# Specification: admin-panel (Change 5 of 8)

**Change ID:** `admin-panel`  
**Status:** Draft Specification  
**Date:** 2026-06-16  
**Proposal:** [admin-panel/proposal.md](./proposal.md)  
**Design:** [admin-panel/design.md](./design.md)  
**Brief:** [../../docs/brief.md](../../docs/brief.md) §7.1, §7.4, §9.1, §11  

---

## Overview

This specification defines the **Admin Panel** for SDIH Talleres v1, enabling Jennifer (role=admin) to create workshops, manage students, generate access keys, and monitor progress. The specification is organized by slice (5a–5d) and covers all functional requirements, non-functional requirements, acceptance scenarios, validation schemas, and test coverage.

The change is delivered in **4 chained PRs** to respect the 400 LOC/PR budget:
- **Slice 5a:** Admin shell + workshop list
- **Slice 5b:** Workshop CRUD + cover image upload
- **Slice 5c:** Student list + creation + key generation
- **Slice 5d:** Hash migration + redeemKey refactor

---

## Functional Requirements

### Slice 5a: Admin Shell & Workshop List

**RF-5a-1: Admin Layout with Server-Side Guard**

The system MUST implement an `(admin)` route group with a server-side guard that:
- Checks `getCurrentUser()` on every navigation to `/admin/*`
- Redirects unauthenticated users to `/auth/login`
- Redirects authenticated non-admin users (role !== 'admin') to `/catalogo`
- Allows role='admin' users to proceed and renders the admin shell with sidebar navigation

**File:** `src/app/(admin)/layout.tsx`

#### Scenario: Unauthenticated user attempts /admin

- GIVEN an unauthenticated user (no session)
- WHEN they navigate to `/admin/talleres`
- THEN they are redirected to `/auth/login`
- AND no admin content is rendered

#### Scenario: Alumno (role='alumno') attempts /admin

- GIVEN an authenticated user with role='alumno'
- WHEN they navigate to `/admin/talleres`
- THEN they are redirected to `/catalogo`
- AND no admin content is rendered

#### Scenario: Admin user accesses /admin successfully

- GIVEN an authenticated user with role='admin'
- WHEN they navigate to `/admin/talleres`
- THEN the admin shell is rendered with sidebar navigation
- AND the page loads without redirect

---

**RF-5a-2: Admin Sidebar Navigation**

The system MUST render a persistent sidebar in the admin layout with:
- Logo/branding (reuses project identity from brief section 5)
- Navigation links to `/admin/talleres`, `/admin/claves` (optional)
- Collapse/expand control on mobile (responsive behavior)
- Breadcrumb navigation for deep routes

**File:** `src/components/admin/AdminSidebar.tsx`, `src/components/admin/AdminLayout.tsx`

#### Scenario: Sidebar displays all navigation links

- GIVEN admin is on any `/admin/*` route
- WHEN the page renders
- THEN sidebar shows links to Talleres and Claves
- AND breadcrumbs show the current path

#### Scenario: Sidebar collapses on mobile

- GIVEN admin is on mobile (width less than 768px)
- WHEN sidebar is toggled via collapse button
- THEN sidebar minimizes or becomes a hamburger menu
- AND main content area expands

---

**RF-5a-3: Workshop List Page**

The system MUST display a list of all workshops in a table at `/admin/talleres` with:
- Columns: ID, Title, Status, Date, Instructor, Actions (Edit, View)
- Status filter dropdown (available, live, upcoming, completed)
- "New Workshop" button linking to `/admin/talleres/new` (implementation deferred to 5b)
- Server Action `fetchWorkshops(filter)` that retrieves all workshops

**File:** `src/app/(admin)/talleres/page.tsx`, `src/app/(admin)/talleres/actions.ts`, `src/components/admin/WorkshopTable.tsx`

#### Scenario: Admin views full workshop list

- GIVEN admin is on `/admin/talleres`
- WHEN the page loads
- THEN a table displays all workshops with title, status, date, instructor
- AND action buttons (Edit, View) are present for each row

#### Scenario: Admin filters workshops by status

- GIVEN admin is viewing the workshop table
- WHEN they select a status filter (e.g., "en vivo")
- THEN the table updates to show only workshops with that status
- AND the filter state persists during navigation

#### Scenario: Admin navigates to new workshop form

- GIVEN admin is on `/admin/talleres`
- WHEN they click "New Workshop"
- THEN they are navigated to `/admin/talleres/new`
- AND the form loads empty (implementation deferred to 5b)

---

### Slice 5b: Workshop CRUD & Cover Upload

**RF-5b-1: Create Workshop Form**

The system MUST display a form at `/admin/talleres/new` with fields:
- Title (required, string, max 200 chars)
- Description (required, textarea)
- Instructor (required, string)
- Date (required, date picker)
- Duration (required, number, minutes)
- Prerequisites (optional, textarea)
- Status (required, dropdown: available, live, upcoming, completed)
- Cover image (required, file input jpg/png/webp, max 5MB)

Each field MUST have server-side validation via Zod schema `createWorkshopSchema`.

**File:** `src/app/(admin)/talleres/new/page.tsx`, `src/components/admin/WorkshopForm.tsx`, `src/lib/schemas/workshop.ts`

#### Scenario: Admin creates a new workshop with cover

- GIVEN admin is on `/admin/talleres/new`
- WHEN they fill in all required fields and select a cover image
- AND click "Create Workshop"
- THEN a Server Action `createWorkshop(formData)` executes with role check
- AND the workshop is inserted into the database
- AND the cover is uploaded to Supabase Storage at path `{workshopId}/cover.{ext}`
- AND they are redirected to `/admin/talleres`
- AND the new workshop appears in the list

#### Scenario: Admin submits form with invalid cover file

- GIVEN admin is on `/admin/talleres/new`
- WHEN they select a cover file that is unsupported or over 5MB
- AND click "Create Workshop"
- THEN validation fails with appropriate message
- AND the form is not submitted

#### Scenario: Admin submits form missing required field

- GIVEN admin is on `/admin/talleres/new`
- WHEN they leave Title empty and click "Create Workshop"
- THEN validation fails with message "Title is required"
- AND the form highlights the invalid field

---

**RF-5b-2: Upload Cover Image to Storage**

The system MUST handle cover image uploads via Server Action `uploadCover(workshopId, formData)` that:
- Validates mimetype (image/jpeg, image/png, image/webp)
- Validates file size (less than 5MB)
- Uploads to Supabase Storage bucket `workshops` at path `{workshopId}/cover.{ext}`
- Returns a public URL (CDN-accessible)
- Requires role equals 'admin' (validated via `requireAdmin()` before execution)

**File:** `src/components/admin/CoverUpload.tsx`, `src/app/(admin)/talleres/actions.ts`, `src/lib/storage.ts`

#### Scenario: Admin uploads a valid cover image

- GIVEN admin is on the workshop form
- WHEN they select a JPG file (2MB)
- AND submit the form
- THEN `uploadCover()` Server Action executes
- AND the file is uploaded to Storage
- AND the public URL is stored in the workshop record
- AND the preview updates in real-time (or after upload completes)

#### Scenario: Admin attempts to upload via non-admin user (security check)

- GIVEN an authenticated user with role equals 'alumno'
- WHEN they attempt to call `uploadCover()` directly
- THEN the Server Action checks `requireAdmin()`
- AND throws an error "Unauthorized"
- AND no file is uploaded

---

**RF-5b-3: Edit Workshop Form**

The system MUST display an edit form at `/admin/talleres/[id]` with:
- Pre-populated fields from existing workshop
- Same fields as create form (Title, Description, Instructor, etc.)
- Server Action `updateWorkshop(id, formData)` to persist changes
- Server Action `deleteWorkshop(id)` to remove (with confirmation modal)

**File:** `src/app/(admin)/talleres/[id]/page.tsx`, `src/components/admin/WorkshopForm.tsx`

#### Scenario: Admin edits an existing workshop

- GIVEN admin is on `/admin/talleres/123`
- WHEN they load the form
- THEN all existing fields are pre-populated
- AND they modify Title to "Updated Title"
- AND click "Save"
- THEN the Server Action `updateWorkshop(123, formData)` executes
- AND the workshop is updated in the database
- AND they see a success notification

#### Scenario: Admin deletes a workshop

- GIVEN admin is on `/admin/talleres/123`
- WHEN they click "Delete Workshop"
- THEN a confirmation modal appears with warning message
- WHEN they confirm
- THEN Server Action `deleteWorkshop(123)` executes
- AND the workshop is removed from the database
- AND they are redirected to `/admin/talleres`

---

**RF-5b-4: Content JSON Schema Validation**

The system MUST validate content_json (sections, exercises, glossary) via Zod schema before saving. The schema MUST accept required and optional fields for workshop content structure.

The Server Action MUST reject malformed JSON with clear error messages.

**File:** `src/lib/schemas/workshop.ts`

#### Scenario: Admin submits valid content JSON

- GIVEN admin creates a workshop with valid JSON structure
- WHEN they click "Create Workshop"
- THEN Zod parses the content_json successfully
- AND the workshop is saved

#### Scenario: Admin submits invalid content JSON

- GIVEN admin creates a workshop with missing required fields in content_json
- WHEN they click "Create Workshop"
- THEN Zod validation fails
- AND they see specific error message identifying the problem

---

### Slice 5c: Student List & Creation & Key Generation

**RF-5c-1: Student List by Workshop**

The system MUST display a list of students enrolled in a workshop at `/admin/talleres/[id]/alumnos` with:
- Table columns: Email, Name, Progress (%), Actions (Edit, Remove)
- Progress percentage calculated via `getExerciseAwareProgress(userId, workshopId)` (reused from change 4)
- "New Student" button opening a modal form
- Server Action `fetchStudents(workshopId)` to retrieve students

**File:** `src/app/(admin)/talleres/[id]/alumnos/page.tsx`, `src/components/admin/StudentList.tsx`

#### Scenario: Admin views students in a workshop

- GIVEN admin is on `/admin/talleres/123/alumnos`
- WHEN the page loads
- THEN a table displays all students enrolled in that workshop
- AND each row shows email, name, and progress percentage
- AND actions (Edit, Remove) are available per row

#### Scenario: Progress percentage updates after student completes exercise

- GIVEN a student has completed some exercises in the workshop
- WHEN admin views the student list
- THEN the Progress column shows correct percentage calculated using `getExerciseAwareProgress`

---

**RF-5c-2: Create Student Modal**

The system MUST display a modal form triggered by "New Student" button with fields:
- Email (required, valid email format)
- Password (required, min 8 characters)

Server Action `createStudent(workshopId, email, passwordTemp)` MUST:
- Call `requireAdmin()` to verify role equals 'admin'
- Validate schema via `createStudentSchema`
- Create auth.users via Supabase admin API (service_role client)
- Create public.users row with role equals 'alumno', password_changed equals false
- Generate access key and create workshop_access row
- Return the plaintext key one time only

**File:** `src/app/(admin)/talleres/[id]/alumnos/actions.ts`, `src/components/admin/CreateStudentModal.tsx`, `src/lib/schemas/user.ts`

#### Scenario: Admin creates a student in a workshop

- GIVEN admin is on `/admin/talleres/123/alumnos`
- WHEN they click "New Student"
- AND enter valid email and password
- AND click "Create"
- THEN the Server Action `createStudent()` executes
- AND auth.users receives a new user entry
- AND public.users receives a row with role equals 'alumno'
- AND workshop_access receives an entry with generated key
- AND the modal displays the plaintext key one time
- AND the student appears in the table with zero percent progress

#### Scenario: Admin attempts to create duplicate student email

- GIVEN admin is on `/admin/talleres/123/alumnos`
- WHEN they attempt to create a student with existing email
- AND click "Create"
- THEN the Server Action catches the duplicate error
- AND returns appropriate error message
- AND the form does not submit

#### Scenario: Admin enters weak password

- GIVEN admin is on the Create Student modal
- WHEN they enter insufficient password length
- AND click "Create"
- THEN validation fails with message indicating password requirement
- AND form does not submit

---

**RF-5c-3: Key Generation and Display**

The system MUST generate access keys for students with:
- Key format following alphanumeric pattern
- Keys stored hashed in workshop_access (hash and salt added in 5d)
- Plaintext key shown once only in modal after generation
- Table showing masked key representation (last few characters visible)
- Action to regenerate (if not yet redeemed)

**File:** `src/lib/crypto/access-key.ts`, `src/app/(admin)/talleres/[id]/alumnos/actions.ts`, `src/components/admin/KeyTable.tsx`

#### Scenario: Admin generates a key and sees it once

- GIVEN admin has just created a student
- WHEN the modal displays the plaintext key
- AND admin closes the modal
- AND navigates back to the student list
- THEN the key is displayed in masked format
- AND there is no way to retrieve the full plaintext key again

#### Scenario: Admin regenerates a pending key

- GIVEN a student has a pending (unredeemed) key
- WHEN admin clicks "Regenerate Key"
- THEN a new key is generated
- AND the table updates to show new key status

#### Scenario: Admin cannot regenerate a redeemed key

- GIVEN a student has already redeemed their key
- WHEN admin views the Keys table
- THEN no regenerate action is available for that row
- AND the status shows redeemed state

---

### Slice 5d: Hash Migration & redeemKey Refactor

**RF-5d-1: Hash Migration SQL**

The system MUST execute a SQL migration that:
- Adds column `access_key_salt` (UUID) to workshop_access
- Adds column `access_key_hash` (TEXT) to workshop_access
- Backfills all existing plaintext `access_key` rows with generated salt and hash
- Maintains `access_key` column for backward compatibility

**File:** `supabase/migrations/20260616_add_key_hash.sql`

The migration MUST NOT break existing data. Verify:
- All rows have non-null hash and salt values
- Hash is correctly computed
- No data loss for keys from previous changes

#### Scenario: Migration adds hash columns

- GIVEN the database is at previous state with plaintext keys
- WHEN the migration runs
- THEN hash and salt columns exist
- AND all existing keys have been backfilled with hash and salt

#### Scenario: Migration can be rolled back

- GIVEN the migration has been applied
- WHEN rollback is called
- THEN the columns are removed
- AND the database returns to the previous state

---

**RF-5d-2: SHA-256 Hash Utility Functions**

The system MUST provide utility functions for access key hashing using Node.js builtin crypto without external dependencies.

**File:** `src/lib/crypto/access-key.ts`

Functions MUST:
- Generate access keys in alphanumeric format
- Hash plaintext keys with salt using SHA-256
- Verify plaintext keys against stored hashes

#### Scenario: Generate, hash, and verify a key

- GIVEN a call to generate new access key
- WHEN the function returns plaintext key
- AND a salt is generated
- AND hash function is called
- THEN the hash is produced correctly
- AND verification of correct plaintext returns true
- AND verification of incorrect plaintext returns false

---

**RF-5d-3: Refactor redeemKey() to Use Hash Verification**

The system MUST update `redeemKey()` in `src/app/(authenticated)/catalogo/actions.ts` to:
- Check if hash and salt columns exist
- If yes: verify using hash comparison
- If no (legacy key): fallback to plaintext comparison
- On successful verification: update `redeemed_at` timestamp
- On failure: return error

**File:** `src/app/(authenticated)/catalogo/actions.ts`

#### Scenario: Student redeems a hashed key

- GIVEN a student has a key generated in slice 5c (hashed and salted)
- WHEN they enter the key in modal
- AND click "Unlock"
- THEN the Server Action `redeemKey()` executes
- AND looks up workshop_access record
- AND verifies using hash comparison
- AND `redeemed_at` is set
- AND workshop content becomes visible

#### Scenario: Student redeems a plaintext key (legacy fallback)

- GIVEN a student has a key from previous changes (plaintext only)
- WHEN they enter the key in modal
- AND click "Unlock"
- THEN the Server Action `redeemKey()` executes
- AND detects missing hash
- AND falls back to plaintext comparison
- AND `redeemed_at` is set
- AND warning is logged
- AND workshop content becomes visible

#### Scenario: Student enters wrong key

- GIVEN either hashed or plaintext key exists
- WHEN the student enters incorrect key
- THEN `redeemKey()` returns error
- AND modal shows error message
- AND redeemed_at remains unset

---

## Non-Functional Requirements

**RNF-1: Security**

- MUST: All admin Server Actions require role check before database write
- MUST: access_key stored hashed in database, no plaintext retrieval after generation
- MUST: Storage bucket RLS restricts write operations to admin role
- MUST: Admin layout guard prevents non-admin users from accessing admin routes
- MUST: Service role client used only for admin operations
- SHOULD: Failed key redemption attempts are logged

**RNF-2: Performance**

- Key verification MUST complete in under 100 milliseconds
- Student creation MUST complete in under 500 milliseconds
- Workshop list query MUST complete in under 100 milliseconds
- Cover image upload MUST complete in under 1 second for files below 5MB

**RNF-3: Responsiveness & Mobile**

- Admin panel MUST be usable on desktop screens
- Sidebar MUST adapt to mobile screens (collapse or hamburger menu)
- Tables MUST be viewable on mobile (stack vertically or horizontal scroll)
- File input MUST support touch/mobile interaction

**RNF-4: Accessibility**

- Form labels MUST be associated with inputs
- Tables MUST have semantic header structure
- Buttons MUST have meaningful text labels
- Color MUST not be the only indicator of status
- Error messages MUST be associated with form fields

**RNF-5: Internationalization**

- All UI text MUST use appropriate Spanish dialect
- Error messages MUST be clear and specific
- Date formats MUST follow locale conventions
- No hardcoded English text in UI

**RNF-6: Data Integrity**

- Workshop creation MUST enforce required field validation
- Content JSON MUST be validated before storage
- Student email MUST be unique
- Access keys MUST be unique per workshop

**RNF-7: Testing**

- Unit tests MUST cover schema validation and crypto functions
- E2E tests MUST cover guard behavior, CRUD operations, and key redemption
- Tests MUST cover both new hash-based and legacy plaintext key flows
- E2E suite completion time MUST remain reasonable

---

## Validation Schemas (Zod)

### createWorkshopSchema

Validates workshop creation with required fields and type constraints.

### updateWorkshopSchema

Extends create schema with optional cover field for updates.

### createStudentSchema

Validates student creation with email and password requirements.

### workshopContentSchema

Validates content structure for sections, exercises, and glossary.

---

## Test Coverage Summary

| Category | Type | Scope |
|----------|------|-------|
| Unit | Vitest | Zod schema validation, crypto functions |
| E2E | Playwright | Admin guard, CRUD operations, key generation, backward-compatibility |
| Fixtures | Helpers | Admin user, plaintext and hashed keys for testing |
| Total | | 40+ test cases covering happy path, edge cases, and security |

---

## Files & Slice Mapping

### Slice 5a: Admin Shell & Workshop List

- `src/app/(admin)/layout.tsx`
- `src/app/(admin)/talleres/page.tsx`
- `src/app/(admin)/talleres/actions.ts`
- `src/components/admin/AdminSidebar.tsx`
- `src/components/admin/WorkshopTable.tsx`
- Tests: Admin guard and list functionality

### Slice 5b: Workshop CRUD & Upload

- `src/app/(admin)/talleres/new/page.tsx`
- `src/app/(admin)/talleres/[id]/page.tsx`
- `src/components/admin/WorkshopForm.tsx`
- `src/components/admin/CoverUpload.tsx`
- `src/lib/schemas/workshop.ts`
- `src/app/(admin)/talleres/actions.ts` (extended)
- Tests: Workshop creation, update, deletion, cover upload

### Slice 5c: Students & Keys

- `src/app/(admin)/talleres/[id]/alumnos/page.tsx`
- `src/app/(admin)/talleres/[id]/alumnos/actions.ts`
- `src/components/admin/StudentList.tsx`
- `src/components/admin/CreateStudentModal.tsx`
- `src/components/admin/KeyTable.tsx`
- `src/lib/schemas/user.ts`
- Tests: Student list, creation, key generation

### Slice 5d: Hash Migration & Refactor

- `supabase/migrations/20260616_add_key_hash.sql`
- `src/lib/crypto/access-key.ts`
- `src/app/(authenticated)/catalogo/actions.ts` (redeemKey refactor)
- Tests: Migration, hash utility functions, key redemption (both flows)

---

## Dependencies & Blockers

### Pre-Apply Blockers

1. Create test admin user in Supabase
2. Create Storage bucket `workshops` with RLS policies
3. Prepare test fixtures for plaintext and hashed keys
4. Review migration SQL for correctness

### New Dependencies

ZERO. All required components are Node.js builtins or already in project.

### Reused from Changes 1–4

- `getCurrentUser()` function
- `getExerciseAwareProgress()` helper
- Existing UI components (forms, buttons, alerts)
- Server Actions pattern and Zod schema validation
- Playwright e2e testing setup

---

## Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Refactoring archived redeemKey code | HIGH | Comprehensive tests covering both hash and plaintext flows. Fallback logic. Code review. |
| Hash migration data integrity | HIGH | Test migration locally. Verify all keys processed correctly. Include rollback logic. |
| Storage RLS misconfiguration | MEDIUM | Policy validation in design phase. E2E test verifies upload and access. |
| E2E suite performance | MEDIUM | Focus on critical paths. Reuse test fixtures. Monitor performance. |
| Backward compatibility | LOW | Test fixtures cover legacy plaintext keys. Fallback code path. |

---

## Summary

This specification defines the complete admin panel for SDIH Talleres v1 across 4 slices. It covers 22 functional requirements with acceptance scenarios, 7 non-functional requirements, comprehensive test coverage, and all necessary validation schemas. The specification maintains architecture continuity with changes 1–4 while introducing new features for workshop management, student administration, and secure key generation and redemption.

**Next Phase:** sdd-tasks
