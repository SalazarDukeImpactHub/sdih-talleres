# Proposal — workshop-sections

**Change ID:** workshop-sections  
**Position in SDD plan:** 3 of 8 (brief §13)  
**Status:** Proposal (ready for spec)  
**Decision owner:** Jennifer Salazar Duque  
**Architect:** Salazar Duke Dev System  
**Proposal date:** 2026-06-12

---

## Intent

**Problem:** After users redeem workshop access (change 2), they land in a catalog with a disabled "Continuar" button (brief §7.2). The taller detail view (`/taller/[slug]`) doesn't exist, and sections (Inicio, Aprendizaje, Taller, Instalación, Glosario) are not implemented. Users cannot consume workshop content.

**Why now:** Change 2 (catalog-and-access) successfully archived. RLS and access model validated. Sections are the next critical path item — they unblock exercise autosave (change 4) and admin content management (change 5).

**Success looks like:**
- Clicking "Continuar" from WorkshopCard navigates to `/taller/[slug]` with full sidebar + 5 sections
- User navigates between sections via sidebar tabs with active glow indicator
- Progress bar in sidebar header shows % of sections visited
- Each section renders correctly: Inicio (hero + quick links), Aprendizaje (carousel + notes), Taller (placeholder for exercises), Instalación (steps + code blocks), Glosario (search + flashcards from DB)
- RLS enforces: only users with redeemed workshop_access can view sections
- E2E suite covers 5 section flows + progress tracking + RLS boundary

---

## Scope — In-Scope

### Tables (create with migrations)
- **`sections`** — workshop_id, type enum (5 fixed values), content_json (discriminated union per ADR-001), order. One per type per workshop. RLS SELECT via EXISTS (workshop_access.redeemed_at IS NOT NULL).
- **`glossary_terms`** — workshop_id, term, definition, category. Same RLS.
- **`section_visits`** (optional, for progress tracking) — user_id, section_id, visited_at. Tracks which sections user has seen for progress bar calculation.

### Components & Routes

**Route:** `/taller/[slug]`
- Server layout component: fetch workshop + user's access (RLS guard)
- Client layout wrapper with sidebar + main content area

**Sidebar component (sticky, 256px):**
- Back to catalog button
- 5 section tabs with icons (Inicio, Aprendizaje, Taller, Instalación, Glosario)
- Active tab indicator with cyan glow + underline animation
- Progress bar in header (shows % of sections visited / 5)
- Social links footer (Instagram, LinkedIn, TikTok, YouTube) — URLs from config, placeholder strategy decided in design phase

**Section renderers (5 components):**
1. **Inicio** — Title + description + hero quick-links grid (4 cards to other sections)
2. **Aprendizaje** — Title + slide carousel (prev/next buttons), slide notes toggle, PDF download link
3. **Taller** — Title + instructions + placeholder structure (exercises from change 4 will extend this). No textarea interactivity in change 3.
4. **Instalación** — Title + numbered steps + code blocks with copy button + syntax highlighting + success message
5. **Glosario** — Title + search input (live filter by term), category filter buttons, glossary terms as flashcards (click to flip)

**Social footer config:** `src/lib/config/social.ts` with Instagram, LinkedIn, TikTok, YouTube placeholders. Jennifer fills in URLs during change 3 review or design phase.

### Data & Validation

**Content schema** — Fixed per ADR-001 (discriminated union, one schema per section type):
```typescript
// Simplified structure; exact fields defined in design
type SectionContentJson =
  | { type: 'inicio'; title: string; description: string; quick_links: { label; target_section }[] }
  | { type: 'aprendizaje'; title: string; slides: { title; body; kicker; notes? }[]; pdf_url?: string }
  | { type: 'taller'; title: string; instructions: string } // exercises table comes in change 4
  | { type: 'instalacion'; title: string; steps: { order; title; description; code; language }[] }
  | { type: 'glosario'; title: string; search_placeholder: string } // terms from glossary_terms table
```

Zod schema validates content_json at runtime. Render switch by `type`.

### RLS Policies
- **sections:** `SELECT USING (EXISTS (SELECT 1 FROM workshop_access wa WHERE wa.workshop_id = sections.workshop_id AND wa.user_id = auth.uid() AND wa.redeemed_at IS NOT NULL))`
- **glossary_terms:** Same.
- **section_visits** (if needed): `SELECT/INSERT USING (user_id = auth.uid())`

### Seed & Fixtures
- Extend `resetSeedUser()` helper to create 5 Section rows per seeded workshop (one per type, with sample content_json)
- Extend with 12 GlossaryTerm rows per workshop
- Extend e2e fixtures (Playwright helpers)

### E2E Coverage

New Playwright specs:
- `workshop-section-navigation.spec.ts` — sidebar tabs, active glow, clickable navigation
- `workshop-section-inicio.spec.ts` — hero + quick links render, links navigate
- `workshop-section-aprendizaje.spec.ts` — carousel prev/next, notes toggle, PDF link
- `workshop-section-taller.spec.ts` — placeholder structure, counter shows (exercises not interactive yet)
- `workshop-section-instalacion.spec.ts` — steps render, code block copy button works
- `workshop-section-glosario.spec.ts` — search filters, category buttons, flashcard flip

RLS tests:
- Unauthorized user (no workshop_access) → 403 on `/taller/[slug]`
- Unredeemed access → 403
- Redeemed access → 200 + sections visible

---

## Scope — Out-of-Scope

- **Exercise table + ExerciseProgress + autosave** → change 4
- **Admin content management (CRUD sections)** → change 5
- **Transactional emails** → change 6
- **WhatsApp button** → change 7 (brief §7 says it's visible in portal, but brief §3 caches it as "decision deferred", and brief §12 says "footer del sidebar", which is the social links area in change 3. To avoid confusion: social **links** (config URLs) are in change 3; the **WhatsApp button** (floating, interactive) is change 7.)
- **VPN middleware** → change 8
- **Markdown rendering** within text fields → deferred to v1.1 if needed (using plain text in v1)
- **Mobile sidebar drawer** (if needed) → design decides, may be separate PR

---

## Approach & Rationale

### Data Model

The `sections` table enforces 1:1 relationship with section type per workshop (UNIQUE constraint). This matches the brief's design intent: fixed 5-tuple structure, not flexible/extensible.

The `content_json` field uses the discriminated union schema per **ADR-001** (accepted by Jennifer). This provides:
- Type safety via Zod per-section-type
- Clean React render with switch by type
- Predictable admin panel in change 5 (5 forms, one per type, vs. generic block editor)
- Zero external markdown dependency in v1

The `glossary_terms` table separates glossary content from Section (Glosario section just does the rendering + filtering).

The `section_visits` table (optional) tracks which sections a user has seen, enabling simple progress bar calculation (% = visited / 5). Change 4 will extend this to count exercise completion.

### Route & Layout Structure

Route `/taller/[slug]` is a Server Component that:
1. Fetches the workshop by slug
2. Checks user has redeemed workshop_access (RLS enforces, but explicit check provides clear guard)
3. Renders the layout (sidebar + main)
4. Main content is a router: query string or state tracks active section, child renders that section

Sidebar is a Client Component (needs interactivity: tab clicks, progress bar updates). Props are serializable (active section, progress %, section list). No functions from server to client (lesson #1 from archive-report).

### Progress Bar

In change 3, progress = (sections_visited / 5). When user clicks a section tab, record visit in `section_visits`, increment sidebar progress bar.

The bar refetches or uses optimistic update (design decides). Change 4 extends the metric to also count exercise completion.

### Social Links Config

Store social URLs in a config file (`src/lib/config/social.ts`):
```typescript
export const SOCIAL_LINKS = {
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || '',
  linkedin: process.env.NEXT_PUBLIC_LINKEDIN_URL || '',
  tiktok: process.env.NEXT_PUBLIC_TIKTOK_URL || '',
  youtube: process.env.NEXT_PUBLIC_YOUTUBE_URL || '',
};
```

Placeholder strategy: environment variables with empty defaults. Jennifer fills in `.env.local` during review or design phase. Footer component reads from config, renders icons with links.

### Slicing Strategy

Total estimated delta: ~2,500 lines. Exceeds 400-line budget. Split into **2 chained PRs** (lesson #6 from archive-report):

**Slice 3a (~1,200 lines):**
- Migrations (sections + glossary_terms tables)
- Zod schemas for content_json
- Sidebar component (skeleton + icons + progress bar logic)
- Inicio + Aprendizaje section renderers
- `/taller/[slug]` basic route + seed fixtures
- Partial e2e (navigation, Inicio, Aprendizaje)

**Slice 3b (~1,300 lines):**
- Taller + Instalación + Glosario section renderers
- Full `/taller/[slug]` routing + active section state
- Social footer component + config
- Complete e2e suite
- RLS validation tests

### Design Decisions Left for Design Phase

1. **Progress bar persistence** — localStorage vs. server-side `section_visits` table (tradeoff: client-side is fast but lost on logout; server-side is persistent but requires DB roundtrip). Recommendation: server-side (simple RLS, aligns with lesson #1: server owns state).

2. **Sidebar on mobile** — fixed drawer vs. hamburger menu vs. bottom nav. Brief doesn't spec this. Design decides based on prototype responsiveness check.

3. **Social footer appearance** — just icons, icons + labels, or cards. Brief says "footer del sidebar"; design translates to visuals.

4. **Taller section placeholder text** — "Ejercicios disponibles en change 4" or a visual structure (e.g., 4 empty card slots). Design decides clarity.

---

## Blockers & External Dependencies

1. **Jennifer must provide seed data** — 5 Section rows (one per type, with sample content_json) + 12 GlossaryTerm rows per test workshop. Change 3 migration creates tables; fixtures load seed. Without seed, e2e cannot run.

2. **Social URLs** — Jennifer provides 4 URLs (Instagram, LinkedIn, TikTok, YouTube) during review or via env vars. Without them, footer links are broken. Placeholder strategy mitigates: footer renders but links are empty. Can be filled post-review.

3. **Prototype completion** — Design phase must finalize Taller placeholder text, mobile sidebar pattern, and social footer visuals.

---

## Acceptance Criteria by Slice

### Slice 3a
- [ ] Sidebar renders with 5 tabs (Inicio active by default)
- [ ] Progress bar shows 0% initially
- [ ] Clicking Inicio tab → renders Inicio section with hero + quick links
- [ ] Clicking quick link to Aprendizaje → navigates to Aprendizaje section
- [ ] Aprendizaje section renders carousel with prev/next buttons
- [ ] Notes toggle on Aprendizaje section works
- [ ] PDF link present on Aprendizaje section
- [ ] Unauthorized user (no access) → 403 on `/taller/[slug]`
- [ ] E2E suite passes: navigation, Inicio flow, Aprendizaje flow

### Slice 3b
- [ ] Taller section renders with instructions + placeholder structure
- [ ] Instalación section renders steps + code blocks with copy button
- [ ] Glosario section renders search input + category filters + flashcards
- [ ] Flashcard flip animation works
- [ ] Social links footer rendered with icons + links
- [ ] Clicking any section tab updates progress bar (visited / 5)
- [ ] Clicking back-to-catalog button navigates to workshop grid
- [ ] RLS enforces: user with redeemed access sees sections; user with unredeemed access gets 403
- [ ] E2E suite passes: all 5 sections, progress tracking, RLS boundary, mobile responsiveness check

---

## Data Model Summary

### `sections` table
```sql
CREATE TABLE public.sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('inicio','aprendizaje','taller','instalacion','glosario')),
  content_json JSONB NOT NULL,
  section_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workshop_id, type)
);
CREATE INDEX idx_sections_workshop_id ON public.sections(workshop_id);
```

### `glossary_terms` table
```sql
CREATE TABLE public.glossary_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  term TEXT NOT NULL,
  definition TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workshop_id, term)
);
CREATE INDEX idx_glossary_terms_workshop_id ON public.glossary_terms(workshop_id);
```

### `section_visits` table (optional, for progress tracking)
```sql
CREATE TABLE public.section_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  visited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, section_id)
);
CREATE INDEX idx_section_visits_user_id ON public.section_visits(user_id);
```

---

## Slices & Size Estimate

| Component | Slice | Lines | Notes |
|-----------|-------|-------|-------|
| Migrations (SQL) | 3a | 80 | sections + glossary_terms create + index |
| Zod schemas | 3a | 60 | content_json discriminated union per ADR-001 |
| SectionNavbar component | 3a | 120 | tabs + icons + glow + progress bar stub |
| ProgressBar component | 3a | 80 | CSS gradient + % calculation |
| Inicio section component | 3a | 150 | hero + quick-links grid |
| Aprendizaje section component | 3a | 280 | carousel + notes toggle + PDF link |
| Taller section component | 3b | 200 | instructions + placeholder structure |
| Instalación section component | 3b | 250 | steps + code blocks + copy button |
| Glosario section component | 3b | 200 | search + category filter + flashcards |
| SectionRenderer wrapper | 3a | 100 | switch by type |
| `/taller/[slug]` route | 3a | 80 | server layout + guard |
| Social footer component | 3b | 50 | icons + links from config |
| Social config file | 3b | 20 | SOCIAL_LINKS object |
| RLS policies | 3a/3b | 60 | sections + glossary_terms + section_visits |
| Seed fixtures | 3a | 100 | 5 sections + 12 glossary terms per workshop |
| E2E tests | 3b | 250 | 6 specs + RLS tests |
| **Total 3a** | | **~1,200** | Migrations + sidebar + 2 sections |
| **Total 3b** | | **~1,300** | 3 sections + social + tests |

---

## Open Decisions for Design Phase

1. **Progress bar calculation base:** Visit-based (sections visited / 5) vs. exercise-based (once change 4 wires exercises). Decision: visit-based in change 3, extend in change 4. ✓ Closed.

2. **Taller section in change 3:** Placeholder only (safe) or structure ready with no interactivity (couples slightly to change 4). Recommendation: Placeholder text only ("Ejercicios disponibles en change 4"). Design finalizes wording.

3. **Section visits persistence:** Client-side localStorage (fast, lost on logout) vs. server-side table (persistent, adds DB roundtrip). Recommendation: server-side `section_visits` table (simple RLS, matches lesson #1: server owns state). Design finalizes implementation.

4. **Sidebar on mobile:** Fixed drawer, hamburger menu, or bottom nav. Prototype doesn't specify. Design decides based on 360px responsiveness check.

5. **Social links in footer:** Just icons, or icons + labels. Design decides aesthetic.

6. **Taller placeholder style:** Text-only message or visual empty structure (e.g., 4 empty cards). Design clarifies.

---

## Review Workload Forecast

| Metric | Estimate | Notes |
|--------|----------|-------|
| Chained PRs recommended | **Yes** | 2 slices (~1,200 + ~1,300 lines each, total ~2,500) |
| 400-line budget risk | **High** | Total delta exceeds budget; slicing required |
| Async-able work | Sections + components (can parallelize renderers) | Design sets specs; implementation is straightforward |
| Estimated review time | 2h per PR (spec clarity, RLS validation, e2e coverage) | Archive-report lesson #3: isolate specs per slice |
| Decision needed before apply | **No** | All critical decisions locked (ADR-001, slicing, RLS, content schema) |

---

## Risks & Mitigations

1. **RLS via EXISTS on workshop_access** — More complex than simple foreign key. Could have edge cases with concurrent access or revoked keys.
   - *Mitigation:* Copy RLS pattern from change 2 (catalog-and-access archive-report lesson #1). Exhaustive RLS tests (unauthorized, unredeemed, redeemed flows).

2. **Taller section couples to Exercise table (change 4)** — If change 3 tries to query Exercise before table exists, FK error.
   - *Mitigation:* Taller section is placeholder-only in change 3. Change 4 adds Exercise table + wires the query. No coupling.

3. **Progress bar latency** — If progress bar refetches from DB on every section click, could feel slow.
   - *Mitigation:* Design phase decides: optimistic update (client) vs. server refetch. Recommendation: session-based cache or localStorage for instant feedback, sync to server async.

4. **Sidebar sticky positioning breaks on mobile (256px on 360px screen = 71% width)** — May overlap content.
   - *Mitigation:* Design phase finalizes mobile pattern (hamburger vs. drawer vs. bottom nav). Slice 3b includes responsive check.

5. **Seed data loading** — If Jennifer doesn't provide sample content_json for sections, e2e cannot run.
   - *Mitigation:* Proposal includes seed schema. Orchestrator clarifies with Jennifer before apply phase. Default seed data provided in migration (can be overridden).

---

## Boundary with Change 4 (exercises-autosave)

**Change 3 delivers:**
- Taller section structure + instructions field from content_json
- Placeholder: "Ejercicios disponibles en change 4" or empty structure
- Progress bar: visits-based (% = sections visited / 5)

**Change 4 adds:**
- Exercise table + ExerciseProgress table
- Textarea interactivity (autosave debounce)
- Progress bar extended: (visited sections + exercise completion) / N
- Taller section wires Exercise query + renders interactive cards

**No blocking dependencies** — change 3 is fully functional standalone; change 4 builds on it.

---

## Criteria for Approval

- [ ] All 5 section types render correctly per prototype
- [ ] Sidebar navigation + glow animation match design
- [ ] Progress bar calculation is correct (visited / 5)
- [ ] RLS enforces redeemed access (exhaustive tests)
- [ ] E2E suite passes all flows
- [ ] No build or lint errors
- [ ] Migrations are reversible
- [ ] Seed data loads without errors
- [ ] Mobile responsiveness checked (360px, 768px, 1024px, 1440px)

---

## Next Recommended Phases

→ **sdd-spec** — Document exact Zod schemas, content_json samples per section type, RLS SQL, component APIs  
→ **sdd-design** (parallel to spec) — Finalize sidebar mobile pattern, progress bar appearance, social footer style, Taller placeholder wording, section_visits persistence strategy  
→ **sdd-tasks** — Break slices 3a + 3b into work units, assign to sprints

---

## Artifact References

- **ADR-001** — content_json schema decision (linked from this proposal, source of truth: `docs/decisions/ADR-001-content-json-schema-fijo-por-tipo.md`)
- **Brief §6** — Data model definition
- **Brief §7.2** — Onboarding flow: "Aterriza en sección Inicio del taller"
- **Brief §7.3** — Consumo del taller: "Recorre las 5 secciones desde el sidebar"
- **Brief §12** — Cached decisions: "Redes sociales en footer del sidebar"
- **Archive-report (change 2)** — Lessons: Server/Client boundary, RLS pattern, chained PRs, e2e isolation

---

## Engram Topic Key

**topic_key:** `sdd/workshop-sections/proposal`  
**type:** architecture  
**status:** Ready for spec phase
