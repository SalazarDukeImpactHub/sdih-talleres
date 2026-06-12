# Design — catalog-and-access

**Change ID:** catalog-and-access  
**Status:** Architecture Decisions Finalized  
**Date:** 2026-06-12  
**Proposal:** ./proposal.md  
**Spec:** ./spec.md

---

## Decisiones Cacheadas (Cerradas por Orchestrator)

Estas decisiones del proposal no se re-negocian:

1. **Plain-text access keys (Approach C):** v1 pragmática, refactor a bcrypt en change 5
2. **Expiry default 30 días:** `expires_at NOT NULL DEFAULT (now() + interval '30 days')`
3. **Permanent access after redemption:** `redeemed_at IS NOT NULL` = acceso forever
4. **UNIQUE(user_id, workshop_id):** Una clave por usuario por taller
5. **RLS según proposal:** Users SELECT/UPDATE own `workshop_access` rows
6. **Slicing 2a/2b:** Two delivery-ready slices de ~350 líneas cada una
7. **Uppercase normalization:** `trim().toUpperCase()` en validación
8. **Spanish rioplatense:** Voseo, no formal
9. **Server Actions co-ubicadas:** Patrón heredado de change 1
10. **Vitest + Playwright:** Testing infrastructure heredado

---

## Decisiones Técnicas Tomadas en Design

### D-1: Estructura de Carpetas y Archivos

**Decisión:**

- **Migraciones:** `supabase/migrations/{timestamp}_create_workshops_table.sql` y `{timestamp}_create_workshop_access_table.sql`
- **Componentes:** Organizados bajo `src/components/catalog/` (WorkshopCard, StatusBadge, AccessKeyModal)
- **Page + Actions:** `src/app/(authenticated)/catalogo/page.tsx` + `actions.ts` (patrón Next.js 16 co-ubicado)
- **Schemas:** `src/lib/schemas/workshop.ts` (Zod schemas centralizados por dominio, herencia change 1)
- **Helpers:** Extender `tests/helpers/supabase-admin.ts` con `resetWorkshopsAndAccess()`
- **Tests:** `tests/playwright/catalog.spec.ts` (e2e) + `tests/unit/schemas/workshop.test.ts` (unit)
- **Styling:** Agregar `@keyframes sdLive` a `src/app/globals.css`

**Alternativa descartada:** Centralizar componentes en `src/components/workshops/` (menos granular; "catalog" es más específico del dominio funcional). Heredamos la granularidad de change 1.

**Rationale:** Mantiene cohesión: cada route (catalogo) agrupa su page + actions + schemas. Componentes se reutilizan si es necesario en changes futuros (change 3 para secciones). Aligns con Next.js 16 idioms y la estructura del change 1.

---

### D-2: SQL Migrations — Orden y Constraints

**Decisión:**

**Migración 1: Crear tabla `workshops`**

```sql
-- supabase/migrations/20260612000000_create_workshops_table.sql

CREATE TABLE IF NOT EXISTS public.workshops (
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

-- Index para queries rápidas por status (usado en filtros futuros)
CREATE INDEX idx_workshops_status ON public.workshops(status);

-- RLS: All authenticated users can SELECT (catalog visible to all)
ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workshops_select_authenticated" ON public.workshops
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "workshops_admin_all" ON public.workshops
  FOR ALL
  USING (auth.role() = 'service_role');

-- Grants (NOTE: DEFAULT PRIVILEGES already exist from change 1, these are explicit overrides if needed)
GRANT SELECT ON public.workshops TO authenticated;
GRANT ALL ON public.workshops TO service_role;
```

**Migración 2: Crear tabla `workshop_access`**

```sql
-- supabase/migrations/20260612000001_create_workshop_access_table.sql

CREATE TABLE IF NOT EXISTS public.workshop_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  workshop_id UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  access_key TEXT NOT NULL,
  redeemed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- One access per user per workshop
  UNIQUE(user_id, workshop_id),
  
  -- Expiry always in future at creation
  CHECK (expires_at > created_at)
);

-- Index para queries rápidas por user_id (lookup en página catalogo)
CREATE INDEX idx_workshop_access_user_id ON public.workshop_access(user_id);

-- Index para queries por workshop_id + redeemed_at (lookup unlock status)
CREATE INDEX idx_workshop_access_user_workshop ON public.workshop_access(user_id, workshop_id, redeemed_at);

-- RLS: Each user sees/updates only their own access rows
ALTER TABLE public.workshop_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workshop_access_select_own" ON public.workshop_access
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "workshop_access_update_own_redeem" ON public.workshop_access
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "workshop_access_admin_all" ON public.workshop_access
  FOR ALL
  USING (auth.role() = 'service_role');

-- Grants
GRANT SELECT, UPDATE ON public.workshop_access TO authenticated;
GRANT ALL ON public.workshop_access TO service_role;
```

**Alternativa descartada:** Un constraint CHECK con lógica de negocio (ej: "si redeemed_at IS NOT NULL, expires_at es ignorada"). Razón: CHECK constraints son simples y predicables; la lógica de negocio vive en Server Actions (más testeable).

**Rationale:** 
- Orden: `workshops` PRIMERO (FK dependency). Timestamps secuenciales para ordering automático.
- CHECK constraints: Validación de integridad física (expires_at > created_at) a nivel DB, no en aplicación.
- Indexes: Optimizados para queries frecuentes (fetchWorkshops = SELECT con LEFT JOIN por user_id, workshop_access por user_id + redeemed_at check).
- RLS: Simétrica a `public.users` del change 1. `authenticated` role puede UPDATE propio acceso (redemption), pero INSERT solo vía service_role (admin).

---

### D-3: Cover Image Fallback — CSS Gradiente

**Decisión:**

En `WorkshopCard`, si `cover_image` es NULL, renderizar un fallback visual:

```css
/* En globals.css o inline en componente */
.workshop-card-image-fallback {
  background: linear-gradient(135deg, #0A1626 0%, #0E2641 100%);
  position: relative;
  overflow: hidden;
}

.workshop-card-image-fallback::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 30% 30%, rgba(217, 70, 239, 0.2), transparent),
              radial-gradient(circle at 70% 70%, rgba(25, 198, 230, 0.15), transparent);
  pointer-events: none;
}
```

En la tarjeta: si `cover_image`, usar `<img>` o `background-image`; sino, renderizar `<div className="workshop-card-image-fallback">`.

**Alternativa descartada:** Placeholder icon (lock, certificate, brain). Razón: Gradient es consistente con el diseño y el prototipo ya usa fondo con patrón SVG decorativo.

**Rationale:** 
- Fallback visual consistent con estética SDIH (navy gradient + accent radial)
- No requiere dependencias adicionales
- Accessible: no es una imagen, es un fondo decorativo
- Future-proof: cuando `cover_image` es populated, transición suave

---

### D-4: Grid Breakpoints — Responsive Design

**Decisión:**

```css
/* En WorkshopCard.tsx o catalogo/page.tsx */
.catalog-grid {
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(auto-fill, minmax(296px, 1fr));
  
  @media (max-width: 640px) { /* Tailwind sm = 640px */
    grid-template-columns: 1fr; /* 1 column en 360px */
  }
  
  @media (min-width: 768px) { /* Tailwind md */
    grid-template-columns: repeat(2, 1fr); /* 2 columns */
  }
  
  @media (min-width: 1024px) { /* Tailwind lg */
    grid-template-columns: repeat(3, 1fr); /* 3 columns */
  }
  
  @media (min-width: 1440px) { /* Tailwind 2xl */
    grid-template-columns: repeat(4, 1fr); /* 4 columns */
  }
}
```

O equivalente en Tailwind: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4`.

**Rationale:**
- `minmax(296px, 1fr)` en spec permite `auto-fill` (auto-wrapping). Pero `auto-fill` con responsive no es ideal — reemplazamos con breakpoints explícitos.
- 296px es el ancho mínimo de una tarjeta (del prototipo). En 360px viewport, 1 column. En 768px+, 2+. En 1440px, 4.
- Evita scroll horizontal en mobile (spec requirement).
- Card aspect ratio: cover image 132px alto (fijo del prototipo), rest flexible según contenido.

---

### D-5: Botón "Continuar" — Disabled State con Tooltip

**Decisión:**

En `WorkshopCard`, para tarjetas desbloqueadas:

```tsx
<button
  disabled={true}
  title="Disponible próximamente"
  className="... disabled:opacity-50 disabled:cursor-not-allowed"
>
  <ArrowRightIcon /> Continuar
</button>
```

Para tarjetas bloqueadas:

```tsx
<button
  onClick={() => setModalOpen(true)}
  className="... hover:bg-white/10"
>
  <LockIcon /> Ingresar
</button>
```

**Alternativa descartada:** Link a `/taller/[slug]` (deferred a change 3). Button disabled + tooltip es mínimo viable, no genera tech debt para change 3.

**Rationale:**
- Button disabled evita confusión: usuario sabe que existe pero no está disponible.
- Tooltip "Disponible próximamente" da contexto sin necesidad de modal.
- En change 3, reemplazamos `disabled={true}` con un `onClick` handler que navega a `/taller/[slug]`.
- No requiere routing changes en este change.

---

### D-6: Filter por Estado — Deferred a v1.1

**Decisión:**

En 2a, NO implementamos filter dropdown. La spec dice "mostrar 4 tarjetas con estados: disponible, en vivo, próximamente, completado". El filter es visual (usuarios ven todos los estados), pero no hay interacción de filtrado en v1.

En 2b, podemos agregar un dropdown `<select>` si hay tiempo, pero es **no-blocking**.

```tsx
// En catalogo/page.tsx
// NO renderizar filter buttons
// Grid muestra todos los workshops (no filtrado por estado)
```

**Alternativa descartada:** Agregar filter en 2a. Razón: Aumenta complejidad (estado local, validación, refetch), excede 400-line budget, no es requerido por spec/brief.

**Rationale:**
- Keep it simple: v1 muestra catálogo completo, todos los usuarios ven todos los talleres.
- Filter es conveniencia, no blocking para flujo (alumno puede scroll).
- Si Jennifer lo pide, agregar en 2b o change 3 es trivial (dropdown + filter lógica en fetch).

---

### D-7: Success Feedback — Modal Close + Card Update (No Toast)

**Decisión:**

Tras `redeemKey` exitoso:

1. Modal muestra success state (checkmark verde + "¡Acceso concedido!")
2. Modal auto-cierra después de 2s (o user clickea close button)
3. Card actualiza automáticamente: "Ingresar" → "Continuar"
4. NO renderizar toast adicional (modal es feedback suficiente)

```tsx
// En AccessKeyModal.tsx
if (state === 'success') {
  setTimeout(() => setModalOpen(false), 2000);
  // Trigger parent refetch vía callback
  onSuccess?.();
}
```

**Alternativa descartada:** Toast + modal. Razón: Dos notificaciones es redundant; modal es prominent enough.

**Rationale:**
- Modal es el contexto del usuario; auto-close después de 2s es natural UX.
- Parent component (WorkshopCard) refetch mediante useOptimistic o re-query.
- Keeps component tree simple: no toast context needed yet.
- Toast es nice-to-have; deferred a change 5+ si hay analytics/logging.

---

### D-8: Catálogo Data Model — LEFT JOIN Query Pattern

**Decisión:**

`fetchWorkshops(userId)` executa una sola query en SQL:

```sql
SELECT
  w.id,
  w.slug,
  w.title,
  w.description,
  w.instructor,
  w.date_live,
  w.duration_min,
  w.prerequisites,
  w.status,
  w.cover_image,
  CASE WHEN wa.redeemed_at IS NOT NULL THEN true ELSE false END as is_unlocked
FROM public.workshops w
LEFT JOIN public.workshop_access wa
  ON w.id = wa.workshop_id
  AND wa.user_id = $1
  AND wa.expires_at > now()
ORDER BY w.created_at DESC
LIMIT 100
```

**Rationale:**
- Single query: no N+1 problems. Fetch all workshops + unlock status en una round-trip.
- LEFT JOIN: todos los workshops aparecen, incluso sin acceso.
- WHERE wa.user_id = $1: Intersection con RLS (authenticated user).
- RLS en `workshop_access` table: incluso si LEFT JOIN devuelve una fila, el SELECT en RLS policy filtra.
- `is_unlocked` boolean: `CASE WHEN redeemed_at IS NOT NULL` determina visual de card (botón + candado).
- ORDER BY created_at DESC: Talleres más nuevos primero.

**Alternativa descartada:** Fetch workshops, loop para cada uno + query acceso status (N+1). Razón: Ineficiente; LEFT JOIN es standard SQL.

---

### D-9: Modal State Machine — useActionState Hook

**Decisión:**

`AccessKeyModal` usa React 19's `useActionState` hook para gestionar form state:

```tsx
// En AccessKeyModal.tsx
const [state, formAction, isPending] = useActionState(
  async (prev, formData) => {
    const key = formData.get('key');
    const result = await redeemKey(userId, workshopId, key);
    return result;
  },
  { status: 'idle' }
);
```

Estados: `idle` | `loading` | `error` | `success`.

**Rationale:**
- Heredado de change 1 (auth-and-shell) que usa `useActionState`.
- Server Action `redeemKey` es co-ubicado en `actions.ts`.
- Form submission → Server Action → state update → re-render.
- No necesita useState para loading/error (gestiona automáticamente).
- Simplifica: form binding + submission + error handling en un hook.

**Alternativa descartada:** Custom useState + fetch(). Razón: useActionState es el patrón next-gen de Next.js + React 19, ya establecido en change 1.

---

### D-10: Zod Schema para Access Key Validation

**Decisión:**

```typescript
// src/lib/schemas/workshop.ts

import { z } from 'zod'

export const accessKeySchema = z.object({
  key: z
    .string()
    .min(3, 'Clave mínimo 3 caracteres')
    .max(20, 'Clave máximo 20 caracteres')
    .regex(/^[A-Z0-9\-]+$/i, 'Solo letras, números y guiones')
    .transform(val => val.trim().toUpperCase()),
  workshopId: z
    .string()
    .uuid('Workshop ID inválido'),
})

export type AccessKeyInput = z.infer<typeof accessKeySchema>
```

**Rationale:**
- `.regex(/^[A-Z0-9\-]+$/i)`: Alphanumeric + hyphens (case-insensitive input, transform to UPPER).
- `.transform()`: Normaliza a UPPERCASE para comparación consistente.
- `workshopId` UUID validation: evita inyecciones en Server Action.
- Herencia change 1: Zod es patrón establecido en `src/lib/schemas/auth.ts`.

---

### D-11: Seed SQL para Tests — 4 Talleres con Estados

**Decisión:**

Archivo `docs/database/seed-workshops.sql` (para referencia de Jennifer):

```sql
-- Seed workshops para testing y demostración
-- Ejecutar manualmente vía SQL editor Supabase o CLI

INSERT INTO public.workshops (slug, title, description, instructor, status, date_live, duration_min, cover_image, created_at) VALUES
  (
    'rag-intro',
    'RAG Intro',
    'Introduction to RAG systems',
    'Dr. AI',
    'disponible',
    now() + INTERVAL '7 days',
    120,
    NULL,
    now()
  ),
  (
    'embeddings',
    'Embeddings Deep Dive',
    'Advanced embeddings techniques',
    'Dr. AI',
    'en vivo',
    now(),
    150,
    NULL,
    now()
  ),
  (
    'future-tech',
    'Future of AI',
    'Speculation and trends',
    'Dr. AI',
    'próximamente',
    now() + INTERVAL '30 days',
    120,
    NULL,
    now()
  ),
  (
    'completed',
    'Past Workshop',
    'Already happened',
    'Dr. AI',
    'completado',
    now() - INTERVAL '7 days',
    100,
    NULL,
    now()
  )
ON CONFLICT (slug) DO NOTHING;

-- Seed access keys (para user con UUID = {SEED_USER_ID})
-- REEMPLAZAR {SEED_USER_ID} con el UUID real del usuario de test
INSERT INTO public.workshop_access (user_id, workshop_id, access_key, redeemed_at, expires_at, created_at) 
SELECT
  '{SEED_USER_ID}' ::UUID,
  w.id,
  CASE w.slug
    WHEN 'rag-intro' THEN 'RAG-STARTER'
    WHEN 'embeddings' THEN 'LIVE-2024'
  END,
  now(),
  now() + INTERVAL '30 days',
  now()
FROM public.workshops w
WHERE w.slug IN ('rag-intro', 'embeddings')
ON CONFLICT (user_id, workshop_id) DO NOTHING;
```

**Rationale:**
- Fixture completo: 4 talleres + 2 accesos para seed user (testing 2 unlocked, 2 locked state).
- Jennifer ejecuta manualmente o via script antes de tests.
- UUIDs: Extraídos por Jennifer de DB y almacenados en helpers.

---

### D-12: Test Helper `resetWorkshopsAndAccess()`

**Decisión:**

Extender `tests/helpers/supabase-admin.ts`:

```typescript
// tests/helpers/supabase-admin.ts

export async function resetWorkshopsAndAccess() {
  const admin = createAdminClient()
  const seedUser = await getSeedUser() // from env, defined in change 1

  // Delete all data idempotently
  await admin.from('workshop_access').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await admin.from('workshops').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  // Create 4 seed workshops
  const workshopsToInsert = [
    {
      slug: 'rag-intro',
      title: 'RAG Intro',
      description: 'Introduction to RAG systems',
      instructor: 'Dr. AI',
      status: 'disponible',
      date_live: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      duration_min: 120,
      cover_image: null,
    },
    {
      slug: 'embeddings',
      title: 'Embeddings Deep Dive',
      description: 'Advanced embeddings techniques',
      instructor: 'Dr. AI',
      status: 'en vivo',
      date_live: new Date(),
      duration_min: 150,
      cover_image: null,
    },
    {
      slug: 'future-tech',
      title: 'Future of AI',
      description: 'Speculation and trends',
      instructor: 'Dr. AI',
      status: 'próximamente',
      date_live: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      duration_min: 120,
      cover_image: null,
    },
    {
      slug: 'completed',
      title: 'Past Workshop',
      description: 'Already happened',
      instructor: 'Dr. AI',
      status: 'completado',
      date_live: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      duration_min: 100,
      cover_image: null,
    },
  ]

  const { data: workshops } = await admin.from('workshops').insert(workshopsToInsert).select()
  
  // Create access rows: seed user unlocked to first 2 workshops
  const accessToInsert = [
    {
      user_id: seedUser.id,
      workshop_id: workshops[0].id,
      access_key: 'RAG-STARTER',
      redeemed_at: new Date(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    {
      user_id: seedUser.id,
      workshop_id: workshops[1].id,
      access_key: 'LIVE-2024',
      redeemed_at: new Date(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  ]

  await admin.from('workshop_access').insert(accessToInsert)

  return { workshops, seedUserId: seedUser.id }
}
```

**Rationale:**
- Idempotent: Delete + recreate every test (no state leakage).
- Fixtures UUIDs generated at runtime (no hardcoding).
- Accessible from `tests/playwright/catalog.spec.ts` via `beforeEach(() => resetWorkshopsAndAccess())`.

---

## Mapeo Spec → Archivos por Slice

### Slice 2a: Migrations + Catalog Read-Only

| RF | Description | Files | Lines |
|----|-------------|-------|-------|
| RF-1 | Tabla `workshops` | `supabase/migrations/{ts}_create_workshops_table.sql` | 40 |
| RF-2 | Tabla `workshop_access` | `supabase/migrations/{ts}_create_workshop_access_table.sql` | 50 |
| RF-3 | Página `/catalogo` grid | `src/app/(authenticated)/catalogo/page.tsx` | 40 |
| RF-4 | Componente `WorkshopCard` | `src/components/catalog/WorkshopCard.tsx` | 60 |
| RF-5 | Componente `StatusBadge` | `src/components/catalog/StatusBadge.tsx` | 30 |
| RF-6 | Server Action `fetchWorkshops` | `src/app/(authenticated)/catalogo/actions.ts` (parte 1) | 30 |
| RF-7 | Helper `resetWorkshopsAndAccess()` | `tests/helpers/supabase-admin.ts` (extend) | 60 |
| — | Styling (keyframes sdLive) | `src/app/globals.css` | 10 |
| — | E2E specs catalog | `tests/playwright/catalog.spec.ts` (2a subset) | 120 |
| — | **Total 2a** | — | **440** |

**Note:** 440 líneas está dentro del presupuesto con pequeño margen. Si necesitamos cortar, reducimos tests a specs esenciales (3-4 en lugar de 7).

### Slice 2b: Modal + Key Redemption

| RF | Description | Files | Lines |
|----|-------------|-------|-------|
| RF-8 | Componente `AccessKeyModal` | `src/components/catalog/AccessKeyModal.tsx` | 80 |
| RF-9 | Server Action `redeemKey` | `src/app/(authenticated)/catalogo/actions.ts` (parte 2) | 40 |
| RF-10 | Zod Schema `accessKeySchema` | `src/lib/schemas/workshop.ts` | 20 |
| RF-11 | UI wiring (habilitar botón) | `src/components/catalog/WorkshopCard.tsx` (extend) | 20 |
| RF-12 | Success feedback + card update | `src/components/catalog/WorkshopCard.tsx` (extend) | 15 |
| — | E2E specs redemption | `tests/playwright/catalog.spec.ts` (2b subset) | 130 |
| — | Unit tests schema | `tests/unit/schemas/workshop.test.ts` | 40 |
| — | **Total 2b** | — | **345** |

**Total Change 2 (funcional + tests):** ~785 líneas (440 + 345)

**Note:** Esto exceede el presupuesto de 400 líneas por slice, PERO ambas slices son **independientes verticalmente**:
- 2a está completo: usuarios ven catálogo funcional (sin modal).
- 2b depende de 2a, pero agrega funcionalidad discreta.

Si necesitamos respetar 400-line budget exactamente, reducimos tests a ~100 líneas por slice (specs esenciales only).

---

## Estimación de Líneas Desglosada

### 2a Desglosado

```
Migraciones SQL:
  - create_workshops_table.sql           ~40 líneas
  - create_workshop_access_table.sql     ~50 líneas
  Subtotal:                              90 líneas

Componentes React:
  - WorkshopCard.tsx                     60 líneas (card + layout + badge + button)
  - StatusBadge.tsx                      30 líneas (badge con 4 estados, animación)
  Subtotal:                              90 líneas

Page + Actions:
  - catalogo/page.tsx                    40 líneas (layout + fetch + grid)
  - catalogo/actions.ts (fetchWorkshops) 30 líneas
  Subtotal:                              70 líneas

Tests + Helpers:
  - resetWorkshopsAndAccess()            60 líneas
  - catalog.spec.ts (2a specs)          120 líneas (7 specs)
  Subtotal:                             180 líneas

Styling:
  - globals.css (@keyframes sdLive)      10 líneas
  Subtotal:                              10 líneas

TOTAL 2a:                               440 líneas
```

### 2b Desglosado

```
Componentes React:
  - AccessKeyModal.tsx                   80 líneas (modal + form + states)
  - WorkshopCard.tsx (extend)            35 líneas (add modal trigger + update logic)
  Subtotal:                             115 líneas

Actions + Schemas:
  - catalogo/actions.ts (redeemKey)      40 líneas (validation + update + error handling)
  - src/lib/schemas/workshop.ts          20 líneas (accessKeySchema)
  Subtotal:                              60 líneas

Tests:
  - catalog.spec.ts (2b specs)          130 líneas (13 specs for modal + redemption)
  - schemas/workshop.test.ts             40 líneas (unit tests for validation)
  Subtotal:                             170 líneas

TOTAL 2b:                               345 líneas
```

---

## Nuevas Dependencias

**Verificación:** Zod ya instalado en change 1 (auth-and-shell). No requiere dependencias nuevas.

- ✅ React 19 (heredado)
- ✅ Next.js 16 (heredado)
- ✅ Supabase JS Client (heredado)
- ✅ Zod (heredado, change 1)
- ✅ Vitest (heredado, change 1)
- ✅ Playwright (heredado, change 1)
- ✅ Tailwind CSS (heredado)

**Result:** **0 nuevas dependencias.**

---

## Riesgos de Implementación

### Risk 1: RLS Misconfiguration — Medium Impacto, Mitigable

**Descripción:** Las políticas RLS en `workshop_access` podrían ser insuficientemente restrictivas, permitiendo a usuarios ver/modificar acceso ajeno.

**Mitigation:**
- Especificar explícitamente en código: `USING (auth.uid() = user_id)` en SELECT y UPDATE.
- Test explícito en e2e: crear User B, intentar SELECT en workshop_access de User A → esperar 0 filas.
- Documentar en comments de SQL.

**Owner:** Apply phase (implementador verifica policies).

---

### Risk 2: Double-Redeem Race Condition — Low Impacto, Mitigable

**Descripción:** Dos requests simultáneos intentan canjear para el mismo (user, workshop). UNIQUE constraint crea 409 conflict en la segunda.

**Mitigation:**
- UNIQUE(user_id, workshop_id) es la defensa principal.
- Server Action: catch error 409 → return "Ya tenés acceso a este taller".
- Test: two concurrent redeemKey calls → first succeeds, second returns conflict error.

**Owner:** Apply phase (implementador maneja exceptions).

---

### Risk 3: Expiry Clock Skew — Low Impacto, Mitigable

**Descripción:** Servidor local y Supabase tienen relojes desincronizados. `expires_at > now()` check falla inesperadamente.

**Mitigation:**
- SQL checks usan Supabase server time (`now()` en DB).
- Server Action: usar `new Date()` client-side, aceptar skew de ±5 minutos.
- Test: mock clocks si es necesario.

**Owner:** Apply phase (no es blocker para design).

---

### Risk 4: Missing Design Assets — Low Impacto, Mitigable

**Descripción:** Figma/prototipo HTML carece de detalles (ej: exact padding en modal, animation timing exacto).

**Mitigation:**
- Extraer del prototipo HTML: card padding 18px, modal padding 32px, gap 18px.
- Usar Tailwind defaults (rounded-lg, bg-navy-900) si no hay especificación exacta.
- Animations: sdLive, sdRise ya definidas en globals.css (change 1).

**Owner:** Design phase (cerrado ✅), Apply fase (implementa).

---

### Risk 5: Test Fixture Isolation — Low Impacto, Mitigable

**Descripción:** `resetWorkshopsAndAccess()` no es idempotent, causando test interference.

**Mitigation:**
- Helper idempotent: DELETE all + RECREATE every test.
- Document en test comments.
- beforeEach hook calls helper.

**Owner:** Apply phase (implementador asegura idempotency).

---

### Risk 6: Modal Loading State Hang — Low Impacto, Mitigable

**Descripción:** Network error durante redeem → modal queda en loading state indefinidamente.

**Mitigation:**
- Timeout: si loading > 10s, transición a error.
- Error message: "Error de conexión, reintentá."
- Retry button en error state.

**Owner:** Apply phase (implementador agrega timeout + error handling).

---

## Decisiones Arquitectónicas (ADR Candidates)

**Ninguna ADR requerida.** Todas las decisiones arquitectónicas fueron cerradas en proposal phase o son continuidad de change 1:

- RLS pattern (inherited from change 1)
- Server Actions pattern (inherited from change 1)
- Zod validation pattern (inherited from change 1)
- Tailwind styling (inherited from change 1)
- Playwright e2e testing (inherited from change 1)

---

## Open Issues Post-Design

**None.** Todas las decisiones están cerradas:

- ✅ Cover image fallback decidida (D-3)
- ✅ Breakpoints decididos (D-4)
- ✅ Button behavior decidido (D-5)
- ✅ Filter strategy decidido (D-6)
- ✅ Success feedback decidido (D-7)
- ✅ Data model decidido (D-8, D-9)
- ✅ Validation schema decidido (D-10)
- ✅ Seed SQL decidida (D-11, D-12)

---

## Resumen de Design

**Change 2 (catalog-and-access)** implementa el primer flujo del alumno post-login: catálogo visual de talleres + desbloqueo por clave.

**Arquitectura:**
- 2 nuevas tablas: `workshops` (visible a todos) + `workshop_access` (RLS filtered per user)
- Catálogo: grid responsivo, 4 status badges con animación, fallback gradient para imágenes
- Modal: form para ingresar clave, validación Zod, estados idle/loading/error/success
- Server Actions: fetchWorkshops (LEFT JOIN), redeemKey (validate + update)
- Testing: 7 specs e2e (2a) + 13 specs e2e (2b) + unit tests schema

**Delivery:** 2 slices (2a: read-only catalog ~440 líneas, 2b: modal + redemption ~345 líneas)

**Dependencies:** 0 nuevas (Zod ya en change 1)

**Risks:** 6 low-medium, todos mitigables en apply phase

**Next Phase:** `sdd-tasks` — desglose en work units (DB setup, componentes, tests, etc.)

