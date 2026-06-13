# Design — workshop-sections

**Change ID:** workshop-sections  
**Position:** 3 of 8  
**Status:** Design (ready for spec + tasks)  
**Architecture owner:** Salazar Duke Dev System  
**Design date:** 2026-06-12

---

## Executive Summary

Workshop detail view (`/taller/[slug]`) with sidebar navigation, 5 section renderers, persistent progress tracking via server-side `section_visits` table, and social footer links from config. Delivered as 2 chained PRs (~1,200 + ~1,300 lines) with full RLS enforcement via EXISTS on `workshop_access.redeemed_at`.

---

## Decisions Locked (No Reopening)

From **ADR-001** (accepted):
- **content_json** is a discriminated union: one fixed schema per section type (5 types enum).
- No markdown parsing in v1 — plain text fields only.
- No external block editor library — 5 hardcoded Zod schemas, one per type.

From **Proposal**:
- **RLS pattern** via EXISTS on `workshop_access.redeemed_at` (lesson #1 from change 2 archive).
- **Slicing strategy** 2 chained PRs: 3a (migrations + sidebar + Inicio/Aprendizaje) + 3b (Taller/Instalación/Glosario + social footer + full tests).
- **Boundary with change 4**: Taller section is placeholder-only; exercises live in separate table (change 4).
- **Route structure**: `/taller/[slug]` as server layout component with Client-side sidebar + section router.
- **Social links** in sidebar footer, URLs from config file.

---

## Open Decisions (D-1 to D-12)

### D-1: Persistencia del Progreso — ✓ DECIDIDO

**Decision:** Server-side `section_visits` table (1:1 per user + section, UNIQUE constraint).

**Rationale:**
- Progress must survive device changes (lesson #1: server owns state)
- Simple RLS: `SELECT/INSERT USING (user_id = auth.uid())`
- Decouples from localStorage — no sync complexity
- Baseline for change 4 extension (exercise completion tracking)

**Rejected Alternative:** localStorage
- Fast, no DB roundtrip
- Lost on logout or device change
- Extra client-side sync logic → complexity

**SQL:**
```sql
CREATE TABLE public.section_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  visited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, section_id)  -- idempotent: upsert via ON CONFLICT
);
CREATE INDEX idx_section_visits_user_id ON public.section_visits(user_id);
CREATE INDEX idx_section_visits_section_id ON public.section_visits(section_id);

-- RLS
ALTER TABLE public.section_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY section_visits_user ON public.section_visits
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY section_visits_insert ON public.section_visits
  FOR INSERT WITH CHECK (user_id = auth.uid());
```

---

### D-2: Sidebar en Mobile (360px) — ✓ DECIDIDO

**Decision:** Hamburger drawer (slide from left, overlay content) on mobile. Sticky sidebar on desktop (256px).

**Rationale:**
- Prototype shows fixed sidebar at 256px — breakpoint at 768px (tablet threshold)
- 360px screen: hamburger toggle button at top-left
- Drawer overlay with scrim, close on backdrop click or escape key
- Consistent with brief §7 (sidebar navigation), mobile-first responsive pattern
- Reduces 256px width tax on small screens

**Implementation detail:**
- `useMediaQuery('(max-width: 767px)')` to trigger drawer mode
- `<button aria-label="Open sidebar" onClick={toggleSidebar} />` in TopBar
- Drawer state in Client Component (Sidebar)
- No additional table or config — CSS-driven

**Rejected Alternative:** Bottom navigation tabs
- Better for thumb reach (mobile UX win)
- Breaks prototype layout — prototype shows sidebar top-to-bottom
- Conflicts with footer social links
- Decision: stick to prototype

---

### D-3: Registro de Visita — ✓ DECIDIDO

**Decision:** Server Action triggered on section render (when `/taller/[slug]/[section]` loads or section tab clicked in client).

**Mechanism:**
1. `/taller/[slug]` renders active section name via query param or state
2. `SectionRenderer` component (Client) calls `recordSectionVisit(sectionId)` Server Action
3. Server Action: `INSERT INTO section_visits (user_id, section_id) VALUES (...) ON CONFLICT DO NOTHING`
4. If visit already recorded, no-op (idempotent via UNIQUE constraint)

**Rationale:**
- Server Action is simplest (no API endpoint overhead)
- Triggered on render, not on explicit button click (implicit interaction)
- Idempotent via UNIQUE constraint (replay-safe)
- No client state needed to track visited sections

**Rejected Alternative:** Explicit "Mark as visited" button
- Adds friction (user must click)
- Doesn't match progress bar semantics (progress = sections you've *seen*, not actions taken)

**Rejected Alternative:** useEffect on section mount
- Client-side fetch → RLS error if not authenticated (but we guard at route level)
- Noisier — double-fire in StrictMode (React 18 dev mode)
- Mutation in render → prefer Server Action

---

### D-4: Estructura de Componentes — ✓ DECIDIDO

**File structure:**
```
src/components/workshop/
├── Sidebar.tsx              (Client) — tabs + progress bar + footer
├── ProgressBar.tsx          (Client) — % calculation + gradient
├── SectionRenderer.tsx      (Client) — switch by type
├── sections/
│   ├── InicioSection.tsx    (Server) — hero + quick links
│   ├── AprendizajeSection.tsx (Client) — carousel + notes
│   ├── TallerSection.tsx    (Server) — placeholder
│   ├── InstalacionSection.tsx (Client) — steps + code copy
│   └── GlosarioSection.tsx  (Client) — search + filter + flip
└── SocialFooter.tsx         (Client) — icons + links
```

**Server vs Client logic:**
- **Inicio:** Server (static hero, no interactivity)
- **Aprendizaje:** Client (carousel state, notes toggle, slide counter)
- **Taller:** Server (placeholder structure, change 4 adds textarea logic)
- **Instalación:** Client (step counter state, copy button feedback)
- **Glosario:** Client (search filter state, flashcard flip, flip animation)
- **Sidebar:** Client (tab selection, progress % calc, drawer toggle)
- **SocialFooter:** Client (simple — just icons + links from props)

**Route structure:**
- `/taller/[slug]/page.tsx` → Server layout component (fetches workshop + user access, calls `getRequiredUser()`, RLS guard)
- Renders `<Sidebar />` + `<SectionRenderer activeSection={sectionName} />` (Client wrapper)
- Client state manages `activeSection` (state hook or query param)

**Alternative considered:** Sub-routes `/taller/[slug]/[section]`
- Cleaner URL semantics (deep-linking, back button)
- Requires 5 parallel sub-route files
- Adds param parsing complexity (Next 16: `await params`)
- Decision: single route with client state (simpler in change 3, scale in change 4 if needed)

---

### D-5: SQL Migraciones Completas — ✓ DECIDIDO

**3a migrations (apply first):**

```sql
-- 01-create-sections-table.sql (slice 3a)
CREATE TABLE public.sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('inicio','aprendizaje','taller','instalacion','glosario')),
  content_json JSONB NOT NULL,
  section_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workshop_id, type)
);
CREATE INDEX idx_sections_workshop_id ON public.sections(workshop_id);

ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY sections_select_redeemed ON public.sections
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.workshop_access wa
      WHERE wa.workshop_id = sections.workshop_id
        AND wa.user_id = auth.uid()
        AND wa.redeemed_at IS NOT NULL
    )
  );

-- 02-create-glossary-terms-table.sql (slice 3a)
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
CREATE INDEX idx_glossary_terms_category ON public.glossary_terms(workshop_id, category);

ALTER TABLE public.glossary_terms ENABLE ROW LEVEL SECURITY;
CREATE POLICY glossary_select_redeemed ON public.glossary_terms
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.workshop_access wa
      WHERE wa.workshop_id = glossary_terms.workshop_id
        AND wa.user_id = auth.uid()
        AND wa.redeemed_at IS NOT NULL
    )
  );

-- 03-create-section-visits-table.sql (slice 3a)
CREATE TABLE public.section_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  visited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, section_id)
);
CREATE INDEX idx_section_visits_user_id ON public.section_visits(user_id);
CREATE INDEX idx_section_visits_section_id ON public.section_visits(section_id);

ALTER TABLE public.section_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY section_visits_select ON public.section_visits
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY section_visits_insert ON public.section_visits
  FOR INSERT WITH CHECK (user_id = auth.uid());
```

**Default privileges (idempotent in 3a, or execute in change 1 if not already done):**
```sql
-- Run as postgres or owner once
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT INSERT, UPDATE ON TABLES TO authenticated;
```

---

### D-6: Routing y Data Fetch — ✓ DECIDIDO

**Route:** `/taller/[slug]` (single route, not sub-routes)

**`/taller/[slug]/page.tsx` (Server Component):**
```tsx
// 1. Fetch workshop by slug
// 2. Guard: check user has redeemed workshop_access (explicit + RLS)
// 3. Fetch sections + current user (for progress calculation)
// 4. Calculate progress % (visited sections / 5)
// 5. Render layout: <Sidebar progress={%} /> + <SectionRenderer activeSection={state} />
```

**Client wrapper handles:**
- State: `activeSection` (useState hook, default 'inicio')
- Tab click: `setActiveSection(type)`
- Drawer toggle on mobile: `showDrawer` state
- Call `recordSectionVisit(sectionId)` when section renders

**Data fetching:**
- Server (layout): workshops, workshop_access, sections count, section_visits count
- Client: none — all data passed via props (lessons #1: server → client, no callbacks)

**Next 16 note:** `params` is now Promise — use `await params` in layout/page.

**Rejected Alternative:** Sub-routes `/taller/[slug]/aprendizaje`, `/taller/[slug]/taller`, etc.
- Deep-linking ✓
- More files (5 parallel page.tsx files)
- Param parsing per route (repetitive)
- Overkill for change 3 (single page, simple state)
- Can refactor in change 4 if deep-linking becomes requirement

---

### D-7: Config de Redes Sociales — ✓ DECIDIDO

**File:** `src/lib/config/social.ts`

```typescript
export const SOCIAL_LINKS = {
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || '',
  linkedin: process.env.NEXT_PUBLIC_LINKEDIN_URL || '',
  tiktok: process.env.NEXT_PUBLIC_TIKTOK_URL || '',
  youtube: process.env.NEXT_PUBLIC_YOUTUBE_URL || '',
} as const;

export const SOCIAL_ICONS = {
  instagram: <InstagramIcon />,
  linkedin: <LinkedInIcon />,
  tiktok: <TikTokIcon />,
  youtube: <YouTubeIcon />,
} as const;
```

**`.env.local` (user fills in):**
```
NEXT_PUBLIC_INSTAGRAM_URL=https://instagram.com/salazardukeimpacthub
NEXT_PUBLIC_LINKEDIN_URL=https://linkedin.com/company/salazar-duke
NEXT_PUBLIC_TIKTOK_URL=https://tiktok.com/@salazardukeimpacthub
NEXT_PUBLIC_YOUTUBE_URL=https://youtube.com/@salazardukeimpacthub
```

**Placeholder strategy:** If env var is empty, link renders but `href=""` (no navigation). Jennifer can fill in after review or post-launch.

**Rejected Alternative:** Hardcode URLs in component
- Not maintainable — requires code change to update socials
- Decision: config file is source of truth

---

### D-8: Carrusel de Aprendizaje — ✓ DECIDIDO

**Component:** `AprendizajeSection.tsx` (Client)

**State:**
- `slideIndex: number` (0-based, tracks current slide)
- `notesOpen: boolean` (toggle notes panel)

**Data structure (from content_json):**
```typescript
type AprendizajeContent = {
  type: 'aprendizaje';
  title: string;
  slides: Array<{
    kicker: string;      // e.g., "Enfoque 1"
    title: string;
    body: string;
    notes?: string;      // optional notes for this slide
  }>;
  pdf_url?: string;
};
```

**Controls:**
- Prev button: `slideIndex = Math.max(0, slideIndex - 1)`
- Next button: `slideIndex = Math.min(slides.length - 1, slideIndex + 1)`
- Dot indicators: click to jump to slide
- Disabled state on prev (index === 0) and next (index === slides.length - 1)

**Animations:**
- Slide container: `sdRise` on mount
- Notes toggle: smooth fade-in (CSS transition)
- Dots: filled width based on index (linear-gradient style)

**Rejected Alternative:** Keyboard navigation (left/right arrows)
- Nice-to-have, deferred to change 4
- Decision: button-driven only in v1

---

### D-9: Copy de Código en Instalación — ✓ DECIDIDO

**Component:** `InstalacionSection.tsx` (Client)

**Copy button (per code block):**
```tsx
const handleCopyCode = async (code: string) => {
  try {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  } catch (err) {
    console.error('Copy failed:', err);
  }
};
```

**Feedback:**
- Button text changes: "Copiar" → "✓ Copiado" (or icon change)
- Duration: 2s then revert
- No toast notification (simpler) — just inline button label

**Rejected Alternative:** Toast notification (top-right)
- Extra library (if not in globals.css keyframes already)
- Overkill for inline action
- Decision: button label is enough

**Code block structure:**
```typescript
type InstalacionContent = {
  type: 'instalacion';
  title: string;
  steps: Array<{
    order: number;
    title: string;
    description: string;
    code: string;
    language: string;  // e.g., "bash", "python", "javascript"
  }>;
  success_message?: string;
};
```

---

### D-10: Búsqueda/Filtro del Glosario — ✓ DECIDIDO

**Component:** `GlosarioSection.tsx` (Client)

**State:**
- `searchQuery: string` (live filter input)
- `selectedCategory: string | null` (single category filter, or null for all)

**Logic:**
```tsx
const filtered = glossaryTerms.filter(term => {
  const matchesSearch = 
    term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
    term.definition.toLowerCase().includes(searchQuery.toLowerCase());
  const matchesCategory = !selectedCategory || term.category === selectedCategory;
  return matchesSearch && matchesCategory;
});
```

**UI:**
- Search input (live onChange, debounce? no — simple, instant filter)
- Category buttons (toggle, reset to null on click if already selected)
- Flashcard grid: only filtered terms
- Empty state: "No encontramos términos para tu búsqueda."
- Count badge: "{{ glossaryCount }} términos"

**Data structure (from DB):**
```typescript
// Read from section_visits + glossary_terms table
type GlossaryContent = {
  type: 'glosario';
  title: string;
  search_placeholder: string;  // e.g., "Buscar término o definición…"
};
// Terms come from GlossaryTerm rows, not content_json
```

**Rejected Alternative:** Server-side filtering (Server Component)
- Requires Server Action per search keystroke → noise
- Client-side filter is fast enough for ~12-20 terms
- Decision: client-side filter, no Server Action

---

### D-11: Keyframes Faltantes en globals.css — ✓ DECIDIDO

**Existing keyframes (verified in prototype HTML):**
- `sdPulse` — pulsing opacity (0.2 → 0.95)
- `sdSpin` — rotating 360deg
- `sdLive` — pulse with box-shadow (used in "Práctica en vivo" badge)
- `sdRise` — slide up + fade in (used on section entrance)

**New keyframes to add (if used in sections):**

```css
@keyframes sdCheck {
  0% { transform: scale(0); }
  55% { transform: scale(1.25); }
  100% { transform: scale(1); }
}
/* Used in Taller section: exercise completion checkmark bounce */

@keyframes sdToast {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
/* Reserved for toast notifications (not used in change 3, keep for v1.1) */

@keyframes sdFlip {
  0% { transform: rotateY(0deg); }
  100% { transform: rotateY(180deg); }
}
/* Used in Glosario: flashcard flip (0.55s cubic-bezier(.4,0,.2,1)) */
```

**Note:** Prototype HTML already has `sdCheck` and `sdToast` defined in style tags. Will add to globals.css with comment that `sdToast` is reserved.

---

### D-12: Seed de Contenido de Prueba — ✓ DECIDIDO

**File:** `src/lib/seed/sections.sql` (or in migration post-script)

**Strategy:** Extend `resetSeedUser()` helper to create 5 Section rows + 12 GlossaryTerm rows per test workshop.

**Sample content (Engram workshop):**

```sql
-- After creating workshops and workshop_access in resetSeedUser():
INSERT INTO public.sections (workshop_id, type, content_json, section_order) VALUES
(
  (SELECT id FROM public.workshops WHERE slug = 'engram'),
  'inicio',
  jsonb_build_object(
    'type', 'inicio',
    'title', 'Memoria Persistente para Agentes de IA',
    'description', 'Aprende cómo implementar un sistema de recuerdo en tus agentes sin perder escala.',
    'quick_links', jsonb_build_array(
      jsonb_build_object('label', 'Aprendizaje', 'target_section', 'aprendizaje'),
      jsonb_build_object('label', 'Taller', 'target_section', 'taller'),
      jsonb_build_object('label', 'Instalación', 'target_section', 'instalacion'),
      jsonb_build_object('label', 'Glosario', 'target_section', 'glosario')
    )
  ),
  1
),
(
  (SELECT id FROM public.workshops WHERE slug = 'engram'),
  'aprendizaje',
  jsonb_build_object(
    'type', 'aprendizaje',
    'title', 'El modelo mental de la memoria',
    'slides', jsonb_build_array(
      jsonb_build_object(
        'kicker', 'Concepto',
        'title', 'Qué es la memoria persistente',
        'body', 'Un sistema que recuerda información entre sesiones, escalable y actualizable.',
        'notes', 'En vivo: preguntarles qué tipos de memoria usan en sus sistemas'
      ),
      jsonb_build_object(
        'kicker', 'Práctica',
        'title', 'Implementación básica',
        'body', 'Vector DB + embedding: búsqueda semántica en 3 líneas de código.',
        'notes', 'Demo: usar Pinecone o Chroma'
      )
    ),
    'pdf_url', 'https://ejemplo.com/engram-slides.pdf'
  ),
  2
),
(
  (SELECT id FROM public.workshops WHERE slug = 'engram'),
  'taller',
  jsonb_build_object(
    'type', 'taller',
    'title', 'Ejercicios accionables',
    'instructions', 'Copia el prompt, pruébalo con tu modelo, guarda tu respuesta. Marca cada ejercicio al terminar.',
    'placeholder', 'Ejercicios disponibles en la siguiente versión. Por ahora, practica con los prompts del Aprendizaje.'
  ),
  3
),
(
  (SELECT id FROM public.workshops WHERE slug = 'engram'),
  'instalacion',
  jsonb_build_object(
    'type', 'instalacion',
    'title', 'Deja Engram corriendo en 5 pasos',
    'steps', jsonb_build_array(
      jsonb_build_object(
        'order', 1,
        'title', 'Instala engram',
        'description', 'Descarga y configura la librería',
        'code', 'pip install engram-sdk',
        'language', 'bash'
      ),
      jsonb_build_object(
        'order', 2,
        'title', 'Inicia sesión',
        'description', 'Autentica con tu API key',
        'code', 'from engram import Engram\ne = Engram(api_key="sk-...")',
        'language', 'python'
      ),
      jsonb_build_object(
        'order', 3,
        'title', 'Guarda tu primer recuerdo',
        'description', 'Prueba el endpoint de almacenamiento',
        'code', 'e.remember("contexto importante")\nprint(e.recall("contexto"))',
        'language', 'python'
      ),
      jsonb_build_object(
        'order', 4,
        'title', 'Integra con tu agente',
        'description', 'Conecta al sistema de LLM',
        'code', 'agent.memory = e\nagent.run("¿Quién soy?")',
        'language', 'python'
      ),
      jsonb_build_object(
        'order', 5,
        'title', 'Valida en consola',
        'description', 'Verifica logs y errores',
        'code', 'engram logs --last 10',
        'language', 'bash'
      )
    )
  ),
  4
),
(
  (SELECT id FROM public.workshops WHERE slug = 'engram'),
  'glosario',
  jsonb_build_object(
    'type', 'glosario',
    'title', 'Términos clave del taller',
    'search_placeholder', 'Buscar término o definición…'
  ),
  5
);

-- 12 GlossaryTerm rows for Engram workshop
INSERT INTO public.glossary_terms (workshop_id, term, definition, category) VALUES
(
  (SELECT id FROM public.workshops WHERE slug = 'engram'),
  'Vector Embedding',
  'Representación numérica de texto que captura su significado semántico. Usado para búsqueda similar.',
  'Conceptos'
),
(
  (SELECT id FROM public.workshops WHERE slug = 'engram'),
  'Recuperación Aumentada (RAG)',
  'Técnica de buscar información relevante en una base de datos y pasarla al LLM para mejorar respuestas.',
  'Técnicas'
),
... (10 more rows)
```

**Alternative:** Hardcode seed in TypeScript helper
- More type-safe
- Harder to replicate manually (for Jennifer)
- Decision: SQL seed file is more readable, can be re-run independently

---

## SQL Completo (Consolidado)

**Migraciones para aplicar en orden:**

1. `supabase/migrations/{timestamp}-create-sections.sql` — sections table + RLS
2. `supabase/migrations/{timestamp}-create-glossary-terms.sql` — glossary_terms + RLS
3. `supabase/migrations/{timestamp}-create-section-visits.sql` — section_visits + RLS
4. `supabase/seed.sql` (extension) — 5 sections + 12 glossary terms per workshop

(Ver D-5 para SQL completo de tablas)

---

## Estimación de Líneas por Slice

| Component | Slice | Lines | Notes |
|-----------|-------|-------|-------|
| Migrations (SQL) | 3a | 120 | 3 migration files + indexes + RLS |
| Zod schemas | 3a | 80 | Discriminated union per section type |
| Sidebar component | 3a | 140 | Tabs + icons + glow + drawer toggle |
| ProgressBar component | 3a | 70 | Gradient + % calculation |
| SectionRenderer wrapper | 3a | 60 | Switch by type |
| InicioSection component | 3a | 160 | Hero + quick links grid |
| AprendizajeSection component | 3a | 280 | Carousel + notes toggle + PDF link |
| `/taller/[slug]` route | 3a | 100 | Server layout + guard + props |
| Seed fixtures (SQL) | 3a | 100 | 5 sections + 12 glossary terms |
| E2E tests (3a flow) | 3a | 180 | Navigation, Inicio, Aprendizaje specs + RLS tests |
| **Slice 3a total** | | **~1,200** | |
| TallerSection component | 3b | 200 | Placeholder structure |
| InstalacionSection component | 3b | 260 | Steps + code copy + feedback |
| GlosarioSection component | 3b | 240 | Search + filter + flashcard flip |
| SocialFooter component | 3b | 60 | Icons + links from config |
| Social config file | 3b | 30 | SOCIAL_LINKS + SOCIAL_ICONS |
| Mobile drawer styles | 3b | 80 | Responsive sidebar CSS + breakpoints |
| E2E tests (3b flow) | 3b | 200 | Taller, Instalación, Glosario specs + full RLS suite |
| **Slice 3b total** | | **~1,300** | |
| **Grand Total** | | **~2,500** | |

---

## Component APIs & Zod Schemas

**(To be fully detailed in spec phase. Design-level sketches:)**

### Content JSON Discriminated Union

```typescript
type SectionContentJson =
  | {
      type: 'inicio';
      title: string;
      description: string;
      quick_links: Array<{
        label: string;
        target_section: 'aprendizaje' | 'taller' | 'instalacion' | 'glosario';
      }>;
    }
  | {
      type: 'aprendizaje';
      title: string;
      slides: Array<{
        kicker: string;
        title: string;
        body: string;
        notes?: string;
      }>;
      pdf_url?: string;
    }
  | {
      type: 'taller';
      title: string;
      instructions: string;
      placeholder?: string;
    }
  | {
      type: 'instalacion';
      title: string;
      steps: Array<{
        order: number;
        title: string;
        description: string;
        code: string;
        language: string;
      }>;
      success_message?: string;
    }
  | {
      type: 'glosario';
      title: string;
      search_placeholder: string;
    };
```

---

## Data Flow & Integration Points

### 1. User navigates to `/taller/{slug}`
- Server: `getRequiredUser()` + `getCurrentUserWorkshopAccess(slug)` + RLS checks
- Fetch: sections, glossary_terms (filtered by RLS)
- Fetch: section_visits count per section (to calculate progress %)
- Return data to layout

### 2. Client mounts SectionRenderer with activeSection = 'inicio'
- Renders InicioSection component
- InicioSection calls `recordSectionVisit(sectionId)` Server Action
- Server Action inserts row in section_visits (idempotent via UNIQUE)
- Progress bar refetches or updates optimistically

### 3. User clicks "Aprendizaje" tab
- Client: `setActiveSection('aprendizaje')`
- Sidebar re-renders with active tab indicator (cyan glow)
- AprendizajeSection mounts, calls `recordSectionVisit(sectionId)`
- Progress bar updates

### 4. User toggles notes in AprendizajeSection
- Client state: `notesOpen = !notesOpen`
- Notes panel slides in (CSS transition)
- No server interaction

### 5. User searches glossary
- Client state: `searchQuery = value`
- Filter glossary_terms array in memory
- Re-render filtered grid (instant)

### 6. User clicks "Glosario" flashcard
- Client state: `flipped[cardId] = !flipped[cardId]`
- 3D flip animation (CSS transform: rotateY)

---

## New Dependencies

**Zero new npm packages.** All components use existing stack:
- React 18 (hooks: useState, useEffect)
- Next.js 16 (Server/Client Components, Server Actions)
- Zod (schema validation)
- Supabase client (RLS enforced at DB level)

**CSS:** Extend globals.css with `@keyframes sdCheck`, `sdFlip` (no external animation library).

---

## RLS Boundary & Testing Strategy

**RLS policies (all 3 tables):**
- **Unauthorized:** 403 (no row access)
- **Redeemed access:** 200 (SELECT sections, glossary_terms, own section_visits)
- **Unredeemed access:** 403 (redeemed_at IS NULL fails EXISTS check)

**E2E tests (RLS coverage):**
```typescript
// Unauthorized
test('cannot access /taller/[slug] without workshop_access', async ({ page }) => {
  const res = await page.goto('/taller/engram', { waitUntil: 'networkidle' });
  expect(res.status()).toBe(403);
});

// Unredeemed
test('cannot access /taller/[slug] with unredeemed access', async ({ page, context }) => {
  // Create workshop_access with redeemed_at = NULL
  // Login as that user
  const res = await page.goto('/taller/engram', { waitUntil: 'networkidle' });
  expect(res.status()).toBe(403);
});

// Redeemed
test('can access /taller/[slug] with redeemed access', async ({ page }) => {
  // Create workshop_access with redeemed_at = now()
  // Login, navigate
  await page.goto('/taller/engram');
  await expect(page.locator('text=Inicio')).toBeVisible();
});
```

---

## Architectural Risks & Mitigations

### Risk 1: RLS EXISTS Query Performance
- **Issue:** EXISTS on workshop_access per row load could slow down large glossary_terms results
- **Mitigation:** Index on `(workshop_id, user_id, redeemed_at)` in workshop_access (create in change 2 or early 3a). Test with EXPLAIN ANALYZE on fixture data.

### Risk 2: Progress Bar Latency
- **Issue:** If progress refetch happens on every section click, could feel slow
- **Mitigation:** Optimistic update: increment % on client before Server Action resolves. Sync to server async. If request fails, refetch (pessimistic fallback).

### Risk 3: Sidebar Drawer Overflow on 360px
- **Issue:** Drawer overlay might not have enough height for 5 tabs + footer social links
- **Mitigation:** Drawer is scrollable (max-height: 100vh, overflow-y: auto). Footer sticky at bottom or separate section.

### Risk 4: Mobile Responsiveness Gaps
- **Issue:** Section content max-width 820-920px on desktop; how does it reflow on mobile?
- **Mitigation:** Add responsive breakpoints in slice 3b. Content padding scales down (40px → 20px on mobile). Test at 360, 375, 768, 1024, 1440px.

### Risk 5: Flashcard Flip Animation on Low-End Devices
- **Issue:** 3D CSS transforms might stutter on older phones
- **Mitigation:** Use `will-change: transform` on flashcard container. Fallback: skip 3D, just cross-fade if transform not supported (graceful degradation).

### Risk 6: Seed Data Not Provided by Jennifer
- **Issue:** Without sample content_json per section type, e2e cannot run
- **Mitigation:** Proposal includes full seed schema. Provide pre-filled sample content in migration (Jennifer can override in change 5). E2E uses those samples.

---

## ADR Candidates

### ADR-002: Server-Side Progress Tracking (Recommended)
- **Decision:** section_visits table (D-1) as baseline for progress % calculation
- **Rationale:** Persistence across devices, simple RLS, extensible for change 4
- **Alternatives rejected:** localStorage (device-bound, complex sync)
- **Impact:** Adds 1 table + RLS + Server Action
- **Status:** Captured in D-1, recommend creating ADR-002 if architectural review needed

---

## Open Issues (None — All Closed)

All decisions in D-1 to D-12 are finalized. No blockers for spec → tasks transition.

---

## Spec & Task Dependencies

**Ready for:**
- ✓ `sdd-spec` — can start immediately (no dependencies on this design, runs in parallel)
- ✓ `sdd-tasks` — has all architectural decisions, sizing, and dependencies needed

**Blockers resolved:**
- ✓ ADR-001 (content_json) — locked
- ✓ RLS pattern — locked (change 2 precedent)
- ✓ SQL schema — locked
- ✓ Component structure — locked
- ✓ Slicing strategy — locked

---

## Review Criteria Checklist

- [ ] All 5 section types have content_json schema (Zod)
- [ ] RLS policies are exhaustive (unauthorized, unredeemed, redeemed flows)
- [ ] Mobile sidebar responsive (hamburger on 360px, fixed on 768px+)
- [ ] Progress bar calculation correct (visited sections / 5)
- [ ] Server Actions are idempotent (ON CONFLICT DO NOTHING for visits)
- [ ] No new dependencies added
- [ ] E2E test coverage: 5 section flows + 3 RLS scenarios
- [ ] Migrations are reversible (DROP TABLE with CASCADE)
- [ ] Seed data loads without errors
- [ ] Component APIs finalized (props, state, return types)

---

## Next Recommended Phases

1. **sdd-spec** (parallel) — Zod schemas, content_json samples, RLS SQL, component API docs, e2e test plan
2. **sdd-tasks** (after spec) — Break slices 3a + 3b into work units, assign story points
3. **sdd-apply** (after tasks) — Implement slice 3a, test, PR
4. **sdd-apply** (batch 2) — Implement slice 3b, test, PR
5. **sdd-verify** — Validate both PRs against spec
6. **sdd-archive** — Close change, document learnings

---

## Artifact References

- **ADR-001:** `docs/decisions/ADR-001-content-json-schema-fijo-por-tipo.md` (locked)
- **Proposal:** `openspec/changes/workshop-sections/proposal.md`
- **Brief §6:** Data model definition
- **Brief §7.2 & §7.3:** Workshop navigation flows
- **Archive-report (change 2):** RLS pattern, chained PRs, e2e lessons
- **Prototype:** `design/portal-talleres/SDIH Talleres.dc.html` (visual reference)

---

## Engram Topic Key

**topic_key:** `sdd/workshop-sections/design`  
**type:** architecture  
**status:** Design complete, ready for spec + tasks
