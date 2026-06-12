# Spec — catalog-and-access

**Change ID:** catalog-and-access  
**Status:** Draft  
**Date:** 2026-06-12  
**Proposal:** ./proposal.md  
**Brief:** ../../docs/brief.md

---

## Requisitos funcionales

### RF-1 [2a]: Migración — Tabla `workshops`
Crear tabla `public.workshops` con:
- `id` UUID primary key, default `gen_random_uuid()`
- `slug` TEXT NOT NULL UNIQUE
- `title` TEXT NOT NULL
- `description` TEXT NOT NULL
- `instructor` TEXT NOT NULL
- `date_live` TIMESTAMPTZ (nullable, fecha del evento)
- `duration_min` INTEGER (nullable, duración en minutos)
- `prerequisites` TEXT (nullable, requisitos previos)
- `status` TEXT NOT NULL CHECK (status IN ('disponible', 'en vivo', 'próximamente', 'completado'))
- `cover_image` TEXT (nullable, URL de imagen)
- `whatsapp_message_template` TEXT (nullable, para change 7)
- `price_display` TEXT (nullable, para cambios futuros)
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT now()

Aplicar RLS:
- Política `workshops_select_for_authenticated`: SELECT para role `authenticated`
- Política `workshops_admin_full`: ALL (INSERT/UPDATE/DELETE) para role `service_role`
- Grant: `GRANT SELECT ON public.workshops TO authenticated`
- Grant: `GRANT ALL ON public.workshops TO service_role`

### RF-2 [2a]: Migración — Tabla `workshop_access`
Crear tabla `public.workshop_access` con:
- `id` UUID primary key, default `gen_random_uuid()`
- `user_id` UUID NOT NULL REFERENCES `public.users(id)` ON DELETE CASCADE
- `workshop_id` UUID NOT NULL REFERENCES `public.workshops(id)` ON DELETE CASCADE
- `access_key` TEXT NOT NULL (clave alfanumérica + guiones, normalizada a UPPERCASE para comparación)
- `redeemed_at` TIMESTAMPTZ (nullable, timestamp cuando se canjeó la clave)
- `expires_at` TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days') (expiración de la clave antes del canje)
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT now()
- UNIQUE constraint: `UNIQUE(user_id, workshop_id)` (una clave por usuario por taller)
- CHECK constraint: `CHECK (expires_at > created_at)` (expiración siempre en el futuro)

Aplicar RLS:
- Política `workshop_access_select_own`: SELECT solo si `auth.uid() = user_id`
- Política `workshop_access_update_own_redeem`: UPDATE solo si `auth.uid() = user_id` (para canje)
- Política `workshop_access_admin_full`: ALL para role `service_role`
- Grant: `GRANT SELECT, UPDATE ON public.workshop_access TO authenticated`
- Grant: `GRANT ALL ON public.workshop_access TO service_role`

### RF-3 [2a]: Catálogo — Página `/catalogo/page.tsx`
Renderizar grid responsivo de tarjetas de talleres:
- Fetch de todos los workshops + acceso del usuario actual en una sola query
- Grid layout responsive: 1 columna en 360px, 2 en 768px, 3-4 en 1024px+
- Mostrar 4 tarjetas con estados: disponible, en vivo, próximamente, completado (según datos seed)
- Cards sin scroll horizontal en 360px
- Query debe usar LEFT JOIN: workshops × workshop_access (filtered by user_id)
- Mostrar visual correcto: tarjeta con candado para no-desbloqueado, sin candado para desbloqueado

### RF-4 [2a]: Componente `WorkshopCard`
Tarjeta individual para cada taller:
- Estructura: imagen cover + título + descripción + instructor + fecha + badge de estado + botón
- Cover image: `background-image` si exists, fallback a color/gradient navy si `cover_image IS NULL`
- Badge de estado: componente `StatusBadge` (4 estados)
- Mostrar ícono de candado para talleres sin `workshop_access` (redeemed_at IS NULL)
- Botón "Ingresar" para talleres bloqueados (action: abre modal en 2b)
- Botón "Continuar" para talleres desbloqueados (disabled con tooltip "Disponible próximamente" hasta change 3)
- Responsive: card ancho 100% en mobile, flex wrap en desktop
- Accesibilidad: aria-label en imagen, semántica correcta

### RF-5 [2a]: Componente `StatusBadge` (4 estados)
Badge visual que muestra estado del taller:
- **Disponible** (cyan #19C6E6): dot static, fondo navy con blur, rounded-full
- **En vivo** (magenta #D946EF): dot animado con keyframe `sdLive` (pulsación), fondo navy con blur
- **Próximamente** (yellow #FACC15): dot static, fondo navy con blur
- **Completado** (lime #A3E635): dot static, fondo navy con blur
- Accesibilidad: aria-label con estado completo

### RF-6 [2a]: Server Action `fetchWorkshops(userId)`
Fetch all workshops + user's unlock status in one query:
```sql
SELECT
  w.id, w.slug, w.title, w.description, w.instructor,
  w.date_live, w.duration_min, w.status, w.cover_image,
  CASE WHEN wa.redeemed_at IS NOT NULL THEN true ELSE false END as is_unlocked
FROM public.workshops w
LEFT JOIN public.workshop_access wa ON w.id = wa.workshop_id AND wa.user_id = $1
ORDER BY w.created_at DESC
```
- Returns: array of workshops with `is_unlocked` boolean
- No filtering; all workshops visible (pero algunos con candado)
- Server-side only (no secrets exposed)

### RF-7 [2a]: Seed de workshops para tests
Helper `resetWorkshopsAndAccess()` en `tests/helpers/supabase-admin.ts`:
- Crear 4 workshops con estados: disponible, en vivo, próximamente, completado
- Exact fixtures:
  - ws-1: slug `rag-intro`, title `RAG Intro`, status `disponible`, date_live future (+7 days)
  - ws-2: slug `embeddings`, title `Embeddings Deep Dive`, status `en vivo`, date_live now
  - ws-3: slug `future-tech`, title `Future of AI`, status `próximamente`, date_live future (+30 days)
  - ws-4: slug `completed`, title `Past Workshop`, status `completado`, date_live past (-7 days)
- Por cada test, helper crea los 4 workshops idempotent
- Acceso initial: seed_user (from auth token) tiene acceso desbloqueado a ws-1 + ws-2 solo
  - Crear `workshop_access` rows: (seed_user, ws-1, access_key='RAG-STARTER', redeemed_at=now())
  - Idem ws-2: access_key='LIVE-2024'
- Resultado esperado: catálogo muestra 2 unlocked (botón "Continuar"), 2 locked (botón "Ingresar")

### RF-8 [2b]: Componente `AccessKeyModal`
Modal para ingresar clave de acceso:
- Estados: idle (form visible) → loading (button disabled, spinner) → error (red text) → success (green checkmark + "¡Acceso concedido!")
- Renderizar solo cuando user clicks "Ingresar" en card bloqueada
- Estructura:
  - Overlay dark (z-300, fixed)
  - Modal content: title ("Ingresar a [Workshop Name]"), hint text, input field, submit button, error/success message
  - Input field: accessibility (htmlFor + id), placeholder, focus styles (cyan glow)
  - Close button / Escape key cierra el modal (excepto en loading)
  - Focus trap dentro del modal (tabindex boundaries)
  - ARIA: role="dialog", aria-labelledby, aria-describedby

### RF-9 [2b]: Server Action `redeemKey(userId, workshopId, accessKey)`
Validar y canjear clave de acceso:
- Input validation (Zod schema): key must match `accessKeySchema`
- Normalization: `accessKey.trim().toUpperCase()`
- Query existing `workshop_access` row:
  - If exists and `redeemed_at IS NOT NULL` → return error "Ya tenés acceso a este taller"
  - If exists and `redeemed_at IS NULL` → check key + expiry → if valid, UPDATE set redeemed_at=now()
  - If not exists → CREATE new row (requires service_role context or pre-existing row from admin INSERT)
- Validation logic:
  - Check key matches stored key (case-insensitive)
  - Check `expires_at > now()` (temporal validity)
  - Return clear error "Clave inválida o expirada" if mismatch or expired
- On success: UPDATE `workshop_access` set `redeemed_at=now()` for this (user, workshop, key)
- Constraint handling: UNIQUE(user_id, workshop_id) means if trying to redeem second key for same workshop → 409 conflict → catch + return "Ya tenés acceso"
- Response: `{ success: true, message: "¡Acceso concedido!" }` or `{ success: false, error: "..." }`

### RF-10 [2b]: Schema Zod `accessKeySchema`
Validación de clave de acceso:
```typescript
const accessKeySchema = z.object({
  key: z.string()
    .min(3, "Clave mínimo 3 caracteres")
    .max(20, "Clave máximo 20 caracteres")
    .regex(/^[A-Z0-9\-]+$/i, "Solo letras, números y guiones")
    .transform(val => val.trim().toUpperCase()),
  workshopId: z.string().uuid("Workshop ID inválido"),
})
```

### RF-11 [2b]: UI wiring — Habilitar botón "Ingresar"
En `WorkshopCard`:
- Para tarjetas bloqueadas (is_unlocked = false): botón "Ingresar" clickeable
- Click → setear estado `isModalOpen=true` + pasar `workshopId` al modal
- Modal abre con titulo interpolado: "Ingresar a [Workshop Title]"
- Tras success: close modal + trigger refetch de `/catalogo` (o useOptimistic refresh)
- Persistent: tras refresh del navegador, tarjeta sigue mostrando "Continuar" (validar con DB)

### RF-12 [2b]: Success feedback tras canje
Tras `redeemKey` success:
- Modal muestra success state (green check + "¡Acceso concedido!")
- Auto-close modal después de 2s (o con botón "Cerrar")
- Actualizar card state: cambiar "Ingresar" a "Continuar"
- Optional: Toast de confirmación (defer to design si no especificado)
- No flash/flicker: usar useOptimistic o re-query determinista

---

## Requisitos no funcionales

### RNF-1: Seguridad — RLS + Validación
- Todas las queries usan RLS: usuarios solo ven workshops (todos) pero solo su propio `workshop_access`
- Validación server-side antes de UPDATE: Zod schema valida input
- Clave almacenada en texto plano (v1 pragmática); refactor a bcrypt en change 5
- Test explícito: Usuario A intenta ver/modificar `workshop_access` de Usuario B → RLS rechaza (0 filas)
- No secrets en logs: clave no aparece en console.log (revisar en sdd-apply)
- Constraint UNIQUE previene duplicate rows; conflict handling claro

### RNF-2: Performance
- Catálogo fetch < 2s TTI en mobile (single LEFT JOIN query, <100 workshops)
- Canje (redeemKey) < 100ms (single row UPDATE)
- No N+1 queries: fetchWorkshops trae workshops + access en una consulta
- No waterfall: modal carga después del render inicial

### RNF-3: Responsive
- Mobile-first, breakpoints: 360 / 768 / 1024 / 1440
- Grid cards: 1 col 360px, 2 col 768px, 3-4 col 1024px+
- No scroll horizontal en 360px
- Modal centrado, responsive en 360px (ancho 90% viewport, max-width 400px)
- Inputs 44px mínimo (touch-friendly)
- Cover images aspect-ratio consistent (16:9 recomendado)

### RNF-4: Accesibilidad
- Contraste AA en texto sobre navy
- Modal ARIA: role="dialog", aria-labelledby, aria-describedby, focus trap
- Button aria-labels para iconos (candado, checkmark)
- Inputs con labels (htmlFor + id)
- Teclado navegable: Tab order lógico, Escape cierra modal, Enter submitea form
- Statusbadge aria-label con estado completo ("Disponible, próximamente en 7 días")

### RNF-5: i18n
- Todos los strings UI en español Rioplatense (voseo)
- Ejemplos:
  - "Ingresar"
  - "Continuar"
  - "Clave inválida o expirada"
  - "¡Acceso concedido!"
  - "Ya tenés acceso a este taller"
  - "Disponible próximamente"
- Hardcodeados en este change (sin archivos i18n aún)

### RNF-6: Tipografía y colores
- Display: Space Grotesk
- Body: Inter
- Fondo: `--navy-900: #03050B`
- Texto primario: `--text-primary: #E8EDF6`
- Accento: `--cyan: #19C6E6` (focus, hover)
- Badge colors (4 estados): cyan / magenta / yellow / lime (detalladas en RF-5)
- Dark mode único (sin light mode)

### RNF-7: Animaciones
- `sdLive` keyframe para badge "en vivo": dot pulsation (2s loop, scale 0.8 → 1.0)
- Modal entrada: `sdRise` (smooth fade-in + translate up 20px)
- Overlay entrada: `sdToast` (fade-in rápido)
- No animation delays que causen flicker

### RNF-8: Restricción de funcionalidad
- Botón "Continuar" (desbloqueado) disabled + tooltip "Disponible próximamente" hasta change 3
- Si usuario intenta ir a `/taller/[slug]` en este change → friendly 404 (defer routing a change 3)

---

## Escenarios de aceptación (Gherkin)

### Escenario 1 [2a]: Catálogo renderiza 4 estados correctamente
```gherkin
Dado que estoy autenticada en "/catalogo"
Y el helper resetWorkshopsAndAccess() ha creado 4 talleres (disponible, en vivo, próximamente, completado)
Cuando veo la página
Entonces veo una grid de 4 tarjetas (una por taller)
Y cada tarjeta muestra: título + descripción + instructor + fecha + imagen
Y cada tarjeta tiene su badge de estado correcto:
  - "RAG Intro" (disponible) → badge cyan, dot static
  - "Embeddings Deep Dive" (en vivo) → badge magenta, dot animado
  - "Future of AI" (próximamente) → badge yellow, dot static
  - "Past Workshop" (completado) → badge lime, dot static
```

### Escenario 2 [2a]: Usuario desbloqueado ve "Continuar", bloqueado ve "Ingresar"
```gherkin
Dado que estoy autenticada y resetWorkshopsAndAccess() me da acceso a RAG Intro + Embeddings
Cuando veo "/catalogo"
Entonces:
  - RAG Intro: botón dice "Continuar" (no candado)
  - Embeddings: botón dice "Continuar" (no candado)
  - Future of AI: botón dice "Ingresar" (CON candado ícono)
  - Past Workshop: botón dice "Ingresar" (CON candado ícono)
```

### Escenario 3 [2a]: RLS — Usuario B no puede ver acceso de Usuario A
```gherkin
Dado que existen 2 usuarios: A (autenticada) y B
Y Usuario A tiene workshop_access para RAG Intro (redeemed_at = now)
Cuando B se autentica
Y B intenta SELECT en workshop_access con su token
Entonces el RLS policy filtra: B solo ve SU propio workshop_access (0 filas para talleres de A)
Y B no puede ejecutar SELECT WHERE user_id = A.id
Y B no puede UPDATE la fila de A
```

### Escenario 4 [2a]: Grid responsivo 360px sin scroll horizontal
```gherkin
Cuando accedo a "/catalogo" en viewport 360px
Entonces:
  - Grid muestra 1 tarjeta por fila (columna única)
  - Cada tarjeta ancho 100% - 32px margin/padding
  - No hay scroll horizontal
  - Título, descripción legibles sin truncamiento excesivo
  - Botón "Ingresar" / "Continuar" ancho mínimo 44px alto (touch-friendly)
```

### Escenario 5 [2a]: Grid responsivo 768px y 1024px
```gherkin
Cuando accedo a "/catalogo" en viewport 768px
Entonces grid muestra 2 tarjetas por fila
Cuando accedo a "/catalogo" en viewport 1024px
Entonces grid muestra 3-4 tarjetas por fila
```

### Escenario 6 [2b]: Modal abre al clickear "Ingresar" en tarjeta bloqueada
```gherkin
Dado que estoy viendo "/catalogo" con Future of AI bloqueado
Cuando hago clic en el botón "Ingresar" de Future of AI
Entonces:
  - Modal aparece con fade-in smooth
  - Modal title: "Ingresar a Future of AI"
  - Veo hint text
  - Veo input field con focus visible (cyan glow)
  - Veo botón "Enviar" en estado idle
  - Focus está en el input
  - Puedo presionar Escape para cerrar modal
```

### Escenario 7 [2b]: Clave inválida muestra error, modal queda abierto
```gherkin
Dado que el modal está abierto para Future of AI
Cuando ingreso una clave inválida como "INVALID-KEY"
Y hago clic en "Enviar"
Entonces:
  - Botón pasa a loading state (spinner, disabled)
  - Server Action redeemKey es llamado
  - Respuesta: { success: false, error: "Clave inválida o expirada" }
  - Modal muestra error en rojo: "Clave inválida o expirada"
  - Modal queda abierto (user puede reintentar)
  - Botón vuelve a idle state
  - Campo input mantiene focus
```

### Escenario 8 [2b]: Clave válida → success → modal cierra → card actualiza
```gherkin
Dado que Future of AI (ws-3) tiene una clave válida "FUTURE-TECH-2024" con expires_at > now
Y el modal está abierto para Future of AI
Cuando ingreso la clave correcta "future-tech-2024" (case-insensitive)
Y hago clic en "Enviar"
Entonces:
  - Botón loading state
  - Server Action ejecuta: UPDATE workshop_access SET redeemed_at=now() WHERE user_id=$1 AND workshop_id=$2
  - Respuesta: { success: true }
  - Modal muestra success state: checkmark verde + "¡Acceso concedido!"
  - Modal auto-cierra después de 2s (o user clickea "Cerrar")
  - Card Future of AI ahora muestra "Continuar" (no "Ingresar")
  - No candado en la tarjeta
```

### Escenario 9 [2b]: Clave expirada rechazada
```gherkin
Dado que una clave tiene expires_at < now (expirada)
Cuando intento canjearla
Entonces:
  - Server Action checks: expires_at > now() → FALSE
  - Respuesta: { success: false, error: "Clave inválida o expirada" }
  - Modal muestra error
```

### Escenario 10 [2b]: Doble canje bloqueado por UNIQUE constraint
```gherkin
Dado que ya tengo acceso a RAG Intro (workshop_access exists con redeemed_at = now)
Y abro el modal para RAG Intro (pero está desbloqueado, así que botón dice "Continuar")
Cuando intento ingresar una clave
Entonces:
  - El botón "Continuar" está disabled (no "Ingresar")
  - No puedo abrir el modal
  - O si la UI lo permite, Server Action retorna: "Ya tenés acceso a este taller"
```

### Escenario 11 [2b]: Persistencia tras refresh
```gherkin
Dado que acabo de canjear exitosamente una clave para Future of AI
Cuando refresco la página (F5)
Entonces:
  - `/catalogo` carga nuevamente
  - Query fetchWorkshops revela: LEFT JOIN trae redeemed_at para Future of AI
  - Card Future of AI sigue mostrando "Continuar" (no "Ingresar")
  - El acceso fue persistido en DB
```

### Escenario 12 [2b]: Normalización case-insensitive
```gherkin
Cuando ingreso clave "FuTuRe-TeChZ2024" (mixed case)
Entonces:
  - Server Action valida: schema.transform(val => val.toUpperCase())
  - Comparación: "FUTURE-TECHZ2024" === stored_key.toUpperCase()
  - Si match, canje exitoso (case-insensitive funcionando)
```

### Escenario 13 [2a]: Badge color y animación correcta por estado
```gherkin
Cuando veo la grid en "/catalogo"
Entonces:
  - Badge "disponible" (RAG Intro): fondo navy, dot cyan (#19C6E6), estático
  - Badge "en vivo" (Embeddings): fondo navy, dot magenta (#D946EF), animación sdLive pulsando
  - Badge "próximamente" (Future Tech): fondo navy, dot yellow (#FACC15), estático
  - Badge "completado" (Past Workshop): fondo navy, dot lime (#A3E635), estático
```

### Escenario 14 [2b]: Modal cierra con Escape
```gherkin
Dado que el modal está abierto
Cuando presiono la tecla Escape
Entonces:
  - Modal cierra smooth (fade-out)
  - Focus vuelve a la tarjeta
  - Ni cambios de acceso ni actualizaciones
```

### Escenario 15 [2a]: Cover image fallback si NULL
```gherkin
Dado que un taller tiene cover_image = NULL
Cuando veo su tarjeta
Entonces:
  - Se muestra un background color/gradient navy como fallback
  - No hay error ni imagen rota
  - Título + descripción siguen legibles
```

---

## Schemas Zod (a implementar en sdd-apply)

### accessKeySchema
```typescript
import { z } from 'zod'

export const accessKeySchema = z.object({
  key: z.string()
    .min(3, "Clave mínimo 3 caracteres")
    .max(20, "Clave máximo 20 caracteres")
    .regex(/^[A-Z0-9\-]+$/i, "Solo letras, números y guiones")
    .transform(val => val.trim().toUpperCase()),
  workshopId: z.string().uuid("Workshop ID inválido"),
})

export type AccessKeyInput = z.infer<typeof accessKeySchema>
```

---

## Cobertura de tests

### Unit Tests (`tests/unit/schemas/workshop.test.ts`)
- [ ] `accessKeySchema` valida clave válida: "FUTURE-2024" → transforms a "FUTURE-2024"
- [ ] `accessKeySchema` rechaza clave muy corta: "AB" → error "mínimo 3"
- [ ] `accessKeySchema` rechaza clave muy larga: "A".repeat(21) → error "máximo 20"
- [ ] `accessKeySchema` rechaza caracteres inválidos: "future@2024!" → error "letras, números, guiones"
- [ ] `accessKeySchema` case-insensitive: "future-2024" → transform a "FUTURE-2024"
- [ ] `accessKeySchema` trimea espacios: "  FUTURE-2024  " → "FUTURE-2024"
- [ ] `accessKeySchema` rechaza workshopId inválido (no UUID) → error

### E2E Tests (`tests/playwright/catalog.spec.ts`)

#### Slice 2a Specs
- [ ] `catalog-load`: Load `/catalogo` → see 4 workshop cards with correct titles
- [ ] `catalog-badges-render`: Each badge shows correct color + state (disponible/en vivo/próximamente/completado)
- [ ] `catalog-unlock-state`: 2 cards show "Continuar", 2 show "Ingresar" + lock icon
- [ ] `catalog-responsive-360`: Grid renders 1 column in 360px, no horizontal scroll
- [ ] `catalog-responsive-768`: Grid renders 2 columns in 768px
- [ ] `catalog-responsive-1024`: Grid renders 3-4 columns in 1024px+
- [ ] `rls-isolation-user-b-cannot-see-user-a-access`: Create session for User B, query workshop_access → 0 rows (RLS blocks)
- [ ] `cover-image-fallback`: Taller sin cover_image renders fallback color, no broken image
- [ ] `sdlive-animation`: Badge "en vivo" dot animates (pulse 2s loop)

#### Slice 2b Specs
- [ ] `modal-open`: Click "Ingresar" on locked workshop → modal appears with correct title
- [ ] `modal-close-escape`: Press Escape → modal closes, focus returns to card
- [ ] `modal-close-button`: Click close button → modal closes
- [ ] `redeem-invalid-key`: Enter "INVALID-KEY" → error "Clave inválida o expirada" → modal open
- [ ] `redeem-valid-key`: Enter valid key "FUTURE-TECH-2024" → success state → modal closes after 2s
- [ ] `card-updates-after-redeem`: After success, card shows "Continuar" not "Ingresar"
- [ ] `redeem-persistence-refresh`: Redeem key, refresh page → card still shows "Continuar"
- [ ] `redeem-expired-key`: Expired key → error "Clave inválida o expirada"
- [ ] `redeem-case-insensitive`: Key "future-tech-2024" (lower) matches stored "FUTURE-TECH-2024" (upper) → success
- [ ] `already-unlocked-no-modal`: Card already showing "Continuar" → click does nothing (or inform "Ya tenés acceso")
- [ ] `double-redeem-blocked`: Try redeem 2nd key for same workshop → UNIQUE constraint → "Ya tenés acceso"
- [ ] `modal-loading-state`: While redeeming, button shows spinner, disabled, input disabled
- [ ] `modal-success-feedback`: Success state shows green checkmark + "¡Acceso concedido!"

### Test Fixtures (Seed Data)
```typescript
// In tests/helpers/supabase-admin.ts
export async function resetWorkshopsAndAccess() {
  const admin = createAdminClient()
  const seedUser = await getSeedUser() // from env

  // Delete all data (idempotent)
  await admin.from('workshop_access').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await admin.from('workshops').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  // Create 4 seed workshops
  const workshops = [
    {
      slug: 'rag-intro',
      title: 'RAG Intro',
      description: 'Introduction to RAG systems',
      instructor: 'Dr. AI',
      status: 'disponible',
      date_live: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 days
      cover_image: null,
    },
    {
      slug: 'embeddings',
      title: 'Embeddings Deep Dive',
      description: 'Advanced embeddings techniques',
      instructor: 'Dr. AI',
      status: 'en vivo',
      date_live: new Date(), // now
      cover_image: null,
    },
    {
      slug: 'future-tech',
      title: 'Future of AI',
      description: 'Speculation and trends',
      instructor: 'Dr. AI',
      status: 'próximamente',
      date_live: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
      cover_image: null,
    },
    {
      slug: 'completed',
      title: 'Past Workshop',
      description: 'Already happened',
      instructor: 'Dr. AI',
      status: 'completado',
      date_live: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // -7 days
      cover_image: null,
    },
  ]

  const { data: inserted } = await admin.from('workshops').insert(workshops).select()
  const wsIds = inserted.map(ws => ws.id)

  // Create workshop_access for seed user: 2 unlocked, 2 locked
  await admin.from('workshop_access').insert([
    {
      user_id: seedUser.id,
      workshop_id: wsIds[0], // RAG Intro
      access_key: 'RAG-STARTER',
      redeemed_at: new Date(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    {
      user_id: seedUser.id,
      workshop_id: wsIds[1], // Embeddings
      access_key: 'LIVE-2024',
      redeemed_at: new Date(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    // Future of AI: no access (locked)
    // Completed: no access (locked)
  ])

  return { workshops: inserted, wsIds }
}
```

---

## Estructura de archivos a implementar

### Migrations (SQL)
- `supabase/migrations/{timestamp}_create_workshops_table.sql` (~40 líneas)
- `supabase/migrations/{timestamp}_create_workshop_access_table.sql` (~50 líneas)

### Componentes React
- `src/components/catalog/WorkshopCard.tsx` (~60 líneas) [2a]
- `src/components/catalog/StatusBadge.tsx` (~30 líneas) [2a]
- `src/components/catalog/AccessKeyModal.tsx` (~80 líneas) [2b]

### Pages + Actions
- `src/app/(authenticated)/catalogo/page.tsx` (~40 líneas) [2a]
- `src/app/(authenticated)/catalogo/actions.ts` (~60 líneas, fetchWorkshops + redeemKey) [2a+2b]

### Schemas + Validation
- `src/lib/schemas/workshop.ts` (~30 líneas, accessKeySchema) [2b]

### Tests
- `tests/playwright/catalog.spec.ts` (~250 líneas, e2e specs) [2a+2b]
- `tests/unit/schemas/workshop.test.ts` (~50 líneas, unit tests) [2b]
- `tests/helpers/supabase-admin.ts` (extend ~60 líneas, add resetWorkshopsAndAccess) [2a]

### Styling
- `src/app/globals.css` (add @keyframes sdLive ~10 líneas) [2a]

---

## Dependencias y blockers externos

Estas tareas DEBEN completarse ANTES de que `sdd-apply` comience:

1. **Jennifer: Crear migrations SQL**
   - `create_workshops_table.sql`: tabla + índices + RLS policies (~40 líneas)
   - `create_workshop_access_table.sql`: tabla + FK + RLS policies (~50 líneas)
   - Ejecutar: `npx supabase migration up`

2. **Jennifer: Seed workshops en DB**
   - Insertar 4 workshops via SQL (fixtures exactas del spec)
   - Store UUIDs para test fixtures

3. **Jennifer: Seed access keys (opcional para tests)**
   - Insertar 2 workshop_access rows (unlocked state para seed_user)
   - Access keys: 'RAG-STARTER', 'LIVE-2024'

---

## Decisiones abiertas para Design Phase

1. **Cover image fallback**: Si `cover_image IS NULL`, ¿qué visual? Gradient, solid color, icon?
   - Defer a design: designer proporciona CSS/componente fallback

2. **Card layout mobile**: ¿1 o 2 columnas en 375px mobile?
   - Spec asume 1 columna; confirm breakpoints en design

3. **Button "Continuar" behavior**: ¿Link a `/taller/[slug]`?
   - Deferred to change 3. Este change: button disabled + tooltip "Disponible próximamente"

4. **Status badge styling**: ¿Exact size, padding, font?
   - Spec define colors + animation; design refina dimensions + typography

5. **Filter/sort by status**: ¿Dropdown en 2a o deferred?
   - Spec asume grid sin filter (todos visibles). Defer o agregar si time allows.

6. **Success feedback**: ¿Toast visible además de modal success state?
   - Spec: modal success es suficiente. Design puede agregar toast si needed.

---

## Risks & Mitigations

### Risk 1: RLS Misconfiguration (Medium)
- **Desc**: WorkshopAccess SELECT/UPDATE policies too permissive → users see other users' keys
- **Mitigation**: Explicit RLS test in e2e: create User B, verify 0 rows for User A's access

### Risk 2: Double-Redeem Race Condition (Low)
- **Desc**: Two simultaneous requests try to redeem key for same (user, workshop) → both attempt UPDATE
- **Mitigation**: UNIQUE constraint creates 409 conflict on second. Server Action catches, returns "Ya tenés acceso"

### Risk 3: Expiry Clock Skew (Low)
- **Desc**: Server clock differs from Supabase → `expires_at > now()` fails unexpectedly
- **Mitigation**: Use DB server time in SQL checks; accept 5-min skew client-side

### Risk 4: Test Fixture Isolation (Low)
- **Desc**: resetWorkshopsAndAccess() not idempotent; tests interfere if helper fails mid-run
- **Mitigation**: Helper is fully idempotent: delete + recreate every test

### Risk 5: Modal state loss on error (Low)
- **Desc**: Network error during redeem → modal hangs in loading state
- **Mitigation**: Timeout + clear error message + retry button in error state

---

## Métricas & Verificación

### Líneas de código (estimate)
- Migrations: ~90 líneas
- Componentes: ~170 líneas (WorkshopCard + StatusBadge + AccessKeyModal)
- Page + actions: ~100 líneas
- Schemas: ~30 líneas
- Tests: ~300 líneas
- Styling: ~10 líneas
- **Total funcional:** ~700 líneas

### Cobertura de tests
- Unit: 7 specs para `accessKeySchema`
- E2E: 22 specs (9 para 2a, 13 para 2b)
- RLS validation: 1 spec explícito (User B aislado)
- **Gate:** `pnpm test:e2e` MUST pass antes de merge

### Performance target
- Catálogo TTI < 2s mobile
- Redeem action < 100ms

---

## Architecture Continuity

### Heredado de Change 1 (auth-and-shell)
- Server Actions pattern (co-located en `/actions.ts`)
- Zod schemas en `src/lib/schemas/`
- RLS for table-level auth
- React 19 + useActionState hook
- Playwright e2e setup
- Dark mode único
- Español Rioplatense

### Establece para Changes 3+
- Workshop model foundational para Sections, Exercises, Progress
- Access model user-Workshop link (extends a Section-level en change 3)
- Seed pattern `resetWorkshopsAndAccess()` reutilizable
- Key redemption UX modal pattern (reutilizable)

---

## Conclusión

Change 2 (catalog-and-access) es la entry point visual post-login del alumno. Establece tablas `workshops` + `workshop_access` con RLS, UI grid responsivo con 4 status badges, y flujo de canje de claves via modal. Entregado en dos slices (2a: read-only catalog, 2b: modal + redemption), respetando 400-line budget. Todos los requisitos están validados por tests e2e + RLS tests explícitos. Listo para design + apply.
