# Spec — workshop-sections

**Change ID:** workshop-sections  
**Position in SDD plan:** 3 of 8  
**Status:** Spec (ready for design + tasks)  
**Executed:** 2026-06-12  
**Slicing:** 2 chained PRs (3a ~1,200 lines, 3b ~1,300 lines)

---

## Executive Summary

After users redeem workshop access, they navigate to `/taller/[slug]` where they consume workshop content across 5 fixed section types (Inicio, Aprendizaje, Taller, Instalación, Glosario) via a sidebar navigator with progress tracking and RLS-enforced access control. All sections render content from discriminated-union `content_json` schema (ADR-001) with GlossaryTerm data sourced from a separate table. Slice 3a delivers sidebar + 2 sections; Slice 3b adds 3 sections, routing, and complete e2e coverage.

---

## Requirements — Functional

### RF-001 [3a] Route Guard & Server Layout

Server layout component at `/taller/[slug]` must:
1. Fetch workshop by slug
2. Check RLS: user has redeemed workshop_access (throw 403 if not)
3. Render stable sidebar (sticky left, 256px, icons + labels + progress bar) + main content area
4. Main content area = router for active section (determined by query string or state)
5. Sidebar always visible; navigation state persists during session

**Acceptance:** Route loads for authenticated user with redeemed access. Unauthorized user sees 403. Unredeemed user sees 403.

---

### RF-002 [3a] Sidebar Navigation Component

Sidebar Client Component receives `activeSection` and `sectionsMetadata` as props (server passes both).

**Structure:**
- Header: Back-to-catalog button (icon + label, navigates to `/catalogo`)
- Tabs: 5 clickable tabs labeled Inicio / Aprendizaje / Taller / Instalación / Glosario, each with icon + label
  - Icons must match design prototype (home, book, tool, terminal, dictionary)
  - Active tab: cyan glow + underline animation (see design)
  - Clicking tab updates URL query string `?section={type}` and parent re-renders active section
- Progress bar: gradient, shows `% = sections_visited / 5` (see RF-006)
- Footer: Social links (see RF-007)

**Component API:**
```typescript
interface SidebarProps {
  activeSection: 'inicio' | 'aprendizaje' | 'taller' | 'instalacion' | 'glosario';
  progressPercent: number; // 0-100
  onSectionChange: (section: typeof activeSection) => void; // client-side handler
  sections: Array<{ type: string; title: string; icon: string }>;
}
```

**Acceptance:** Clicking a tab changes active section (URL updates). Active tab has cyan glow. Progress bar renders. Sidebar sticky on scroll. Mobile behavior per design decision (RF-015).

---

### RF-003 [3a] Section Content Schema (Zod Discriminated Union)

All sections store content in `Section.content_json` as discriminated union per **ADR-001**. Zod validates at runtime.

**Schema Definition:**

```typescript
// Shared imports
import { z } from 'zod';

// Base slide structure for Aprendizaje
const SlideSchema = z.object({
  title: z.string(),
  body: z.string(),
  kicker: z.string(),
  notes: z.string().optional(),
});

// Base step structure for Instalación
const StepSchema = z.object({
  order: z.number().int().min(1),
  title: z.string(),
  description: z.string(),
  code: z.string(),
  language: z.enum(['bash', 'python', 'javascript', 'typescript', 'sql', 'html', 'css', 'json', 'yaml']),
});

// Inicio section (welcome/hero)
const InicioContentSchema = z.object({
  type: z.literal('inicio'),
  title: z.string(),
  description: z.string(),
  quick_links: z.array(
    z.object({
      label: z.string(),
      target_section: z.enum(['aprendizaje', 'taller', 'instalacion', 'glosario']),
    })
  ),
});

// Aprendizaje section (learning/slides)
const AprendizajeContentSchema = z.object({
  type: z.literal('aprendizaje'),
  title: z.string(),
  slides: z.array(SlideSchema).min(1),
  pdf_url: z.string().url().optional(),
});

// Taller section (exercises — placeholder in change 3)
const TallerContentSchema = z.object({
  type: z.literal('taller'),
  title: z.string(),
  instructions: z.string(),
});

// Instalación section (setup/checklist)
const InstalacionContentSchema = z.object({
  type: z.literal('instalacion'),
  title: z.string(),
  steps: z.array(StepSchema).min(1),
  success_message: z.string(),
});

// Glosario section (glossary — terms read from table, not from content_json)
const GlosarioContentSchema = z.object({
  type: z.literal('glosario'),
  title: z.string(),
  search_placeholder: z.string(),
});

// Union of all section types
export const SectionContentSchema = z.discriminatedUnion('type', [
  InicioContentSchema,
  AprendizajeContentSchema,
  TallerContentSchema,
  InstalacionContentSchema,
  GlosarioContentSchema,
]);

export type SectionContent = z.infer<typeof SectionContentSchema>;
```

**Usage in component:**
```typescript
const content = SectionContentSchema.parse(section.content_json);
switch (content.type) {
  case 'inicio': return <InicioSection data={content} />;
  case 'aprendizaje': return <AprendizajeSection data={content} />;
  case 'taller': return <TallerSection data={content} />;
  case 'instalacion': return <InstalacionSection data={content} />;
  case 'glosario': return <GlosarioSection data={content} />;
}
```

**Acceptance:** Zod parse succeeds for all 5 types. Invalid content_json throws ParseError. Type narrowing works in switch blocks.

---

### RF-004 [3a] Inicio Section Renderer

Renders welcome/hero section with title, description, and grid of quick-links (4 cards).

**Layout:**
- Hero: title (H1) + description (paragraph)
- Quick-links grid: 4 cards in grid (2x2 or responsive per design)
  - Each card: label + icon + clickable link
  - Clicking card navigates to target section (updates sidebar + main content)

**Data from `content_json`:**
```json
{
  "type": "inicio",
  "title": "Bienvenido al Taller",
  "description": "Acá aprendés X, Y, Z.",
  "quick_links": [
    { "label": "Aprendizaje", "target_section": "aprendizaje" },
    { "label": "Taller", "target_section": "taller" },
    { "label": "Instalación", "target_section": "instalacion" },
    { "label": "Glosario", "target_section": "glosario" }
  ]
}
```

**Acceptance:** Title + description render. 4 quick-link cards render. Clicking card navigates to target section.

---

### RF-005 [3a] Aprendizaje Section Renderer

Renders learning section with slide carousel, notes toggle, and optional PDF download.

**Layout:**
- Title (H1) + description (optional)
- Slide carousel:
  - Single slide visible at a time
  - Slide content: title, body (paragraph), kicker (subtitle), notes (optional, hidden by toggle)
  - Slide counter: "1 of 5" below carousel
  - Prev/next buttons (arrows)
  - Navigation: keyboard arrows work (design decision)
- Notes toggle: button "Ver notas / Ocultar notas", shows/hides notes below slide body
- PDF link (if `pdf_url` present): "Descargar PDF" button with icon

**Data from `content_json`:**
```json
{
  "type": "aprendizaje",
  "title": "Aprendizaje del Taller",
  "slides": [
    {
      "title": "Slide 1",
      "body": "Content here",
      "kicker": "Subtitle",
      "notes": "Instructor notes"
    },
    ...
  ],
  "pdf_url": "https://example.com/slides.pdf"
}
```

**Acceptance:** Carousel renders with slide title, body, kicker. Counter shows correct position. Prev/next buttons navigate. Notes toggle hides/shows notes. PDF link present if url provided. Keyboard arrows work.

---

### RF-006 [3a] Progress Bar Component

Shows percentage of sections visited (0-100%). Persists across page reloads (decision: server-side `section_visits` table, see RF-009).

**Visual:**
- Gradient bar (CSS, design decides exact gradient)
- Percentage label (e.g., "2 of 5" or "40%")
- Updates when user clicks a section tab

**Logic:**
```
progress_percent = (sections_visited.count / 5) * 100
```

**Acceptance:** Progress bar renders with correct %. Bar updates when user visits a new section. Progress persists after page reload (requires server-side `section_visits` persistence, RF-009).

---

### RF-007 [3b] Social Links Footer

Footer component in sidebar (sticky, bottom of sidebar) with social media links (Instagram, LinkedIn, TikTok, YouTube).

**Layout:**
- Icons only (or icons + labels, design decides)
- Each icon clickable, opens URL in new tab
- URLs stored in `src/lib/config/social.ts`

**Config file:**
```typescript
// src/lib/config/social.ts
export const SOCIAL_LINKS = {
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || '',
  linkedin: process.env.NEXT_PUBLIC_LINKEDIN_URL || '',
  tiktok: process.env.NEXT_PUBLIC_TIKTOK_URL || '',
  youtube: process.env.NEXT_PUBLIC_YOUTUBE_URL || '',
};
```

**Acceptance:** Social icons render. Each icon links to correct URL. Icons have :hover state. Links open in new tab. Footer sticky at bottom of sidebar.

---

### RF-008 [3b] Taller Section Renderer (Placeholder)

Renders exercises section with title + instructions + placeholder structure. Actual exercises wired in change 4.

**Layout:**
- Title (H1)
- Instructions (from `content_json.instructions`)
- Placeholder message: "Ejercicios disponibles en la siguiente actualización" (text TBD by design)
- OR: Empty card structure (4 slots for exercises, no interactivity)

**Data from `content_json`:**
```json
{
  "type": "taller",
  "title": "Ejercicios",
  "instructions": "Resolvé estos ejercicios..."
}
```

**Note:** Change 4 adds Exercise table + interactivity. Change 3 Taller is read-only placeholder.

**Acceptance:** Title + instructions render. Placeholder message visible. No interactivity (textareas not editable). Change 4 wires exercises without breaking this.

---

### RF-009 [3b] Instalación Section Renderer

Renders setup/installation section with numbered steps and code blocks.

**Layout:**
- Title (H1)
- Step list (numbered circles + vertical gradient line between steps):
  - Each step: number + title + description
  - Code block (if present): syntax highlighting + copy button + language label (e.g., "bash", "python")
  - Copy button: copies code to clipboard, shows "Copiado" confirmation (1s)
- Success callout at end (optional, design decides)

**Data from `content_json`:**
```json
{
  "type": "instalacion",
  "title": "Instalación",
  "steps": [
    {
      "order": 1,
      "title": "Instalar Node.js",
      "description": "Descargá la última versión...",
      "code": "brew install node",
      "language": "bash"
    },
    ...
  ],
  "success_message": "Instalación completada"
}
```

**Code highlighting:** Use existing syntax highlighting library (e.g., `prism-react-renderer` or `highlight.js`; design phase decides).

**Acceptance:** Steps render with correct order + title + description. Code blocks render with syntax highlighting. Copy button works (copies code, shows confirmation). Language label visible. Success message renders at end.

---

### RF-010 [3b] Glosario Section Renderer

Renders glossary with search, category filtering, and flashcard display.

**Layout:**
- Title (H1)
- Search input: live filter by term (query updates URL or state)
- Category filter buttons: show all categories from GlossaryTerm records, allow multi-select (design decides)
- Glossary cards: grid of flashcards
  - Front: term (bold) + category label
  - Click to flip: shows definition
  - Visual flip animation (CSS)

**Data source:** Query `GlossaryTerm` table filtered by `workshop_id + category (if filter active) + search query`.

**Example query result:**
```typescript
[
  {
    id: 'uuid',
    term: 'Closure',
    definition: 'Una función que...',
    category: 'Conceptos',
  },
  ...
]
```

**Acceptance:** Search input filters terms by name (live). Category buttons filter results. Flashcards render term + category. Clicking card flips to show definition. Flip animation smooth. URL state synced (optional, design decides).

---

### RF-011 [3a] Section Visits Tracking

User visiting a section records a row in `section_visits` table (one visit per user per section, idempotent).

**Trigger:** When user clicks a sidebar tab to view a section, the app records: `{ user_id, section_id, visited_at }` in `section_visits`.

**Query for progress:**
```sql
SELECT COUNT(DISTINCT section_id)
FROM section_visits
WHERE user_id = auth.uid() AND section_id IN (SELECT id FROM sections WHERE workshop_id = $1)
```

**Implementation:** Design decides whether to fetch on every tab click (server trip) or use optimistic client state + async sync. Proposal recommendation: server-side (simple RLS, matches lesson #1: server owns state).

**Acceptance:** Progress bar updates after visiting a section. Count is correct. Multiple visits same section don't increment counter twice. Persists after page reload.

---

### RF-012 [3b] RLS Enforces Redeemed Access

All section-related queries are protected by RLS: `sections`, `glossary_terms`, `section_visits`.

**RLS Policy (all three tables):**
```sql
CREATE POLICY sections_rls_redeemed ON public.sections
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workshop_access
      WHERE workshop_access.workshop_id = sections.workshop_id
        AND workshop_access.user_id = auth.uid()
        AND workshop_access.redeemed_at IS NOT NULL
    )
  );

CREATE POLICY glossary_terms_rls_redeemed ON public.glossary_terms
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workshop_access
      WHERE workshop_access.workshop_id = glossary_terms.workshop_id
        AND workshop_access.user_id = auth.uid()
        AND workshop_access.redeemed_at IS NOT NULL
    )
  );

CREATE POLICY section_visits_rls_user ON public.section_visits
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY section_visits_rls_insert ON public.section_visits
  FOR INSERT
  WITH CHECK (user_id = auth.uid());
```

**Acceptance:** Unauthorized user (no workshop_access) queries sections → empty result (no 403, RLS just filters). Unredeemed user (access.redeemed_at IS NULL) → empty result. Redeemed user → can see and interact with sections. User cannot insert section_visits for other users.

---

### RF-013 [3b] E2E Test Coverage

Six new Playwright specs covering all section types + navigation + RLS:

**`workshop-section-navigation.spec.ts`:**
- User clicks each of 5 tabs, active tab has cyan glow, URL updates, main content changes
- Back-to-catalog button navigates to `/catalogo`
- Progress bar updates when visiting each section

**`workshop-section-inicio.spec.ts`:**
- Inicio section renders title + description + 4 quick-link cards
- Clicking quick-link navigates to target section (sidebar + main content update)
- Glow follows active section

**`workshop-section-aprendizaje.spec.ts`:**
- Carousel renders with slide title, body, kicker
- Prev/next buttons work, counter shows correct position
- Notes toggle hides/shows notes
- PDF link clickable (if url provided)
- Keyboard arrows navigate carousel

**`workshop-section-taller.spec.ts`:**
- Title + instructions render
- Placeholder message visible
- No textarea interactivity

**`workshop-section-instalacion.spec.ts`:**
- Steps render with correct order, title, description
- Code block renders with syntax highlighting
- Copy button works, shows confirmation
- Language label visible

**`workshop-section-glosario.spec.ts`:**
- Search input filters terms (live)
- Category buttons filter results
- Flashcards render term + category
- Clicking card flips to show definition
- Flip animation smooth

**`workshop-rls.spec.ts`:**
- Unauthorized user: `/taller/[slug]` → 403 (or redirect to catalog)
- Unredeemed user: `/taller/[slug]` → 403 (or redirect)
- Redeemed user: `/taller/[slug]` → 200, sections visible
- User cannot see sections from another user's workshop_access

---

### RF-014 [3a] Migrations — Tables

Two SQL migration files (in order):

**Migration 001: `sections` table**
```sql
CREATE TABLE public.sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('inicio', 'aprendizaje', 'taller', 'instalacion', 'glosario')),
  content_json JSONB NOT NULL,
  section_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(workshop_id, type)
);

CREATE INDEX idx_sections_workshop_id ON public.sections(workshop_id);

-- RLS
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY sections_rls_redeemed ON public.sections
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workshop_access
      WHERE workshop_access.workshop_id = sections.workshop_id
        AND workshop_access.user_id = auth.uid()
        AND workshop_access.redeemed_at IS NOT NULL
    )
  );
```

**Migration 002: `glossary_terms` table**
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

-- RLS
ALTER TABLE public.glossary_terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY glossary_terms_rls_redeemed ON public.glossary_terms
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workshop_access
      WHERE workshop_access.workshop_id = glossary_terms.workshop_id
        AND workshop_access.user_id = auth.uid()
        AND workshop_access.redeemed_at IS NOT NULL
    )
  );
```

**Migration 003: `section_visits` table (optional, for progress tracking)**
```sql
CREATE TABLE public.section_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  visited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, section_id)
);

CREATE INDEX idx_section_visits_user_id ON public.section_visits(user_id);
CREATE INDEX idx_section_visits_section_id ON public.section_visits(section_id);

-- RLS
ALTER TABLE public.section_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY section_visits_rls_user_select ON public.section_visits
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY section_visits_rls_user_insert ON public.section_visits
  FOR INSERT
  WITH CHECK (user_id = auth.uid());
```

**Acceptance:** Migrations run without errors. Tables created with correct columns, constraints, indices. RLS policies attached. Constraints enforced (e.g., UNIQUE(workshop_id, type) prevents duplicate section types).

---

### RF-015 [3b] Responsive Design (Mobile Sidebar)

Sidebar layout on mobile (360px viewport) must not overflow content.

**Design decision pending:** Sidebar becomes fixed drawer (hamburger menu) vs. bottom nav vs. hidden on mobile. Design phase resolves (see design specs).

**Current requirement:** Sidebar must be usable on 360px without blocking main content. If fixed 256px width causes issues, toggle to drawer/hamburger.

**Breakpoints:** Test at 360px, 768px, 1024px, 1440px.

**Acceptance:** Sidebar renders correctly at all breakpoints. Content readable. No horizontal scroll on 360px. Mobile sidebar pattern matches design spec.

---

## Requirements — Non-Functional

### RNF-001 Security — RLS Isolation

RLS policies enforce that users can only see sections + glossary for workshops where they have redeemed access.

**Test matrix:**
- User A with redeemed access to Workshop 1: can see sections for Workshop 1 ✓
- User A with unredeemed access to Workshop 1: cannot see sections for Workshop 1 ✓
- User B: cannot see any of User A's sections ✓
- Admins (if present): subject to same RLS (no bypass) ✓

---

### RNF-002 Accessibility (WCAG AA)

- Sidebar tabs: keyboard-navigable (Tab, arrow keys)
- Active tab: announced via aria-current="page"
- Slide carousel: arrow keys navigate (keyboard support)
- Glosario flashcards: keyboard-flippable (Enter/Space)
- Code copy button: labeled with aria-label
- Search input: labeled <label> + aria-describedby for hints
- Color contrast: ensure 4.5:1 for text on backgrounds

---

### RNF-003 Performance

- Sidebar sidebar render: < 100ms (client-side navigation)
- Section content load: < 200ms (includes RLS query)
- Search/filter (Glosario): < 100ms (client-side filter or debounced server query)
- Code copy: < 50ms (sync operation)
- No layout shift when progress bar updates

---

### RNF-004 Internationalization (i18n)

All user-visible text (tab labels, button labels, placeholder text) must be externalized to i18n files.

**Language support:** Spanish (primary for v1, brief §2.3).

**Key strings to externalize:**
- Tab labels: "Inicio", "Aprendizaje", "Taller", "Instalación", "Glosario"
- Button labels: "Volver al catálogo", "Ver notas", "Descargar PDF", "Copiar", "Copiado"
- Placeholder text: "Buscar en glosario"
- Message strings: "Ejercicios disponibles en la siguiente actualización"

---

### RNF-005 Mobile-First Design (360px+)

Layout must be mobile-first, responsive to 360px minimum viewport width.

- Typography: readable at 360px (font sizes, line heights)
- Touch targets: buttons ≥ 48px (design check)
- Sidebar: hamburger/drawer on mobile (design decision pending, see RF-015)

---

## Acceptance Scenarios (Gherkin)

### Scenario 1.1 [3a] Sidebar Tabs Navigate Between Sections
```gherkin
Given user is logged in and has redeemed access to Workshop "Taller X"
When user navigates to /taller/taller-x
Then Sidebar renders with 5 tabs (Inicio, Aprendizaje, Taller, Instalación, Glosario)
  And Inicio tab is active (cyan glow)
  And main content area shows Inicio section
When user clicks Aprendizaje tab
Then Aprendizaje tab becomes active (cyan glow)
  And main content area shows Aprendizaje section
  And URL updates to /taller/taller-x?section=aprendizaje
```

### Scenario 1.2 [3a] Active Tab Indicator Follows User Navigation
```gherkin
Given user is on Aprendizaje section (tab active with cyan glow)
When user clicks a quick-link from Inicio to jump to Taller
Then Taller tab becomes active (cyan glow)
  And Aprendizaje tab loses glow
  And main content shows Taller section
```

### Scenario 2.1 [3a] Inicio Section Renders Quick Links Grid
```gherkin
Given user is viewing Inicio section
Then main content shows:
  - H1 title from content_json.title
  - Description paragraph from content_json.description
  - 4 quick-link cards (one per quick_links entry)
    - Each card has label + icon
    - Each card is clickable
```

### Scenario 2.2 [3a] Quick Link Navigation Updates Sidebar
```gherkin
Given user is on Inicio section
When user clicks quick-link card for "Aprendizaje"
Then Aprendizaje section loads in main content
  And Aprendizaje tab in sidebar becomes active
```

### Scenario 3.1 [3a] Aprendizaje Carousel Displays Slides
```gherkin
Given user is viewing Aprendizaje section
Then carousel renders slide 1:
  - Title, body, kicker visible
  - Slide counter shows "1 of X"
  - Prev button disabled (or hidden)
  - Next button enabled
```

### Scenario 3.2 [3a] Carousel Navigation Works
```gherkin
Given user is on Aprendizaje slide 1
When user clicks Next button
Then carousel shows slide 2
  And counter shows "2 of X"
  And prev button becomes enabled
```

### Scenario 3.3 [3a] Notes Toggle Hides/Shows Instructor Notes
```gherkin
Given user is viewing Aprendizaje section
  And slide has notes
When user clicks "Ver notas" button
Then notes appear below slide body
When user clicks "Ocultar notas" button
Then notes disappear
```

### Scenario 3.4 [3a] PDF Link Downloads Document
```gherkin
Given Aprendizaje content_json has pdf_url: "https://example.com/slides.pdf"
When user views Aprendizaje section
Then "Descargar PDF" button appears
  And clicking button opens PDF in new tab
```

### Scenario 3.5 [3a] Keyboard Arrows Navigate Carousel
```gherkin
Given user is viewing Aprendizaje carousel
When user presses ArrowRight key
Then carousel advances to next slide
When user presses ArrowLeft key
Then carousel goes to previous slide
```

### Scenario 4.1 [3b] Taller Placeholder Section
```gherkin
Given user is viewing Taller section
Then main content shows:
  - H1 title from content_json.title
  - Instructions text from content_json.instructions
  - Placeholder message: "Ejercicios disponibles en la siguiente actualización"
  AND no interactive textareas or form elements
```

### Scenario 5.1 [3b] Instalación Steps Render with Code Blocks
```gherkin
Given user is viewing Instalación section
Then main content shows:
  - H1 title
  - Step 1: number circle + title + description
  - Code block with syntax highlighting (language label visible)
  - Step 2, etc.
  - Success message at end
```

### Scenario 5.2 [3b] Code Copy Button Works
```gherkin
Given user is viewing Instalación section with code block
When user clicks copy button on code block
Then code is copied to clipboard
  And button label changes to "Copiado" for 1s
  And icon confirms success
```

### Scenario 6.1 [3b] Glosario Search Filters Terms
```gherkin
Given user is viewing Glosario section with 12 terms visible
When user types "closure" in search input
Then only terms matching "closure" appear (case-insensitive substring match)
When user clears search input
Then all 12 terms appear again
```

### Scenario 6.2 [3b] Category Filter Buttons
```gherkin
Given Glosario has terms in categories: "Conceptos", "Técnicas", "Herramientas"
When user views Glosario
Then category buttons appear: "Todos", "Conceptos", "Técnicas", "Herramientas"
When user clicks "Conceptos"
Then only terms with category="Conceptos" appear
When user clicks "Técnicas"
Then only terms with category="Técnicas" appear
```

### Scenario 6.3 [3b] Flashcard Flip Shows Definition
```gherkin
Given user is viewing Glosario flashcards
  And card shows term: "Closure", category: "Conceptos"
When user clicks card
Then card flips with animation
  And reverse side shows definition text
When user clicks again
Then card flips back to show term
```

### Scenario 7.1 [3a] Progress Bar Updates on Section Visit
```gherkin
Given user has visited 0 sections
  And Progress bar shows "0 of 5" (0%)
When user clicks Aprendizaje tab
Then user's visit is recorded in section_visits table
  And Progress bar updates to "1 of 5" (20%)
When user visits Taller
Then Progress bar updates to "2 of 5" (40%)
```

### Scenario 7.2 [3a] Progress Persists After Page Reload
```gherkin
Given user has visited 2 sections (progress = 40%)
When user reloads the page
Then Progress bar still shows "2 of 5" (40%)
  And progress matches section_visits count from DB
```

### Scenario 8.1 [3b] Social Links Footer
```gherkin
Given user is viewing any section
Then sidebar footer shows social icons: Instagram, LinkedIn, TikTok, YouTube
When user clicks Instagram icon
Then Instagram URL opens in new tab (from config)
When user clicks LinkedIn icon
Then LinkedIn URL opens in new tab (from config)
```

### Scenario 9.1 [3a] RLS: Unauthorized User Cannot Access Route
```gherkin
Given user is NOT logged in
When user navigates to /taller/taller-x
Then user is redirected to login page
```

### Scenario 9.2 [3a] RLS: User with Unredeemed Access Gets 403
```gherkin
Given user is logged in
  And has workshop_access to Workshop "Taller X" with redeemed_at = NULL
When user navigates to /taller/taller-x
Then server returns 403 Forbidden
  OR user is redirected to /catalogo
```

### Scenario 9.3 [3a] RLS: User with Redeemed Access Sees Sections
```gherkin
Given user is logged in
  And has workshop_access to Workshop "Taller X" with redeemed_at = "2026-06-01"
When user navigates to /taller/taller-x
Then sections are visible
  And queries return 200 OK
```

### Scenario 9.4 [3b] RLS: User Cannot See Another User's Sections
```gherkin
Given User A has redeemed access to Workshop "Taller X"
  And User B has NO access to Workshop "Taller X"
When User B is logged in
  And queries sections.* WHERE workshop_id = "Taller X"
Then empty result set (RLS filters all rows)
```

### Scenario 10.1 [3a] Back to Catalog Button Navigation
```gherkin
Given user is on /taller/taller-x
When user clicks "Volver al catálogo" button in sidebar
Then user navigates to /catalogo
```

### Scenario 11.1 [3b] Mobile Sidebar at 360px Viewport
```gherkin
Given viewport width = 360px
When user views /taller/taller-x
Then sidebar renders without causing horizontal scroll
  AND main content is readable
  AND sidebar pattern matches design spec (hamburger/drawer/etc)
```

### Scenario 12.1 [3b] E2E: Complete User Flow (All Sections + Progress)
```gherkin
Given user is logged in with redeemed access
When user navigates to /taller/taller-x
Then Inicio section loads (progress = 0%)
When user clicks Aprendizaje
Then Aprendizaje loads (progress = 20%)
  AND carousel renders with slides
When user clicks Aprendizaje note toggle
Then notes appear
When user clicks back to Inicio
Then Inicio loads (progress = 20%, no new visit)
When user clicks Taller
Then Taller loads (progress = 40%)
When user clicks Instalación
Then Instalación loads (progress = 60%)
  AND code copy button works
When user clicks Glosario
Then Glosario loads (progress = 80%)
  AND search filters work
  AND flashcard flip works
When user reloads page
Then progress still 80% (persisted via section_visits)
```

---

## Schemas & Fixtures

### Zod Schemas (Full Definitions)

See **RF-003** above for complete discriminated union schema with all 5 types.

**For testing/fixtures, example valid content_json payloads:**

**Inicio example:**
```json
{
  "type": "inicio",
  "title": "Bienvenido a Desarrollo Web",
  "description": "En este taller aprenderás los fundamentos de HTML, CSS y JavaScript.",
  "quick_links": [
    { "label": "Aprendizaje", "target_section": "aprendizaje" },
    { "label": "Taller Práctico", "target_section": "taller" },
    { "label": "Instalación del Entorno", "target_section": "instalacion" },
    { "label": "Diccionario de Términos", "target_section": "glosario" }
  ]
}
```

**Aprendizaje example:**
```json
{
  "type": "aprendizaje",
  "title": "Fundamentos de JavaScript",
  "slides": [
    {
      "title": "Variables y Tipos",
      "body": "En JavaScript usamos let, const, var para declarar variables.",
      "kicker": "Lección 1",
      "notes": "Énfasis en let y const (moderno). Evitar var."
    },
    {
      "title": "Funciones",
      "body": "Las funciones son bloques de código reutilizables.",
      "kicker": "Lección 2",
      "notes": "Incluir arrow functions y callbacks."
    }
  ],
  "pdf_url": "https://example.com/slides.pdf"
}
```

**Taller example:**
```json
{
  "type": "taller",
  "title": "Ejercicios Prácticos",
  "instructions": "En esta sección resolverás 4 ejercicios progresivamente más complejos. Usa el editor de código para escribir tu solución."
}
```

**Instalación example:**
```json
{
  "type": "instalacion",
  "title": "Configurar tu Entorno",
  "steps": [
    {
      "order": 1,
      "title": "Instalar Node.js",
      "description": "Descargá Node.js desde https://nodejs.org",
      "code": "brew install node",
      "language": "bash"
    },
    {
      "order": 2,
      "title": "Verificar Instalación",
      "description": "Abre tu terminal y ejecuta:",
      "code": "node --version",
      "language": "bash"
    }
  ],
  "success_message": "Entorno configurado exitosamente. Estás listo para comenzar."
}
```

**Glosario example (content_json only; terms from table):**
```json
{
  "type": "glosario",
  "title": "Diccionario de Términos",
  "search_placeholder": "Buscar término..."
}
```

**GlossaryTerm fixtures (seeded into DB):**
```json
[
  {
    "workshop_id": "uuid-workshop-1",
    "term": "Closure",
    "definition": "Una función que retiene acceso a variables del scope externo en el que fue definida.",
    "category": "Conceptos"
  },
  {
    "workshop_id": "uuid-workshop-1",
    "term": "Arrow Function",
    "definition": "Sintaxis compacta para funciones anónimas usando => introducida en ES6.",
    "category": "Conceptos"
  },
  {
    "workshop_id": "uuid-workshop-1",
    "term": "Callback",
    "definition": "Función pasada como argumento a otra función, ejecutada dentro.",
    "category": "Conceptos"
  },
  {
    "workshop_id": "uuid-workshop-1",
    "term": "async/await",
    "definition": "Sintaxis que simplifica el manejo de Promises y código asincrónico.",
    "category": "Técnicas"
  },
  {
    "workshop_id": "uuid-workshop-1",
    "term": "Destructuring",
    "definition": "Extraer valores de objetos o arrays directamente en variables.",
    "category": "Técnicas"
  },
  {
    "workshop_id": "uuid-workshop-1",
    "term": "Spread Operator",
    "definition": "Sintaxis ... para expandir iterables en contextos donde cero o más elementos son esperados.",
    "category": "Técnicas"
  },
  {
    "workshop_id": "uuid-workshop-1",
    "term": "npm",
    "definition": "Node Package Manager: gestor de paquetes para JavaScript.",
    "category": "Herramientas"
  },
  {
    "workshop_id": "uuid-workshop-1",
    "term": "webpack",
    "definition": "Bundler de módulos para JavaScript, agrupa archivos y assets.",
    "category": "Herramientas"
  }
]
```

### E2E Fixtures & Setup

**Helper to seed sections + glossary (extend existing `resetSeedUser` helper):**

```typescript
// tests/fixtures/seed-sections.ts
export async function seedSectionsAndGlossary(
  db: Database,
  workshopId: string
) {
  // Seed 5 sections (one per type)
  const sections = [
    {
      workshop_id: workshopId,
      type: 'inicio',
      content_json: { /* Inicio example from above */ },
      section_order: 1,
    },
    {
      workshop_id: workshopId,
      type: 'aprendizaje',
      content_json: { /* Aprendizaje example */ },
      section_order: 2,
    },
    {
      workshop_id: workshopId,
      type: 'taller',
      content_json: { /* Taller example */ },
      section_order: 3,
    },
    {
      workshop_id: workshopId,
      type: 'instalacion',
      content_json: { /* Instalación example */ },
      section_order: 4,
    },
    {
      workshop_id: workshopId,
      type: 'glosario',
      content_json: { /* Glosario example */ },
      section_order: 5,
    },
  ];

  for (const section of sections) {
    await db
      .insertInto('sections')
      .values(section)
      .execute();
  }

  // Seed 8 glossary terms per workshop
  const terms = [
    /* GlossaryTerm fixtures from above */
  ];

  for (const term of terms) {
    await db
      .insertInto('glossary_terms')
      .values({ ...term, workshop_id: workshopId })
      .execute();
  }
}
```

**Playwright test fixture:**
```typescript
// tests/e2e/fixtures.ts
import { test as base } from '@playwright/test';

type TestFixtures = {
  authenticatedUserWithWorkshop: {
    userId: string;
    workshopId: string;
    workshopSlug: string;
  };
};

export const test = base.extend<TestFixtures>({
  authenticatedUserWithWorkshop: async (
    { page },
    use
  ) => {
    // Create user, workshop, access record, sections, glossary
    const userId = generateUUID();
    const workshopId = generateUUID();
    const workshopSlug = 'taller-x';

    // Seed to DB
    await seedUser(db, userId);
    await seedWorkshop(db, workshopId, workshopSlug);
    await seedWorkshopAccess(db, userId, workshopId, { redeemed_at: new Date() });
    await seedSectionsAndGlossary(db, workshopId);

    // Login user
    await page.goto('/');
    await loginAs(page, userId);

    await use({
      userId,
      workshopId,
      workshopSlug,
    });

    // Cleanup
    await deleteUser(db, userId);
  },
});
```

---

## Test Coverage by Slice

### Slice 3a Coverage

| Test File | Scenarios | RF Coverage |
|-----------|-----------|-------------|
| `workshop-section-navigation.spec.ts` | 1.1, 1.2, 10.1 | RF-002, RF-006, RF-011 |
| `workshop-section-inicio.spec.ts` | 2.1, 2.2 | RF-004 |
| `workshop-section-aprendizaje.spec.ts` | 3.1, 3.2, 3.3, 3.4, 3.5 | RF-005 |
| `workshop-rls.spec.ts` (subset) | 9.1, 9.2, 9.3 | RF-012 |
| **Total:** ~15 scenarios | | |

### Slice 3b Coverage

| Test File | Scenarios | RF Coverage |
|-----------|-----------|-------------|
| `workshop-section-taller.spec.ts` | 4.1 | RF-008 |
| `workshop-section-instalacion.spec.ts` | 5.1, 5.2 | RF-009 |
| `workshop-section-glosario.spec.ts` | 6.1, 6.2, 6.3 | RF-010 |
| `workshop-social-footer.spec.ts` | 8.1 | RF-007 |
| `workshop-rls.spec.ts` (full) | 9.4 | RF-012 |
| `workshop-responsive.spec.ts` | 11.1 | RF-015 |
| `workshop-e2e-full-flow.spec.ts` | 12.1 | All RFs |
| **Total:** ~18 scenarios | | |

---

## Design Decisions Deferred (Open for Design Phase)

### D-001: Section Visits Persistence Strategy

**Question:** How to persist progress when user visits a section?

**Option A (Recommended in proposal):** Server-side `section_visits` table with RLS. On tab click, record visit via API call. Progress bar shows count of distinct visited sections.
- Pros: Persistent across sessions, simple RLS, matches lesson #1 (server owns state)
- Cons: Network latency on every click, potential race conditions

**Option B:** Client-side localStorage + optimistic UI. On tab click, update localStorage immediately (instant UI feedback). Async sync to server in background.
- Pros: Instant feedback, feels snappy
- Cons: Lost on logout, potential sync issues

**Decision:** Design phase chooses between A and B. Spec accommodates both (RF-011 describes behavior, not mechanism).

---

### D-002: Sidebar Mobile Pattern

**Question:** How should sidebar behave on mobile (360px viewport)?

**Option A:** Fixed drawer (hamburger menu icon, sidebar slides in from left)
- Pros: Desktop layout intact, familiar pattern
- Cons: Extra interaction (open/close)

**Option B:** Bottom navigation bar (5 tabs at bottom of screen)
- Pros: Thumb-friendly, no drawer toggle
- Cons: Takes vertical space, reduces content area

**Option C:** Sidebar becomes sticky but narrower (icons only, labels on hover)
- Pros: Always visible, compact
- Cons: Icons-only may be unclear, hover doesn't work on touch

**Decision:** Design phase chooses based on prototype mobile check. Spec requires responsive (RF-015) but defers the pattern.

---

### D-003: Social Links Footer Appearance

**Question:** How to render social links in sidebar footer?

**Option A:** Icons only (small, compact)
**Option B:** Icons + labels (more readable, larger footprint)
**Option C:** Cards with icon + label (takes more space)

**Decision:** Design phase decides. Spec provides config + link structure (RF-007).

---

### D-004: Taller Placeholder Text

**Question:** How to communicate that exercises are coming in change 4?

**Option A:** Text message: "Ejercicios disponibles en la siguiente actualización"
**Option B:** Visual structure: 4 empty card slots (ready for exercises)
**Option C:** Hybrid: Text + visual structure

**Decision:** Design phase decides (brief §3 calls it "placeholder strategy"). Spec requires no interactivity.

---

## External Blockers & Dependencies

### B-001: Jennifer Provides Social Media URLs

**Blocker:** Social links footer (RF-007) requires 4 URLs: Instagram, LinkedIn, TikTok, YouTube.

**Mitigation:** Config file has empty defaults. Footer renders but links go nowhere until Jennifer fills `.env.local` or design phase provides URLs. Non-blocking.

**Action:** Before design close, Jennifer provides 4 URLs or updates env vars.

---

### B-002: Prototype Content Inventory

**Blocker:** Spec assumes content_json samples match prototype exactly (Slides in Aprendizaje, Steps in Instalación, etc.).

**Mitigation:** Explore phase (obs #624) inventoried all content. Spec uses those structures. If prototype changes, RFs don't apply.

**Action:** Confirm prototype content matches spec examples before apply phase.

---

### B-003: Design Decisions (D-001 to D-004)

**Blocker:** Design phase must finalize 4 design decisions before apply can start (sidebar mobile pattern, social appearance, Taller placeholder, progress persistence).

**Mitigation:** Spec describes behavior in vendor-neutral terms. Implementation flexible.

**Action:** Design phase resolves all D-* decisions, routes go to sdd-design artifact.

---

## Open Questions for Design Phase

1. **RF-001 + RF-011 + D-001:** How is progress persisted? Server (section_visits query) vs. client (localStorage)? Recommendation: server-side (simple RLS, matches brief lesson #1).

2. **RF-015 + D-002:** What sidebar pattern for mobile (360px)? Hamburger drawer vs. bottom nav vs. compressed icons? Must test prototype at 360px.

3. **RF-007 + D-003:** Sidebar footer social links: icons only or icons + labels? Recommendation: icons only (compact, match design style).

4. **RF-008 + D-004:** Taller placeholder: text message or visual empty structure? Recommendation: text only (cleaner, less coupling to change 4).

---

## Traceability: RFs → Proposal

| RF | Proposal §Ref | Status |
|----|---------------|--------|
| RF-001 | §Intent (route guard), §Scope (layout) | Locked |
| RF-002 | §Scope (sidebar component) | Locked |
| RF-003 | §Scope (data schema per ADR-001) | Locked |
| RF-004 | §Scope (Inicio section) | Locked |
| RF-005 | §Scope (Aprendizaje section) | Locked |
| RF-006 | §Scope (progress bar) | Locked |
| RF-007 | §Scope (social footer config) | Locked |
| RF-008 | §Scope (Taller placeholder), §Boundary | Locked |
| RF-009 | §Scope (Instalación section) | Locked |
| RF-010 | §Scope (Glosario section) | Locked |
| RF-011 | §Scope (section_visits), §Data Model | Locked |
| RF-012 | §Scope (RLS policies) | Locked |
| RF-013 | §Scope (E2E Coverage) | Locked |
| RF-014 | §Data Model (tables + RLS) | Locked |
| RF-015 | §Out-of-Scope (mobile sidebar = design decision) | Deferred to Design |
| D-001 to D-004 | §Open Decisions for Design Phase | Deferred to Design |

---

## Risk Assessment

### R-001: RLS Complexity

**Risk:** RLS via EXISTS on workshop_access may have edge cases (concurrent revocations, slow queries on large access tables).

**Impact:** High (security boundary)

**Mitigation:** Copy RLS pattern from change 2 (already validated). Exhaustive RLS tests per RF-012 + test scenarios 9.*. E2E RLS spec included.

**Owner:** QA + Design (verify in e2e)

---

### R-002: Content Schema Extension Risk

**Risk:** If content_json schema is too rigid, adding new fields to Aprendizaje (e.g., "instructor_video_url") requires migration in change 5.

**Impact:** Medium (dev velocity)

**Mitigation:** Schema per ADR-001 allows nullable optional fields in Zod (e.g., `pdf_url?: string`). Small additions won't break migration. Large restructuring → future ADR.

**Owner:** Apply phase (migrations)

---

### R-003: Progress Bar Latency

**Risk:** If progress bar refetches from DB on every section click, perceived latency degrades UX.

**Impact:** Medium (UX)

**Mitigation:** Design phase (D-001) chooses optimistic update (client state) or async sync. Spec describes behavior, not latency.

**Owner:** Design phase

---

### R-004: Mobile Sidebar Width

**Risk:** Fixed 256px sidebar on 360px viewport = 71% width overflow, breaks content layout.

**Impact:** Medium (mobile UX)

**Mitigation:** Design phase (D-002) provides responsive pattern (hamburger/bottom nav). RF-015 requires mobile responsiveness test.

**Owner:** Design phase

---

### R-005: Taller Section Coupling

**Risk:** If change 3 Taller tries to query Exercise table before change 4 creates it, FK error.

**Impact:** Low (caught by migration)

**Mitigation:** Taller is placeholder-only in change 3 (RF-008, no Exercise query). Change 4 wires the query. No coupling.

**Owner:** Apply phase (migrations)

---

## Blockers for Apply Phase

**Before sdd-apply can start:**

1. ✓ All RFs frozen (no new requirements)
2. ✓ All 5 content_json examples finalized (in spec)
3. ✓ Design decisions D-001 to D-004 resolved (in sdd-design artifact)
4. ✓ Test fixtures schema finalized (in spec)
5. ? Social URLs provided by Jennifer (B-001, non-blocking if empty defaults used)
6. ✓ RLS test matrix agreed (scenarios 9.*)

---

## Engram Context

**Proposal topic_key:** `sdd/workshop-sections/proposal`  
**Spec topic_key:** `sdd/workshop-sections/spec`  
**Related:** `sdd/workshop-sections/explore` (obs #624)  
**Related ADR:** ADR-001 (content_json schema discriminated union)  
**Related Brief Sections:** §3 (data model), §6 (brief definition), §7.2 (onboarding flow), §7.3 (consumption flow), §12 (cached decisions: social footer), §13 (change 3 position)

---

## Summary Table

| Category | Details |
|----------|---------|
| **Change ID** | workshop-sections |
| **Position** | 3 of 8 |
| **Slices** | 3a (~1,200 LOC) + 3b (~1,300 LOC) = ~2,500 total |
| **RFs** | 15 (12 locked, 3 deferred to design) |
| **RNFs** | 5 (security, a11y, performance, i18n, responsive) |
| **Schemas** | 5 content_json types (Zod) + GlossaryTerm + SectionVisit |
| **E2E Scenarios** | 18 (Gherkin + RLS boundary tests) |
| **Test Specs** | 8 files (~250 LOC) |
| **Migrations** | 3 SQL files (sections + glossary + visits) |
| **Fixtures** | 5 sections + 8 glossary terms per workshop |
| **Design Decisions Pending** | 4 (D-001 through D-004) |
| **Blockers** | 1 (social URLs, non-blocking) |
| **Risks** | 5 (RLS, schema rigidity, latency, mobile, coupling) |
| **Next Phase** | sdd-design (parallel) + sdd-tasks (after design ready) |

