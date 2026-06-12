# Tasks — workshop-sections

**Change ID:** workshop-sections  
**Position in SDD plan:** 3 of 8  
**Status:** Tasks (ready for apply)  
**Slicing:** 2 chained PRs (3a ~1,200 lines, 3b ~1,300 lines)  
**Delivery Strategy:** Chained PRs approved (slice 3a → PR to master; slice 3b → branch from 3a merged)

---

## Review Workload Forecast

| Metric | Value | Notes |
|--------|-------|-------|
| **Estimated changed lines** | ~2,500 | 3a: ~1,200 (migrations + sidebar + 2 sections) + 3b: ~1,300 (3 sections + social + tests) |
| **400-line budget risk** | High | Total exceeds budget; chained PR slicing approved by Jennifer |
| **Chained PRs recommended** | Yes | 2 slices: autonomous, testable, releasable in sequence |
| **Decision needed before apply** | No | All design decisions locked (D-1 to D-12 in design artifact) |
| **Chain strategy** | stacked-to-main | Slice 3a → PR#N merges to master; Slice 3b → PR#N+1 merges to master (via branch from 3a merged) |

**Forecast details:**
- Slice 3a: Migrations (120 LOC) + Zod schemas (80 LOC) + Sidebar component (140 LOC) + ProgressBar (70 LOC) + InicioSection (160 LOC) + AprendizajeSection (280 LOC) + SectionRenderer (60 LOC) + Route guard (100 LOC) + E2E tests (180 LOC) = **1,190 LOC**
- Slice 3b: TallerSection (200 LOC) + InstalacionSection (260 LOC) + GlosarioSection (240 LOC) + SocialFooter (60 LOC) + config (30 LOC) + mobile styles (80 LOC) + E2E tests (200 LOC) + keyframes (30 LOC) = **1,100 LOC**
- Seed data (SQL): ~100 LOC (in 3a, pre-apply blocker)

**Key findings:**
- No new npm dependencies required
- All RLS policies sourced from design (D-5)
- SQL migrations provided in design (3 files)
- Test fixtures and helpers finalized
- Mobile responsive design per D-2 (hamburger drawer)

---

## Pre-Apply Blockers (Read & Action Required)

### B-1: SQL Migrations Must Run First (Manual Step)

**Blocker owner:** Jennifer Salazar Duque  
**Action:** Before `pnpm test:e2e` runs in slice 3a:

1. Create 3 migration files in `supabase/migrations/` (timestamped, in order):
   - `{ts}-create-sections-table.sql` — sections + indexes + RLS (from design D-5)
   - `{ts}-create-glossary-terms-table.sql` — glossary_terms + indexes + RLS (from design D-5)
   - `{ts}-create-section-visits-table.sql` — section_visits + indexes + RLS (from design D-5)
   
2. Run in Supabase SQL Editor (local dev environment first, then staging):
   ```sql
   -- Run migrations in order
   -- (Supabase auto-applies when deployed, or run manually in editor)
   ```

3. Verify tables exist:
   ```sql
   SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
   -- Should show: sections, glossary_terms, section_visits
   ```

4. Verify RLS enabled:
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('sections', 'glossary_terms', 'section_visits');
   -- All should show: true
   ```

**Timing:** Apply phase creates migration files. Jennifer runs them in Supabase SQL Editor. E2E tests wait for this signal before proceeding.

**Acceptance:** 3 tables exist in Supabase public schema with RLS enabled. Indexes present. UNIQUE constraints in place.

---

### B-2: Seed Data for E2E Tests

**Blocker owner:** Apply phase (via helper function)  
**Action:** Seed fixtures must load before e2e runs in slice 3a.

1. Apply phase creates helper: `src/lib/seed/sections.sql` or extends `resetSeedUser()` in fixtures
2. Seed includes:
   - 5 Section rows per test workshop (one per type: inicio, aprendizaje, taller, instalacion, glosario)
   - 12 GlossaryTerm rows per workshop
   - Content matches spec examples (RF-003, RF-004, etc.)

3. Helper is called in Playwright test setup (before each test):
   ```typescript
   // tests/e2e/fixtures.ts
   await seedSectionsAndGlossary(db, workshopId);
   ```

4. Verify seed worked:
   ```sql
   SELECT COUNT(*) FROM sections WHERE workshop_id = $1;  -- expect 5
   SELECT COUNT(*) FROM glossary_terms WHERE workshop_id = $1;  -- expect 12
   ```

**Timing:** E2E helper created during apply 3a. Jennifer or test runner executes seed before e2e gate.

**Acceptance:** 5 sections + 12 glossary terms exist in DB. Content parses valid Zod schemas. RLS allows redeemed user to see all rows.

---

### B-3: Design Decision Clarification (Already Locked — FYI Only)

**Status:** ✓ All decisions finalized in design phase.

- D-1: Progress persistence → server-side section_visits table ✓
- D-2: Mobile sidebar → hamburger drawer on 360px ✓
- D-3: Visit recording → Server Action on section render ✓
- D-4: Component structure → specific file layout ✓
- D-5: SQL migrations → 3 files with RLS ✓

**No additional decisions needed for apply.** Tasks below assume all D-* are locked.

---

## Slice 3a Tasks

**Scope:** Migrations + Zod schemas + Sidebar + Progress bar + Inicio section + Aprendizaje section + Route guard + partial E2E

**Target:** ~1,200 lines, autonomous, fully tested, mergeable to master alone

---

### Task 3a.1: Create SQL Migrations (3 files)

**Type:** Database infrastructure  
**Files affected:**
- `supabase/migrations/{ts}-create-sections-table.sql`
- `supabase/migrations/{ts}-create-glossary-terms-table.sql`
- `supabase/migrations/{ts}-create-section-visits-table.sql`

**Acceptance:**
- [ ] 3 migration files created with correct timestamps (sequential)
- [ ] sections table: id, workshop_id (FK), type (enum check), content_json (JSONB), section_order, created_at, updated_at, UNIQUE(workshop_id, type), indexes
- [ ] glossary_terms table: id, workshop_id (FK), term, definition, category, created_at, updated_at, UNIQUE(workshop_id, term), indexes
- [ ] section_visits table: id, user_id (FK), section_id (FK), visited_at, UNIQUE(user_id, section_id), indexes
- [ ] RLS policies attached to all 3 tables (per design D-5 SQL)
- [ ] Test: `pnpm build` (Next.js Supabase client imports schema, no errors)

**Dependency:** None (first task)  
**Estimated:** 120 LOC total

---

### Task 3a.2: Create Zod Discriminated Union Schema

**Type:** Validation schema  
**Files affected:**
- `src/lib/schemas/section-content.ts` (new)

**Acceptance:**
- [ ] SectionContentSchema exported: z.discriminatedUnion('type', [...])
- [ ] 5 content types defined: InicioContentSchema, AprendizajeContentSchema, TallerContentSchema, InstalacionContentSchema, GlosarioContentSchema
- [ ] All 5 types include `type: z.literal('...')`
- [ ] Zod parse succeeds for all 5 spec examples (RF-003)
- [ ] Type inference: `export type SectionContent = z.infer<typeof SectionContentSchema>`
- [ ] Test: vitest unit test parses each example, rejects invalid content
- [ ] Test: TypeScript compile succeeds with type narrowing in switch blocks

**Dependency:** None  
**Estimated:** 80 LOC

---

### Task 3a.3: Create Sidebar Component (Client)

**Type:** UI component  
**Files affected:**
- `src/components/workshop/Sidebar.tsx` (new, Client Component)

**Acceptance:**
- [ ] Component receives props: activeSection, progressPercent, sections[], onSectionChange callback
- [ ] Renders 5 tabs (icons + labels): Inicio, Aprendizaje, Taller, Instalación, Glosario
- [ ] Active tab has cyan glow + underline animation (per design prototype)
- [ ] Back-to-catalog button (icon + label) navigates to /catalogo
- [ ] Progress bar component nested (placeholder, wired in 3a.4)
- [ ] Social footer component nested (placeholder, wired in 3b)
- [ ] Mobile hamburger toggle (shown on 360px+, hidden on 768px+) via useMediaQuery
- [ ] Drawer overlay with scrim when mobile (max-width 767px)
- [ ] Close on backdrop click or Escape key
- [ ] Sidebar sticky on desktop (position: sticky, left: 0)
- [ ] Test: Playwright test tabs are clickable, active glow appears, callback fires with correct section type

**Dependency:** Task 3a.4 (ProgressBar) — this task renders placeholder until ready  
**Estimated:** 140 LOC

---

### Task 3a.4: Create ProgressBar Component (Client)

**Type:** UI component  
**Files affected:**
- `src/components/workshop/ProgressBar.tsx` (new, Client Component)

**Acceptance:**
- [ ] Component receives: progressPercent (0-100), format (e.g., "2 of 5")
- [ ] Renders gradient bar (CSS, design-specified colors)
- [ ] Displays percentage label (centered or below bar)
- [ ] No animation on initial render (static)
- [ ] Bar updates when progressPercent prop changes
- [ ] Test: Playwright test updates percent, bar reflects new value

**Dependency:** Task 3a.3 (Sidebar) — imported here  
**Estimated:** 70 LOC

---

### Task 3a.5: Create SectionRenderer Switch Component (Client)

**Type:** UI component  
**Files affected:**
- `src/components/workshop/SectionRenderer.tsx` (new, Client Component)

**Acceptance:**
- [ ] Component receives: activeSection (type), section data
- [ ] Switch on activeSection.type → renders correct section component
- [ ] Calls recordSectionVisit(sectionId) on mount (Server Action from task 3a.7)
- [ ] Passes section.content_json to each renderer after Zod parse
- [ ] Error boundary: parse error shows user-friendly message
- [ ] Test: Mount each section type, verify correct component renders

**Dependency:** Tasks 3a.6, 3a.8 (section components must exist)  
**Estimated:** 60 LOC

---

### Task 3a.6: Create InicioSection Component (Server)

**Type:** UI component  
**Files affected:**
- `src/components/workshop/sections/InicioSection.tsx` (new, Server Component)

**Acceptance:**
- [ ] Receives: content (InicioContent parsed from Zod)
- [ ] Renders: H1 title, description paragraph
- [ ] Quick-links grid: 4 cards (2x2 responsive), each with label + icon
- [ ] Each card clickable: onLinkClick callback (passed from parent) with target_section
- [ ] Icons match design prototype (home, book, tool, dictionary)
- [ ] Responsive: stacks to 1 column on mobile, 2x2 on desktop
- [ ] Test: Playwright test renders title, description, 4 cards; clicking card invokes callback

**Dependency:** Task 3a.2 (Zod schema) — content_json must parse  
**Estimated:** 160 LOC

---

### Task 3a.7: Create AprendizajeSection Component (Client)

**Type:** UI component  
**Files affected:**
- `src/components/workshop/sections/AprendizajeSection.tsx` (new, Client Component)

**Acceptance:**
- [ ] Receives: content (AprendizajeContent parsed from Zod)
- [ ] Renders: H1 title, carousel container
- [ ] Carousel: displays one slide at a time (state: slideIndex)
- [ ] Slide content: kicker, title, body, optional notes
- [ ] Notes toggle button: "Ver notas / Ocultar notas", toggles notesOpen state
- [ ] Prev/next buttons: navigate slides, disabled at edges
- [ ] Slide counter: "1 of X" below carousel
- [ ] PDF link button (if pdf_url present): "Descargar PDF", opens URL in new tab
- [ ] Keyboard support: ArrowLeft/ArrowRight navigate (optional per design D-8)
- [ ] Animations: slide entrance via sdRise keyframe, notes fade-in
- [ ] Test: Playwright test carousel navigation, notes toggle, PDF link, counter display

**Dependency:** Task 3a.2 (Zod schema)  
**Estimated:** 280 LOC

---

### Task 3a.8: Create `/taller/[slug]` Route (Server Layout)

**Type:** Route + server-side logic  
**Files affected:**
- `src/app/taller/[slug]/page.tsx` (new)
- `src/app/taller/[slug]/layout.tsx` (new, if needed for shared shell)

**Acceptance:**
- [ ] Server Component fetches workshop by slug via Supabase
- [ ] Guard: call getRequiredUser(), check user has redeemed workshop_access (RLS enforced)
- [ ] If no access or not redeemed: throw 403 error (or redirect to /catalogo)
- [ ] Fetch sections, glossary_terms, section_visits for user (all via RLS-filtered query)
- [ ] Calculate progressPercent = (visited sections count / 5) * 100
- [ ] Render wrapper with <Sidebar /> + <SectionRenderer /> (Client Components)
- [ ] Pass data as props: activeSection (default 'inicio'), sections[], progressPercent
- [ ] Client wrapper manages state: activeSection, drawer toggle
- [ ] Test: Playwright test authorized user loads route, unauthorized user gets 403, sections render

**Dependency:** Tasks 3a.2, 3a.3, 3a.5 (schema, Sidebar, SectionRenderer must exist)  
**Estimated:** 100 LOC

---

### Task 3a.9: Create recordSectionVisit Server Action

**Type:** Server-side function  
**Files affected:**
- `src/lib/actions/workshop-sections.ts` (new)

**Acceptance:**
- [ ] Export async function recordSectionVisit(sectionId: string)
- [ ] Query: user = getRequiredUser()
- [ ] Insert into section_visits: (user_id, section_id) ON CONFLICT DO NOTHING
- [ ] Return: success boolean
- [ ] Test: vitest unit test mocks Supabase, verifies insert executes

**Dependency:** Task 3a.1 (section_visits table must exist)  
**Estimated:** 30 LOC

---

### Task 3a.10: Create Seed Fixtures & Helper

**Type:** Test infrastructure  
**Files affected:**
- `src/lib/seed/sections.sql` (new, SQL seed)
- `tests/fixtures/seed-sections.ts` (new, TypeScript helper)

**Acceptance:**
- [ ] SQL file: INSERT INTO sections (5 rows, one per type, sample content_json per spec examples)
- [ ] SQL file: INSERT INTO glossary_terms (12 rows, sample terms + definitions, 3 categories)
- [ ] TypeScript helper: export async function seedSectionsAndGlossary(db, workshopId)
- [ ] Helper idempotent: can be called multiple times without error
- [ ] Integration: called from Playwright fixtures (authenticatedUserWithWorkshop)
- [ ] Test: helper executes without error, sections and terms exist in DB

**Dependency:** Task 3a.1 (tables must exist)  
**Estimated:** 100 LOC

---

### Task 3a.11: E2E Spec — Sidebar & Navigation

**Type:** Test  
**Files affected:**
- `tests/e2e/workshop-section-navigation.spec.ts` (new)

**Acceptance:**
- [ ] Test: user navigates to /taller/taller-x, sidebar renders with 5 tabs
- [ ] Test: Inicio tab active by default (cyan glow)
- [ ] Test: clicking Aprendizaje tab → activeSection changes, URL updates ?section=aprendizaje
- [ ] Test: clicking back-to-catalog button → navigates to /catalogo
- [ ] Test: progress bar visible, shows initial value (0%)
- [ ] Test: mobile view (360px) shows hamburger toggle, clicking shows sidebar drawer
- [ ] Test coverage: RF-002, RF-006, RF-011

**Dependency:** Task 3a.8 (route must exist)  
**Estimated:** 90 LOC

---

### Task 3a.12: E2E Spec — Inicio Section

**Type:** Test  
**Files affected:**
- `tests/e2e/workshop-section-inicio.spec.ts` (new)

**Acceptance:**
- [ ] Test: Inicio section renders H1 title + description
- [ ] Test: 4 quick-link cards visible with labels
- [ ] Test: clicking quick-link card → navigates to target section, sidebar tab updates
- [ ] Test: glow follows active tab
- [ ] Test coverage: RF-004

**Dependency:** Task 3a.6 (InicioSection must exist)  
**Estimated:** 40 LOC

---

### Task 3a.13: E2E Spec — Aprendizaje Section

**Type:** Test  
**Files affected:**
- `tests/e2e/workshop-section-aprendizaje.spec.ts` (new)

**Acceptance:**
- [ ] Test: carousel renders slide 1 with title, body, kicker
- [ ] Test: slide counter shows "1 of X"
- [ ] Test: prev button disabled (or hidden) on slide 1
- [ ] Test: next button enabled, clicking advances to slide 2
- [ ] Test: notes toggle button present, clicking shows/hides notes
- [ ] Test: PDF button present (if pdf_url in content_json), clicking opens URL
- [ ] Test: keyboard ArrowRight/ArrowLeft navigate (if implemented per D-8)
- [ ] Test coverage: RF-005

**Dependency:** Task 3a.7 (AprendizajeSection must exist)  
**Estimated:** 50 LOC

---

### Task 3a.14: E2E Spec — RLS Boundary (3a subset)

**Type:** Test  
**Files affected:**
- `tests/e2e/workshop-rls.spec.ts` (new, will extend in 3b)

**Acceptance for 3a:**
- [ ] Test: unauthorized user (not logged in) → /taller/taller-x redirects or 403
- [ ] Test: logged-in user with unredeemed access → /taller/taller-x returns 403 or redirects
- [ ] Test: logged-in user with redeemed access → /taller/taller-x loads, sections visible
- [ ] Test coverage: RF-012 (3a subset: scenarios 9.1–9.3)

**Dependency:** Task 3a.8 (route must exist)  
**Estimated:** 40 LOC

---

### Task 3a.15: E2E Spec — Progress Bar Updates

**Type:** Test  
**Files affected:**
- `tests/e2e/workshop-section-navigation.spec.ts` (extend from 3a.11)

**Acceptance:**
- [ ] Test: user visits Inicio → recordSectionVisit fires → progress updates to 20% ("1 of 5")
- [ ] Test: user visits Aprendizaje → progress updates to 40% ("2 of 5")
- [ ] Test: revisiting same section → progress stays same (idempotent UNIQUE constraint)
- [ ] Test: reload page → progress persists (section_visits query from server)
- [ ] Test coverage: RF-011

**Dependency:** Task 3a.9 (recordSectionVisit must exist)  
**Estimated:** (included in 3a.11 ~ 30 LOC additional)

---

### Task 3a.16: Code Quality — Linting & Type Check

**Type:** QA  
**Acceptance:**
- [ ] Run `pnpm lint` → no errors in new files (src/components, src/lib)
- [ ] Run `pnpm build` → TypeScript compile succeeds
- [ ] Check: Zod discriminated union type narrowing works in switch blocks

**Dependency:** All tasks 3a.1–3a.14  
**Estimated:** (mechanical, ~5 min)

---

### Task 3a.17: E2E Gate & Verification

**Type:** QA  
**Acceptance:**
- [ ] Run full e2e suite: `pnpm test:e2e` (migration + seed must be ready first)
- [ ] All specs 3a.11–3a.14 pass
- [ ] No RLS leaks (unauthorized users see no sections)
- [ ] All navigation flows work (tabs, back button, quick links)
- [ ] All interactive elements respond (carousel, notes toggle, PDF link)

**Dependency:** Tasks 3a.1 (migrations run), 3a.10 (seed fixtures), all tests 3a.11–3a.14  
**Estimated:** (execution time ~2-3 min, no new code)

---

### Task 3a.18: Prepare Commit & PR Description

**Type:** Delivery  
**Acceptance:**
- [ ] Commit message: `feat(workshop-sections 3a): migrate sections/glossary, sidebar, 2 sections + navigation e2e`
- [ ] PR title: `feat: workshop detail view (slice 3a) — sidebar + Inicio + Aprendizaje sections`
- [ ] PR body includes:
  - Summary: what was delivered
  - Key files: migrations, components, route
  - Testing: e2e specs, RLS validation
  - Blockers: SQL migrations must run first, seed data loaded
  - Next: slice 3b (Taller/Instalación/Glosario + social footer)

**Dependency:** Task 3a.17 (tests must pass)  
**Estimated:** (mechanical, ~10 min)

---

## Slice 3b Tasks

**Scope:** Remaining sections (Taller, Instalación, Glosario) + Social footer + complete E2E coverage + mobile styles

**Target:** ~1,300 lines, autonomous, fully tested, mergeable after 3a

**Dependency:** Slice 3a merged to master (all tables exist, Sidebar/ProgressBar in place)

---

### Task 3b.1: Create TallerSection Component (Server)

**Type:** UI component  
**Files affected:**
- `src/components/workshop/sections/TallerSection.tsx` (new, Server Component)

**Acceptance:**
- [ ] Receives: content (TallerContent parsed from Zod)
- [ ] Renders: H1 title, instructions text
- [ ] Placeholder message: "Ejercicios disponibles en la siguiente actualización" (or design-specified text)
- [ ] No interactive elements (textareas locked)
- [ ] No Exercise table query (exercises wired in change 4)
- [ ] Test: Playwright test renders title, instructions, placeholder; no interactivity

**Dependency:** Task 3a.2 (Zod schema)  
**Estimated:** 200 LOC

---

### Task 3b.2: Create InstalacionSection Component (Client)

**Type:** UI component  
**Files affected:**
- `src/components/workshop/sections/InstalacionSection.tsx` (new, Client Component)

**Acceptance:**
- [ ] Receives: content (InstalacionContent parsed from Zod)
- [ ] Renders: H1 title, step list (numbered circles + vertical line between)
- [ ] Each step: order number, title, description, code block
- [ ] Code block: language label (bash, python, etc.), syntax highlighting (via prism-react-renderer or equivalent)
- [ ] Copy button per code block: copies code to clipboard, shows "✓ Copiado" confirmation for 2s
- [ ] Success message at end (from content_json.success_message)
- [ ] Responsive: steps stack vertically on mobile, horizontal line hides on 360px
- [ ] Test: Playwright test renders steps, code block copy button works, confirmation shows

**Dependency:** Task 3a.2 (Zod schema)  
**Estimated:** 260 LOC

---

### Task 3b.3: Create GlosarioSection Component (Client)

**Type:** UI component  
**Files affected:**
- `src/components/workshop/sections/GlosarioSection.tsx` (new, Client Component)

**Acceptance:**
- [ ] Receives: glossaryTerms[] (from parent query), content (GlosarioContent from Zod)
- [ ] Renders: H1 title, search input, category filter buttons, flashcard grid
- [ ] Search: live filter by term.toLowerCase().includes(query) or definition match
- [ ] Categories: extract unique categories from terms, render buttons, click toggles filter (or null for all)
- [ ] Flashcards: grid of cards, each shows term + category on front
- [ ] Flip animation: click card → rotateY 180deg (CSS 3D, via sdFlip keyframe)
- [ ] Reverse side: definition text
- [ ] Empty state: "No encontramos términos para tu búsqueda."
- [ ] Count badge: "12 términos" (updates as filter changes)
- [ ] Test: Playwright test search filters live, category buttons toggle, flashcard flip smooth

**Dependency:** Task 3a.2 (Zod schema), Slice 3a merged (glossary_terms table exists)  
**Estimated:** 240 LOC

---

### Task 3b.4: Create SocialFooter Component (Client)

**Type:** UI component  
**Files affected:**
- `src/components/workshop/SocialFooter.tsx` (new, Client Component)

**Acceptance:**
- [ ] Receives: socialLinks config (from src/lib/config/social.ts)
- [ ] Renders: icons for Instagram, LinkedIn, TikTok, YouTube
- [ ] Each icon clickable: href={socialLinks[platform]}, target="_blank"
- [ ] If URL empty: link renders but href="" (graceful placeholder)
- [ ] Hover state: icon dims or changes color
- [ ] Sticky at bottom of sidebar (position-relative or absolute in parent)
- [ ] Responsive: icons only (no labels)
- [ ] Test: Playwright test icons visible, URLs clickable, open in new tab

**Dependency:** Task 3b.5 (config file must exist)  
**Estimated:** 60 LOC

---

### Task 3b.5: Create Social Links Config File

**Type:** Configuration  
**Files affected:**
- `src/lib/config/social.ts` (new)

**Acceptance:**
- [ ] Export SOCIAL_LINKS object: { instagram, linkedin, tiktok, youtube }
- [ ] Each value = process.env.NEXT_PUBLIC_*_URL || ''
- [ ] Export SOCIAL_ICONS object: { instagram: <Icon />, ... } (use existing icon library or SVG)
- [ ] Placeholder strategy: empty string if env var not set
- [ ] Test: vitest test config loads, defaults to empty strings if env not set

**Dependency:** None  
**Estimated:** 30 LOC

---

### Task 3b.6: Add Missing Keyframes to globals.css

**Type:** Styling  
**Files affected:**
- `src/app/globals.css` (extend existing)

**Acceptance:**
- [ ] Add @keyframes sdFlip: rotateY(0deg) → rotateY(180deg) (for glossary flashcards)
- [ ] Verify existing keyframes: sdPulse, sdSpin, sdLive, sdRise (already present per design)
- [ ] No other style changes
- [ ] Test: CSS parses, animations work in browser (Playwright visual test optional)

**Dependency:** None  
**Estimated:** ~30 LOC

---

### Task 3b.7: Add Mobile Responsive Styles

**Type:** Styling  
**Files affected:**
- `src/components/workshop/Sidebar.tsx` (extend from 3a.3)
- `src/app/taller/[slug]/page.tsx` (or layout CSS module)
- `src/app/globals.css` (media query updates)

**Acceptance:**
- [ ] Media query: @media (max-width: 767px) triggers drawer mode
- [ ] Drawer: position fixed, overlay with scrim, slide-in animation
- [ ] Main content: full width on mobile when drawer closed
- [ ] Hamburger button: visible on mobile, hidden on 768px+
- [ ] Test at breakpoints: 360px, 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll on 360px
- [ ] Content readable (font size, padding scales down)
- [ ] Drawer backdrop click closes sidebar

**Dependency:** Task 3a.3 (Sidebar must have drawer structure)  
**Estimated:** 80 LOC

---

### Task 3b.8: E2E Spec — Taller Section

**Type:** Test  
**Files affected:**
- `tests/e2e/workshop-section-taller.spec.ts` (new)

**Acceptance:**
- [ ] Test: Taller section renders title, instructions
- [ ] Test: placeholder message visible
- [ ] Test: no interactive textareas or form elements
- [ ] Test coverage: RF-008

**Dependency:** Task 3b.1 (TallerSection must exist)  
**Estimated:** 30 LOC

---

### Task 3b.9: E2E Spec — Instalación Section

**Type:** Test  
**Files affected:**
- `tests/e2e/workshop-section-instalacion.spec.ts` (new)

**Acceptance:**
- [ ] Test: steps render with correct order, title, description
- [ ] Test: code block renders with syntax highlighting
- [ ] Test: language label visible (bash, python, etc.)
- [ ] Test: copy button present per code block
- [ ] Test: clicking copy → code copied to clipboard, "✓ Copiado" shows for 2s
- [ ] Test: multiple code blocks independent (copy one doesn't affect others)
- [ ] Test coverage: RF-009

**Dependency:** Task 3b.2 (InstalacionSection must exist)  
**Estimated:** 50 LOC

---

### Task 3b.10: E2E Spec — Glosario Section

**Type:** Test  
**Files affected:**
- `tests/e2e/workshop-section-glosario.spec.ts` (new)

**Acceptance:**
- [ ] Test: glossary renders with all 12 terms as flashcards
- [ ] Test: search input live filters by term (case-insensitive)
- [ ] Test: category buttons filter terms (e.g., "Conceptos" shows only 3 of 12)
- [ ] Test: clicking card flips with smooth 3D animation, reveals definition
- [ ] Test: clicking again flips back
- [ ] Test: empty state appears if no results
- [ ] Test coverage: RF-010

**Dependency:** Task 3b.3 (GlosarioSection must exist), Slice 3a merged (glossary_terms in DB)  
**Estimated:** 60 LOC

---

### Task 3b.11: E2E Spec — Social Footer

**Type:** Test  
**Files affected:**
- `tests/e2e/workshop-social-footer.spec.ts` (new)

**Acceptance:**
- [ ] Test: social footer visible in sidebar
- [ ] Test: 4 icons present (Instagram, LinkedIn, TikTok, YouTube)
- [ ] Test: clicking icon opens URL in new tab (if URL configured, else no-op)
- [ ] Test coverage: RF-007

**Dependency:** Task 3b.4 (SocialFooter must exist)  
**Estimated:** 20 LOC

---

### Task 3b.12: E2E Spec — RLS Boundary (full)

**Type:** Test  
**Files affected:**
- `tests/e2e/workshop-rls.spec.ts` (extend from 3a.14)

**Acceptance:**
- [ ] Test: User A with redeemed access to Workshop 1 can see sections, User B cannot (4th scenario from RF-012)
- [ ] Test: User cannot insert section_visits for other users
- [ ] Test coverage: RF-012 (full, scenarios 9.1–9.4)

**Dependency:** Task 3a.8 (route guard), Slice 3a merged (RLS policies in place)  
**Estimated:** 30 LOC

---

### Task 3b.13: E2E Spec — Responsive Design (Mobile)

**Type:** Test  
**Files affected:**
- `tests/e2e/workshop-responsive.spec.ts` (new)

**Acceptance:**
- [ ] Test: viewport 360px → hamburger button visible, sidebar hidden
- [ ] Test: clicking hamburger → sidebar drawer slides in
- [ ] Test: clicking backdrop → drawer closes
- [ ] Test: main content readable, no horizontal scroll
- [ ] Test: all section components render correctly on 360px
- [ ] Test at breakpoints: 360px, 375px, 768px (hamburger disappears at this width)
- [ ] Test coverage: RF-015

**Dependency:** Task 3b.7 (mobile styles must exist)  
**Estimated:** 50 LOC

---

### Task 3b.14: E2E Spec — Full User Flow (End-to-End)

**Type:** Test  
**Files affected:**
- `tests/e2e/workshop-e2e-full-flow.spec.ts` (new)

**Acceptance:**
- [ ] Test scenario 12.1 from spec: user logs in, navigates /taller/taller-x
- [ ] Test: Inicio loads (progress 0%)
- [ ] Test: click Aprendizaje → carousel renders, notes toggle works (progress 20%)
- [ ] Test: click Taller → placeholder visible (progress 40%)
- [ ] Test: click Instalación → steps render, code copy works (progress 60%)
- [ ] Test: click Glosario → search filters, flashcard flip works (progress 80%)
- [ ] Test: reload page → progress persists at 80%
- [ ] Test: click back-to-catalog → navigates to /catalogo
- [ ] Test coverage: All RFs integrated

**Dependency:** All section components (3b.1–3b.3), Slice 3a merged  
**Estimated:** 80 LOC

---

### Task 3b.15: Code Quality — Linting & Type Check (3b)

**Type:** QA  
**Acceptance:**
- [ ] Run `pnpm lint` → no errors in new 3b files
- [ ] Run `pnpm build` → TypeScript compile succeeds
- [ ] No regressions from slice 3a

**Dependency:** All tasks 3b.1–3b.14  
**Estimated:** (mechanical, ~5 min)

---

### Task 3b.16: E2E Gate & Verification (full)

**Type:** QA  
**Acceptance:**
- [ ] Run full e2e suite: `pnpm test:e2e` (all migrations, seeds, components in place)
- [ ] All 8 spec files pass (navigation, inicio, aprendizaje, taller, instalacion, glosario, social, rls, responsive, full-flow)
- [ ] No flaky tests (run 2x to verify)
- [ ] All RFs validated (RF-001 through RF-015)
- [ ] Zero RLS leaks
- [ ] Mobile responsiveness verified at 360px

**Dependency:** Tasks 3b.8–3b.14, Slice 3a merged  
**Estimated:** (execution time ~4-5 min, no new code)

---

### Task 3b.17: Prepare Commit & PR Description (3b)

**Type:** Delivery  
**Acceptance:**
- [ ] Commit message: `feat(workshop-sections 3b): complete section renderers, social footer, full e2e coverage`
- [ ] PR title: `feat: workshop detail view (slice 3b) — Taller + Instalación + Glosario + social footer`
- [ ] PR body includes:
  - Summary: what was delivered
  - Key files: 3 new sections, social config, responsive styles
  - Testing: 8 e2e specs, full user flow, RLS boundary validation
  - Notes: depends on slice 3a merged; no new dependencies added
  - Related: change 4 (exercises-autosave) extends Taller section

**Dependency:** Task 3b.16 (tests must pass)  
**Estimated:** (mechanical, ~10 min)

---

## Dependency Graph

```
Sequential:
  ├─ 3a.1 (migrations)
  │  ├─ 3a.2 (Zod schemas)
  │  │  ├─ 3a.6, 3a.7, 3a.8 (components using schemas)
  │  │  └─ 3b.1, 3b.2, 3b.3 (more components)
  │  ├─ 3a.9 (Server Action)
  │  └─ 3a.10 (seed fixtures)
  │
  ├─ 3a.3 (Sidebar)
  │  └─ 3a.4 (ProgressBar)
  │
  ├─ 3a.5 (SectionRenderer) [depends on 3a.6, 3a.7]
  │  └─ 3a.8 (route, imports it)
  │
  └─ [3a tests: 3a.11–3a.14] depend on all 3a components + migrations + seed
  
  MERGE: Slice 3a to master

  ├─ 3b.1, 3b.2, 3b.3 [depend on 3a merged for table access]
  │  └─ [3b tests: 3b.8–3b.14] depend on all 3b components
  │
  └─ 3b.4, 3b.5 [social config, independent]
  
  ├─ 3b.6, 3b.7 [styles, independent]
  │
  MERGE: Slice 3b to master

Parallel (can run concurrently):
  - 3a.2 + 3a.3 + 3a.4 (Zod + Sidebar + ProgressBar)
  - 3a.6 + 3a.7 (Inicio + Aprendizaje sections)
  - 3b.4 + 3b.5 (social config + icons)
  - 3b.6 + 3b.7 (CSS/styles)
```

---

## Work Unit Slicing for Implementation

**Slice 3a** should be committed in 2–3 work units (to keep diffs reviewable):

1. **WU 3a-I: Infrastructure** (migrations + Zod + SectionRenderer wrapper)
   - 3a.1, 3a.2, 3a.5, 3a.9, 3a.10
   - ~350 LOC
   - Commit: `feat: create migrations, zod schemas, section renderer`

2. **WU 3a-II: Sidebar + Route** (sidebar, progress bar, route guard)
   - 3a.3, 3a.4, 3a.8
   - ~310 LOC
   - Commit: `feat: create sidebar, progress bar, taller detail route`

3. **WU 3a-III: Sections + E2E** (Inicio, Aprendizaje, tests)
   - 3a.6, 3a.7, 3a.11–3a.14, 3a.16, 3a.17
   - ~520 LOC
   - Commit: `feat: create Inicio + Aprendizaje sections, add e2e specs`

**Slice 3b** should be committed in 2–3 work units:

1. **WU 3b-I: Remaining Sections** (Taller, Instalación, Glosario)
   - 3b.1, 3b.2, 3b.3
   - ~700 LOC
   - Commit: `feat: create Taller, Instalación, Glosario sections`

2. **WU 3b-II: Social + Styles** (social footer, config, responsive styles)
   - 3b.4, 3b.5, 3b.6, 3b.7
   - ~200 LOC
   - Commit: `feat: add social footer, config, mobile responsive styles`

3. **WU 3b-III: E2E Full Coverage** (all 3b tests)
   - 3b.8–3b.14, 3b.15, 3b.16
   - ~280 LOC
   - Commit: `test: add comprehensive e2e specs for all sections + mobile`

---

## Risks & Mitigations Cached from Design

| Risk | Mitigation | Owner |
|------|-----------|-------|
| **R-001: RLS EXISTS query performance** | Index on `(workshop_id, user_id, redeemed_at)` in workshop_access. Test with EXPLAIN ANALYZE. | Apply phase (verify in tests) |
| **R-002: Progress bar latency** | Optimistic update: increment % on client before Server Action resolves; sync async. If fails, refetch. | Apply phase (D-1 decision locked) |
| **R-003: Mobile sidebar overflow on 360px** | Drawer is scrollable (max-height: 100vh). Footer sticky at bottom or separate section. | Apply phase (3b.7, 3b.13) |
| **R-004: Flashcard flip animation stutter** | Use `will-change: transform`. Fallback: cross-fade if transform unsupported (graceful degradation). | Apply phase (3b.3, 3b.13) |
| **R-005: Seed data not provided** | Proposal includes full schema. Apply phase provides pre-filled samples (Jennifer can override in change 5). | Apply phase (3a.10) |
| **R-006: Content schema rigidity** | Schema per ADR-001 allows nullable optional fields (e.g., `pdf_url?`). Small additions won't break. | Design locked, no risk |

---

## Spec-to-Design Reconciliation Notes

**No divergences found** between spec (1406 LOC) and design (909 LOC). Both sources agree on:
- ✓ Zod discriminated union per ADR-001
- ✓ RLS via EXISTS on workshop_access.redeemed_at
- ✓ Server-side section_visits table (D-1)
- ✓ Hamburger drawer on 360px (D-2)
- ✓ Server Action recordSectionVisit (D-3)
- ✓ Component file structure (D-4)
- ✓ Complete SQL migrations (D-5)
- ✓ Single route /taller/[slug], no sub-routes (D-6)
- ✓ Config file for social URLs (D-7)
- ✓ Carousel with notes toggle (D-8)
- ✓ Copy button + confirmation (D-9)
- ✓ Client-side search/filter for glossary (D-10)
- ✓ Keyframes sdFlip + sdCheck (D-11)
- ✓ Seed data schema finalized (D-12)

**Action for apply:** No adjustments needed. Design decisions are authoritative; implement as specified.

---

## Pre-Implementation Checklist (for Jennifer/Apply phase)

- [ ] Confirm slice 3a & 3b will run in separate PRs (already approved, just confirm)
- [ ] Provide social media URLs (or confirm empty defaults acceptable)
- [ ] Confirm seed content_json examples match live workshop data (spec has Engram taller examples)
- [ ] Verify Next.js 16 `await params` syntax will be used in route handler
- [ ] Verify Supabase project has sufficient RLS scope (typically yes, but confirm for peace of mind)

---

## Estimated Timeline (Apply Phase)

| Phase | Duration | Notes |
|-------|----------|-------|
| **3a implementation** | 8–10 hours | WU 3a-I: 2h, WU 3a-II: 2h, WU 3a-III: 4–6h (e2e can be tricky) |
| **3a e2e gate + PR** | 1–2 hours | Run full suite, fix any flakes, prepare PR description |
| **SQL migrations run** | 15 min | Jennifer runs 3 migration files in Supabase SQL Editor |
| **3b implementation** | 8–10 hours | WU 3b-I: 3h, WU 3b-II: 1h, WU 3b-III: 4–6h (full e2e can be slow) |
| **3b e2e gate + PR** | 1–2 hours | Run full suite, verify mobile at 360px, prepare PR description |
| **Review + merge** | 2–4 hours per PR | Standard review, address feedback, merge to master |
| **Total** | ~25–35 hours | Realistic for 2 chained PRs with full e2e coverage |

---

## Summary

**Total tasks:** 37 (18 in slice 3a, 17 in slice 3b, plus gate/QA steps)  
**Total estimated LOC:** ~2,500 (1,190 in 3a + 1,100 in 3b + seed/config/styles)  
**Critical path:** 3a.1 → 3a.2 → parallel (3a.3, 3a.6, 3a.7) → 3a.8 → tests → merge → 3b  
**E2E coverage:** 18 scenarios across 8 spec files, full RLS boundary, mobile responsiveness  
**Risk level:** Low (all decisions locked, pattern copied from change 2, no new dependencies)

---

## Engram Context

**topic_key:** `sdd/workshop-sections/tasks`  
**type:** architecture  
**status:** Tasks ready for apply phase  
**related:** `sdd/workshop-sections/proposal`, `sdd/workshop-sections/spec`, `sdd/workshop-sections/design`
