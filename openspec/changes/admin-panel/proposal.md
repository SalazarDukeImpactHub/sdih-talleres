# Proposal: admin-panel (Change 5 of 8)

**Change ID:** `admin-panel`  
**Position:** 5 of 8 (SDIH Talleres v1)  
**Status:** Draft  
**Date:** 2026-06-16

---

## Intent

Implementar el panel administrativo para que Jennifer pueda gestionar talleres (CRUD), crear alumnos, generar claves de acceso, y monitorear progreso de estudiantes. Este change completa la infraestructura de gestión de contenido requerida en brief §7.4 y §9.1, permitiendo que Jennifer cree un taller nuevo en <30min (brief §11) y genere una clave en <1min.

**Success Criteria:** Jennifer accede al panel admin con role=admin → crea un taller nuevo (título, descripción, ejercicios en JSON) → sube portada → genera una clave de acceso para un alumno → el alumno recibe credenciales temporales → ingresa, cambia password, desbloquea el taller con la clave y accede al contenido. Todo integrado de punta a punta sin salir del sistema.

---

## Scope: In and Out

### In Scope — Change 5

**Data Model:**
- Nuevas columnas en `workshop_access`: `access_key_hash` (SHA-256), `access_key_salt` (UUID)
- Migración para hashear claves existentes (plaintext → hash + salt)
- Extensión de `public.users` si es necesario (crear alumnos sin email en invitación)

**Auth & Security:**
- Guard servidor en `/admin/*` layout (server-side role check: role==='admin')
- Server Actions con `service_role` client para todas las operaciones de admin
- Cada Server Action valida `getCurrentUser()` y verifica role==='admin' ANTES de tocar la DB
- No nuevas RLS policies; validación por Server Action es el patrón establecido (changes 1-4)

**Admin Panel UI / Components:**
- Shell admin: `/admin` layout base con navegación
- Lista de talleres: `/admin/talleres` — tabla filtrable por estado (disponible, en vivo, próximamente, completado)
- Crear/editar taller: `/admin/talleres/new` y `/admin/talleres/[id]` — form con:
  - Campos: título, descripción, instructor, fecha, duración, requerimientos previos, estado
  - Upload de portada (jpg/png/webp, max 5MB) → Supabase Storage bucket `workshops`
  - Carga de contenido: secciones (JSON) + ejercicios (JSON) + glosario (JSON) con validación Zod
  - Validación server-side de content_json schema antes de guardar
- Lista de alumnos por taller: `/admin/talleres/[id]/alumnos` — tabla con:
  - Email, nombre, % progreso (reusando `getExerciseAwareProgress` del change 4)
  - Botón "Nuevo alumno" → form con email + password temporal → crea user + WorkshopAccess con clave
- Tabla de claves generadas: `/admin/claves` (o `/admin/talleres/[id]/claves`)
  - Columns: alumno, taller, clave (hasheada, mostrar últimos 4 chars), estado (pendiente/canjeada/expirada), fecha
  - Acción regenerar clave (si no canjeada todavía)
- Componentes nuevos en `src/components/admin/`

**Hash Migration (Slice 5d):**
- Algoritmo: SHA-256 via `crypto.createHash()` (Node.js builtin, sin dependencias nuevas)
- Format: `access_key_hash TEXT`, `access_key_salt UUID`
- Migración: Leer access_key plaintext existentes → generar salt (crypto.randomUUID()) → hash (SHA256(salt + key)) → escribir hash+salt
- Backfill de claves existentes (de changes 2-4) en la migración
- Compatibilidad hacia atrás: no dropear `access_key` todavía (drop es polish post-v1)

**Refactor de redeemKey (Change 2 Archivado):**
- Archivo: `src/app/(authenticated)/catalogo/actions.ts` lines 162-170 (approx)
- Cambio: Comparar SHA-256(salt + input) === hash, en vez de plaintext ===
- Fixture: Tests deben cubrir claves hasheadas (usar factory con salt+hash precalculados)

**Supabase Storage:**
- Bucket `workshops` con RLS
- Policy: authenticated users can SELECT (CDN, descargas públicas)
- Policy: admin (role=admin) can INSERT/UPDATE (validado en Server Action auth guard)
- Path pattern: `{workshopId}/cover.{ext}` (jpg/png/webp)
- Signed URL para descargas si hace falta; presigned upload URLs si el form lo necesita

**Testing:**
- e2e specs (happy path + seguridad crítica):
  - Admin login → access `/admin/talleres`
  - Admin crea taller nuevo + sube portada + carga ejercicios → taller visible en lista
  - Admin genera clave para alumno → clave hasheada se guarda
  - Alumno recibe credenciales + accesa taller con clave
  - Security: alumno sin rol=admin redirige a `/catalogo` si intenta `/admin`
  - Security: RLS de Storage permite SELECT público, INSERT solo admin
  - Verify: redeemKey() funciona con claves hasheadas (test 409 si key inválida)
- Unit tests: Zod schema para content_json (sections/exercises/glossary)
- No especificar exhaustivamente cada campo UI (dejar para design); focus en happy path + seguridad

**Constraints & Decisions:**
- Crear alumnos desde admin: SÍ entra (form email + password temporal)
  - Crea user en auth.users (via admin API con service_role)
  - Crea fila en public.users con password_changed=false
  - Genera clave de acceso + la asigna en workshop_access
  - NO enviar email (change 6 lo hace)
- Content JSON schema: definido en `src/lib/schemas/workshop.ts` (Zod)
  - Sections: array de {type, title, content_json}
  - Exercises: array de {title, objective, prompt_text, order}
  - Glossary: array de {term, definition, category}
  - Validación: Zod rechaza JSON inválido, Server Action retorna error claro
- Storage bucket RLS: no nuevas policies complejas; patrones de storage.from().upload() + auth guard en Server Action
- Claves generadas: no exposición en el cliente de la clave plaintext (mostrar solo últimos 4 caracteres)

### Out of Scope — Deferred to Future Changes

- **Emails transaccionales** (credenciales, clave, recordatorio) → Change 6 (transactional-emails)
- **Integración de pagos** → Fuera de v1 (manual vía WhatsApp + Bre-B/Bold)
- **Reporte detallado de progreso** (gráficos, timeline) → Change 5+ o v1.1
- **Bulk import de alumnos** → Deferred; single form por ahora
- **Drop de columna access_key plaintext** → Polish post-v1 (backward-compat)
- **Cron/scheduler para expiry cleanup** → Change 5+ o v1.1
- **Audit log de cambios admin** → v1.1
- **Two-factor auth para admin** → v1.1

---

## Technical Approach

### Guard Pattern (Server-Side Role Check)

**Rationale:** change 1-4 establece patrón de Server Actions con service_role + validación de role en Node.js. Admin-panel extiende esto.

**Implementation:**
1. Layout `(admin)/layout.tsx` es Server Component
2. Antes de renderizar children, llama `getCurrentUser()`
3. Si no autenticado → redirect a `/login`
4. Si autenticado pero role !== 'admin' → redirect a `/catalogo`
5. Si role === 'admin' → renderiza children normalmente
6. Cada Server Action adentro de `/admin` también verifica role === 'admin' antes de ejecutar DB writes

**No nuevas RLS policies.** La validación de role en Node.js es más expresiva y testeable que RLS. Este patrón fue aprobado en el explore como Pattern A.

### Storage Upload Pattern

**Rationale:** Supabase Storage tiene su propio modelo de RLS (no es Postgres RLS).

**Implementation:**
1. Form `/admin/talleres/[id]` tiene input type=file para cover image
2. Server Action `uploadCover(workshopId, formData)`:
   - Valida role === 'admin'
   - Valida mimetype (jpg/png/webp), size (<5MB)
   - Genera path `{workshopId}/cover.{ext}`
   - Llama `supabase.storage.from('workshops').upload(path, file, {upsert: true})`
   - Retorna público URL (CDN via Supabase)
3. RLS bucket policy `SELECT *` para all, `INSERT/UPDATE/DELETE` para role='service_role' (validado en Server Action)

### Hash Migration Strategy

**Rationale:** Change 2 dejó access_key en plaintext. Cambio 5 introduce hash sin breaking backward-compat.

**Implementation:**
1. Nueva migración (slice 5d) agrega columnas `access_key_hash`, `access_key_salt`
2. Migración backfill: 
   ```sql
   UPDATE workshop_access 
   SET access_key_salt = gen_random_uuid(),
       access_key_hash = encode(sha256(gen_random_uuid()::text || access_key), 'hex')
   WHERE access_key_hash IS NULL;
   ```
   (Postgres `sha256()` function must be installed; if not, backfill en Node.js)
3. NO dropear `access_key` en este change (backward-compat)
4. Refactor `redeemKey()` en `catalogo/actions.ts` (línea 162):
   - Leer `access_key_hash` y `access_key_salt`
   - Comparar `sha256(salt + input) === hash`
   - Si no existe hash (claves viejas), fallback a plaintext comparison con warning
5. Tests: fixture con salt+hash precalculados, verificar redeemKey con claves hasheadas

### Content JSON Schema

**Rationale:** Secciones y ejercicios se cargan como JSON en una única columna `content_json` (change 3 define esto).

**Implementation:**
1. Zod schema en `src/lib/schemas/workshop.ts`:
   ```ts
   const workshopContentSchema = z.object({
     sections: z.array(z.object({
       type: z.enum(['inicio', 'aprendizaje', 'taller', 'instalacion', 'glosario']),
       title: z.string(),
       content_json: z.string() // puede ser HTML, markdown, plain text
     })),
     exercises: z.array(z.object({
       title: z.string(),
       objective: z.string(),
       prompt_text: z.string(),
       order: z.number()
     })),
     glossary: z.array(z.object({
       term: z.string(),
       definition: z.string(),
       category: z.string().optional()
     }))
   });
   ```
2. Server Action `createWorkshop()` o `updateWorkshop()` llama `workshopContentSchema.parse(json)` antes de insertar
3. Si Zod rechaza, retorna error claro al usuario ("Secciones inválidas: ...")
4. Form en UI puede ser textarea + preview, o JSON editor component (dejar para design)

### Component Reusability

**Rationale:** Change 4 definió `getExerciseAwareProgress()` para calcular % progreso. Change 5 lo reutiliza.

**Implementation:**
1. Import `getExerciseAwareProgress` desde `src/lib/db-helpers.ts` (change 4)
2. En `/admin/talleres/[id]/alumnos`, para cada fila de alumno, llamar `getExerciseAwareProgress(userId, workshopId)`
3. Render % en columna "Progreso"
4. No duplicar lógica; no redefinir en admin

---

## Data Model

### New Columns on workshop_access Table

```sql
ALTER TABLE public.workshop_access ADD COLUMN access_key_hash TEXT;
ALTER TABLE public.workshop_access ADD COLUMN access_key_salt UUID;

-- Backfill existing plaintext keys with hash
UPDATE public.workshop_access 
SET 
  access_key_salt = gen_random_uuid(),
  access_key_hash = encode(sha256(gen_random_uuid()::text || access_key), 'hex')
WHERE access_key_hash IS NULL;

-- Future: ALTER TABLE public.workshop_access DROP COLUMN access_key (in polish phase)
```

### Supabase Storage RLS

```sql
-- Bucket: workshops
-- Policy: allow SELECT for all (public CDN)
CREATE POLICY "storage_select_covers_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'workshops');

-- Policy: allow INSERT/UPDATE for service_role only (validated in Server Action)
CREATE POLICY "storage_admin_covers" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'workshops' AND auth.role() = 'service_role')
  FOR UPDATE USING (bucket_id = 'workshops' AND auth.role() = 'service_role');
```

### No New Tables

- Users y workshops ya existen (changes 1 + 2)
- WorkshopAccess ya existe; solo se agregan columnas
- Content se almacena en workshop.content_json (change 3)
- Exercises y ExerciseProgress existen (change 4)

---

## Slice Architecture: 5a, 5b, 5c, 5d

Change 5 es sustancial (>800 líneas totales). Dividido en **4 chained PRs** para respetar el presupuesto de ~400 líneas/PR y permitir feedback iterativo.

### Slice 5a: Admin Shell + Workshop List

**Scope:**
- Layout `(admin)/layout.tsx` server-side con guard role==='admin'
- Página `/admin/talleres` — tabla con lista de todos los talleres
- Filtros por estado (dropdown o tabs)
- Botones: "Nuevo taller" (link a /admin/talleres/new), "Editar", "Ver"
- Server Action `fetchWorkshops()` para leer lista
- Componentes: `AdminLayout`, `WorkshopTable`, `WorkshopFilter`
- Tests e2e: access `/admin/talleres`, ver lista con filtros, verificar guard redirige no-admin

**Estimated lines:** ~400 LOC
- Layout + guard: 50 líneas
- Page + Server Actions: 60 líneas
- Components (Table, Filter): 150 líneas
- Styling: 40 líneas
- Tests e2e (happy path + security): 100 líneas

**Deliverable:** Jennifer login admin → navegador a `/admin/talleres` → ve tabla de todos los talleres con filtro por estado → puede navegar "Nuevo taller" (deferred to 5b)

**Verify gate:** Build + vitest + pnpm test:e2e

**Branch:** `change/admin-panel-5a`

### Slice 5b: Workshop CRUD + Cover Upload

**Scope:**
- Página `/admin/talleres/new` y `/admin/talleres/[id]` — form crear/editar taller
- Fields: título, descripción, instructor, fecha_live, duración, requerimientos, estado, cover image
- Upload de portada: input file → Server Action `uploadCover(workshopId, formData)`
  - Validación mimetype (jpg/png/webp), size (<5MB)
  - Sube a Supabase Storage path `{workshopId}/cover.{ext}`
  - Retorna URL publica
- Server Actions: `createWorkshop()`, `updateWorkshop()`, `deleteWorkshop()` (todas con role check)
- Componentes: `WorkshopForm`, `CoverUpload`, `FileInput`
- Tests e2e: crear taller nuevo, cargar portada, editar taller, validar errores
- Carga de content_json deferida a 5c

**Estimated lines:** ~480 LOC
- Form component + validation: 200 líneas
- Upload logic + Server Actions: 150 líneas
- Styling + error handling: 80 líneas
- Tests e2e (CRUD + upload): 50 líneas

**Deliverable:** Jennifer en `/admin/talleres/new` → llena form → sube portada → taller se crea → redirects a lista → ve nuevo taller en tabla

**Verify gate:** Build + vitest + pnpm test:e2e

**Branch:** `change/admin-panel-5b` (depends on 5a)

### Slice 5c: Student List + Create Student + Key Generation

**Scope:**
- Página `/admin/talleres/[id]/alumnos` — tabla de alumnos con progreso
- Columns: email, nombre, % progreso (via `getExerciseAwareProgress`), acciones (editar, eliminar)
- Botón "Nuevo alumno" → modal/form con email + password temporal
  - Server Action `createStudent(workshopId, email, passwordTemp)`:
    - Crea user en auth.users (admin API con service_role)
    - Crea fila en public.users (role='alumno', password_changed=false)
    - Genera clave de acceso único → crea fila en workshop_access
    - Retorna clave al form (últimos 4 chars para mostrar)
- Tabla de claves por taller: `/admin/talleres/[id]/claves` o embedded en [id]/alumnos
  - Columns: alumno, clave (últimos 4 chars), estado (pendiente/canjeada), fecha generada
  - Acción "Regenerar" si no canjeada
- Componentes: `StudentList`, `CreateStudentModal`, `KeyTable`
- Helpers reutilizados: `getExerciseAwareProgress` (change 4)
- Tests e2e: crear alumno, verificar que clave se genera, alumno puede canjear, seguridad (no otro admin ve claves de otro taller)

**Estimated lines:** ~420 LOC
- StudentList component: 100 líneas
- CreateStudentModal + form: 120 líneas
- Key generation + Server Actions: 100 líneas
- Tests e2e (create, redeem, security): 100 líneas

**Deliverable:** Jennifer en `/admin/talleres/[id]/alumnos` → clickea "Nuevo alumno" → entra email + password → clave generada → tabla muestra alumno + clave + estado

**Verify gate:** Build + vitest + pnpm test:e2e

**Branch:** `change/admin-panel-5c` (depends on 5b)

### Slice 5d: Hash Migration + redeemKey Refactor

**Scope:**
- Migración SQL: agregar columnas `access_key_hash`, `access_key_salt` a workshop_access
- Backfill: hashear todas las claves plaintext existentes (changes 2-4)
- Refactor de `redeemKey()` en `src/app/(authenticated)/catalogo/actions.ts` (change 2 archivado):
  - Comparar SHA-256(salt + input) === hash en vez de plaintext ===
  - Fallback para claves sin hash (backward-compat)
- Test fixtures: generar claves hasheadas para e2e (precalcular salt+hash)
- Tests: verifica que redeemKey() funciona con claves hasheadas, fixture cubre ambos casos (plano + hash)
- Validar que 4 specs críticas de seguridad pasan (hash verificación, RLS, Storage RLS)

**Estimated lines:** ~220 LOC
- Migración SQL: 40 líneas
- Hash utility function (Node.js crypto wrapper): 30 líneas
- redeemKey() refactor: 40 líneas
- Test updates + fixture: 110 líneas

**Deliverable:** Todas las claves existentes tienen hash+salt → redeemKey() compara hash → alumno puede canjear claves generadas en 5c

**Verify gate:** Build + vitest + pnpm test:e2e (suite debe pasar ~50min, nuevas specs para admin no inflado exhaustivamente)

**Branch:** `change/admin-panel-5d` (depends on 5c)

**Dependencies:** 5d refactors código de change 2 archivado (catalogo/actions.ts). Debe estar mergeado a master ANTES de crear 5d PR, sino hay conflicto de merge.

---

## Routes and Components Affected

### Pages
- `src/app/(admin)/layout.tsx` — NEW, guard + nav (50 líneas)
- `src/app/(admin)/talleres/page.tsx` — NEW, list view (60 líneas)
- `src/app/(admin)/talleres/new/page.tsx` — NEW, create form (40 líneas)
- `src/app/(admin)/talleres/[id]/page.tsx` — NEW, edit form (50 líneas)
- `src/app/(admin)/talleres/[id]/alumnos/page.tsx` — NEW, student list (60 líneas)
- `src/app/(admin)/claves/page.tsx` — NEW (optional), keys table (o embed en [id]/alumnos)

### Server Actions
- `src/app/(admin)/talleres/actions.ts` — NEW with fetchWorkshops, createWorkshop, updateWorkshop, deleteWorkshop, uploadCover (150 líneas)
- `src/app/(admin)/talleres/[id]/alumnos/actions.ts` — NEW with createStudent, generateKey (100 líneas)
- `src/app/(authenticated)/catalogo/actions.ts` — REFACTOR line ~162, redeemKey() to use hash comparison

### Components
- `src/components/admin/AdminLayout.tsx` — nav shell (40 líneas)
- `src/components/admin/WorkshopTable.tsx` — list grid/table (80 líneas)
- `src/components/admin/WorkshopForm.tsx` — create/edit form (120 líneas)
- `src/components/admin/CoverUpload.tsx` — file input + upload logic (60 líneas)
- `src/components/admin/StudentList.tsx` — student table (80 líneas)
- `src/components/admin/CreateStudentModal.tsx` — form modal (80 líneas)
- `src/components/admin/KeyTable.tsx` — keys list (60 líneas)

### Schemas
- `src/lib/schemas/workshop.ts` — EXTEND with workshopContentSchema, createWorkshopSchema (80 líneas)
- `src/lib/schemas/user.ts` — EXTEND if needed for createStudent validation (30 líneas)

### Utilities
- `src/lib/crypto.ts` — NEW, sha256Hash(salt, input) function (30 líneas)

### Tests
- `tests/playwright/admin.spec.ts` — NEW, e2e for guard + list + CRUD + upload + student creation (200 líneas)
- `tests/playwright/admin-security.spec.ts` — NEW, e2e for RLS + hash verification (100 líneas)
- `tests/helpers/admin.ts` — NEW, seed admin user + utilities (40 líneas)
- `tests/helpers/supabase-admin.ts` — EXTEND with seedStudents, precalculateKeyHash (50 líneas)

### Styling
- `src/app/globals.css` — minor tweaks if needed for admin table styling (20 líneas)

---

## Acceptance Criteria by Slice

### Slice 5a Acceptance (Admin Shell + List)

1. [x] Layout `(admin)` existe y tiene guard role==='admin' en server
2. [x] No-admin redirect a `/catalogo` cuando intenta `/admin`
3. [x] Admin puede acceder `/admin/talleres` y ver tabla con lista de talleres
4. [x] Tabla muestra: ID, título, estado, fecha_live, acciones (Editar, Ver)
5. [x] Filtro por estado (disponible, en vivo, próximamente, completado) funciona
6. [x] Botón "Nuevo taller" visible (link a `/admin/talleres/new`, deferred implementation)
7. [x] Server Action `fetchWorkshops()` retorna todos los talleres (sin filtro por admin, todos ven todos)
8. [x] e2e: Admin login → navigate `/admin/talleres` → ver lista
9. [x] e2e: No-admin (alumno) intenta `/admin` → redirige a `/catalogo`

### Slice 5b Acceptance (Workshop CRUD + Upload)

1. [x] Form `/admin/talleres/new` carga y muestra campos: título, descripción, instructor, fecha, duración, requerimientos, estado, cover
2. [x] Input file para cover muestra validación (jpg/png/webp, <5MB)
3. [x] Upload Server Action `uploadCover()` sube a Storage y retorna URL pública
4. [x] Cover aparece en preview o tabla tras upload
5. [x] Form submit crea taller en DB (Server Action `createWorkshop()` con role check)
6. [x] Taller nuevo aparece en `/admin/talleres` lista
7. [x] Edit form `/admin/talleres/[id]` pre-carga datos existentes
8. [x] Edit submit actualiza taller (Server Action `updateWorkshop()` con role check)
9. [x] Delete action elimina taller (Server Action `deleteWorkshop()` con role check)
10. [x] e2e: Create new workshop with cover → appears in list
11. [x] e2e: Edit workshop → changes persist
12. [x] Validación: campos requeridos, formato fecha, tamaño archivo

### Slice 5c Acceptance (Student List + Creation + Keys)

1. [x] Página `/admin/talleres/[id]/alumnos` carga y muestra tabla de alumnos para ese taller
2. [x] Tabla columns: email, nombre, % progreso (via `getExerciseAwareProgress`)
3. [x] % progreso calcula correctamente (visitadas + done)/(5 + total_exercises)
4. [x] Botón "Nuevo alumno" abre modal/form con email + password temporal
5. [x] Submit form crea user en auth.users (role='alumno', password_changed=false)
6. [x] Crea fila en public.users (name, email, role)
7. [x] Genera clave única + crea workshop_access
8. [x] Clave retorna a form; UI muestra últimos 4 caracteres (no plaintext completo)
9. [x] Tabla de claves (embed o `/admin/claves`) muestra: alumno, taller, clave (últimos 4), estado (pendiente/canjeada), fecha
10. [x] Alumno recibe credenciales temporales (email + password) — NO enviar email aquí (change 6)
11. [x] Alumno puede canjear clave en `/catalogo` modal (redeemKey() funciona)
12. [x] e2e: Admin crea alumno → tabla actualiza → alumno puede canjear clave

### Slice 5d Acceptance (Hash Migration + redeemKey Refactor)

1. [x] Migración agrega `access_key_hash`, `access_key_salt` columnas a workshop_access
2. [x] Backfill: todas las claves plaintext existentes reciben hash+salt
3. [x] `redeemKey()` en catalogo/actions.ts compara SHA-256(salt + input) === hash
4. [x] Alumno puede canjear claves generadas en 5c (hasheadas)
5. [x] Test fixture cubre ambos: claves planas (cambios 2-4) + hasheadas (5c+)
6. [x] No dropear `access_key` todavía (backward-compat)
7. [x] Fallback: si access_key_hash IS NULL, comparar plaintext con warning (legacy support)
8. [x] 4 specs críticas de seguridad: hash verify, RLS, Storage RLS, guard admin
9. [x] Suite e2e sigue ~50min (no excede budget previsto)

---

## Design Decisions & Rationale

### 1. Server-Side Role Check (Not RLS)

**Decision:** Guard en Server Component + Server Action role validation. No nuevas RLS policies para admin.

**Rationale:**
- Pattern A (explore) es más simple y testeable que RLS
- Changes 1-4 validaron el patrón exitosamente
- RLS for admin es over-engineered; getCurrentUser() en Node.js es más legible
- Trade-off: si role() en la sesión Supabase se falsifica, hay riesgo; mitigado por que Supabase Auth tokens no son user-writable

### 2. Hash Algorithm: SHA-256 (Not Bcrypt)

**Decision:** SHA-256 via Node.js crypto.createHash() (builtin, sin dependencias nuevas).

**Rationale:**
- access_key es generada por sistema (no user-chosen password) → no necesita iteration cost de bcrypt
- SHA-256 con salt es suficiente para claves de un solo uso (expiry + RLS limitan ataques)
- Faster hashing: canje de claves debe ser <100ms
- Sin dependencias: uso de Node.js crypto (estándar)
- Refactor a bcrypt en v1.1 si se decide pasar a passwords; change 5 sienta la base

### 3. Backward-Compat: Keep access_key Column

**Decision:** Agregar hash+salt, pero NO dropear access_key plaintext en este change.

**Rationale:**
- Si algo falla mid-change, podemos revertir sin perder datos
- redeemKey() puede fallback a plaintext si hash no existe
- Drop del plano es deferred a polish (post-v1 cleanup)
- Test fixture precalcula salt+hash para nuevas claves; legacy claves fallback a plano

### 4. Create Students from Admin (Include in Scope)

**Decision:** Form "Nuevo alumno" en `/admin/talleres/[id]/alumnos` crea user + clave.

**Rationale:**
- Brief §7.1 §7.4 dicen Jennifer crea alumnos manualmente
- Automático desde el panel (vs. manual SQL) ahorra 5+ min por alumno
- Brief §11 criterion: "generar clave en <1min" → crear alumno + clave debe ser <1min total
- Email NO se envía aquí; change 6 lo hace (transactional-emails)
- Password temporaria se muestra al admin (no guardada; alumno la cambia en primer login)

### 5. Content JSON Schema (Zod Validation Server-Side)

**Decision:** content_json es un JSON TEXT field; validar schema via Zod antes de guardar.

**Rationale:**
- Change 3 establece content_json pattern
- Admin debe poder cargar ejercicios + secciones + glosario desde JSON (o UI que genera JSON)
- Zod schema previene garbage data en DB
- Error claro al admin si JSON es inválido
- Format: puede ser UI form que serializa a JSON, o textarea + parse

### 6. Storage RLS (Bucket-Level, Not Row-Level)

**Decision:** Bucket `workshops` tiene policy SELECT * (público) y INSERT/UPDATE restringuido a service_role.

**Rationale:**
- Portadas son assets públicos (CDN, lectura abierta)
- Write está guardado por Server Action auth guard (role check en Node.js)
- Supabase Storage RLS es bucket-level + path-prefix; no tanto row-granular como Postgres
- Pattern: Upload validado en Server Action → almacenado en Storage → público para lectura

### 7. Split into 4 Slices (5a + 5b + 5c + 5d)

**Decision:** Change 5 entregado en 4 PRs chained (~400 líneas each).

**Rationale:**
- Total ~1,520 líneas (demasiado para un PR)
- Slice 5a (shell + list) permite feedback temprano en guards + seguridad
- Slice 5b (CRUD + upload) agrega escritura + complejidad de Storage
- Slice 5c (students + keys) completa flujo de alumno; reutiliza cambios previos
- Slice 5d (hash migration) es crítico de seguridad; aislado para review cuidadoso
- Cada slice independientemente verificable y mergeable
- Nota: e2e suite ya ~38min; 5c agrega ~20-30 specs → ~50min total (tolerable, no paralelizable)

---

## Open Decisions for Design Phase

1. **Admin layout sidebar/nav design:** Mockup muestra nav flat; ¿vertical sidebar o horizontal topbar?
   - **Defer to sdd-design:** Specify navigation layout y breadcrumbs para /admin/talleres/[id]/...

2. **Workshop form: JSON editor o UI builder para content?** ¿Textarea donde Jennifer pega JSON, o form con campos?
   - **Defer to sdd-design:** Si UI builder, cómo se serializa; si textarea, qué validación visual previa.

3. **Upload cover: preview antes de submit, o upload + preview después?**
   - **Defer to sdd-design:** UX del upload flow (drag-drop vs input, preview timing)

4. **Student creation: modal o página separada `/admin/talleres/[id]/alumnos/new`?**
   - **Defer to sdd-design:** Interaction pattern; probablemente modal es más eficiente

5. **Key display: mostrar últimos 4 chars o full key en table?** Cómo copia Jennifer?
   - **Defer to sdd-design:** Cómo share la clave al alumno (copy button, QR, email link, manual paste)

6. **Filter/search en tabla de alumnos?** ¿Por email, por estado?
   - **Defer to sdd-design:** Si search implementado en 5c o deferred; rango de resultados

---

## External Blockers (Pre-Apply)

Estos tasks deben completarse ANTES de que `sdd-apply` inicie:

1. **Create admin user in Supabase**
   - Jennifer INSERT en auth.users un usuario admin (o helper script lo crea)
   - Asegurarse que public.users tiene role='admin'
   - Almacenar email + password en archivo seguro (solo para testing)

2. **Create Supabase Storage bucket `workshops`**
   - Bucket name: `workshops`
   - Public (no authentication required for SELECTs)
   - Storage RLS policies: crear via Supabase dashboard o migración SQL

3. **Run hash migration (slice 5d)**
   - Ejecutar migración SQL que agrega columnas + backfill
   - Validar que todas las claves existentes reciben hash+salt
   - Test: `redeemKey()` funciona con claves hasheadas

4. **Extend test helper with admin seed**
   - `tests/helpers/admin.ts` crea admin user para e2e (o reutiliza singleton)
   - `tests/helpers/supabase-admin.ts` agrega funciones para precalcular hash

---

## Review Workload Forecast

| Slice | Estimated LOC | Components | Actions | Tests | Deploy Risk |
|-------|---|---|---|---|---|
| 5a | ~400 | 2 (AdminLayout, WorkshopTable) | 1 (fetchWorkshops) | 30 lines | Low — guards + list |
| 5b | ~480 | 4 (WorkshopForm, CoverUpload, etc.) | 3 (create, update, delete, upload) | 120 lines | Medium — Storage RLS, upload logic |
| 5c | ~420 | 3 (StudentList, CreateStudentModal, KeyTable) | 2 (createStudent, generateKey) | 100 lines | Medium — user creation in auth.users, key generation |
| 5d | ~220 | 0 | 1 (redeemKey refactor) | 110 lines | High — touches change 2 archivado, critical security |
| **Total** | **~1,520** | 9 | 7 | ~360 | — |

**Chained PRs:** Sí (5a → 5b → 5c → 5d stacked)
- PR 5a targets `master`
- PR 5b targets 5a branch
- PR 5c targets 5b branch
- PR 5d targets 5c branch
- Total ~1,520 líneas en 4 PRs; ninguno excede 500
- Review parallelizable; merge serial (dependencies)

**E2E suite impact:**
- Current suite: 156 passed, ~38min serial
- Change 5 agrega ~40-45 specs (admin workflows + security) → ~50min total
- Nota: suite NO está paralelizada (DB remota en sa-east-1, seed user singleton)
- Mitigation: specs de admin son happy-path + seguridad crítica (no exhaustivo UI); detalles a polish/v1.1

**Decision needed before apply:** NO — entrega por chained PRs es estándar (cambios 2 + 4 lo usaron exitosamente).

**Budget risk:** Medium — si 5c (student creation en auth.users) falla, bloquea 5d. Mitigación: test helpers pre-build con seed admin.

---

## Risks & Mitigations

### Risk 1: Touching Archived Code (change 2 — redeemKey) — High

**Description:** Slice 5d refactors `redeemKey()` en `src/app/(authenticated)/catalogo/actions.ts` (change 2, archivado hace 4 dias). Si el merge está sucio o hay conflictos, rompe flujo de canje para TODOS los alumnos.

**Mitigation:**
- PR 5d se enfoca SOLO en redeemKey + migration
- Tests cubren: plaintext legacy (claves viejas) + hasheadas (claves nuevas) + fallback
- Fixture precalcula salt+hash; test exhaustivamente
- Merge de 5d se revisa con triple-review de security
- Rollback plan: si 5d falla, revertir al plaintext (sin hash) y re-hacer después

### Risk 2: Storage RLS Misconfiguration — Medium

**Description:** Bucket policy permite SELECT público pero no INSERT admin. Si INSERT está bloqueado, admin no puede cargar portadas; feature queda rota.

**Mitigation:**
- Policy revisada en design phase
- Test e2e: admin carga portada → file aparece en Storage → URL funciona
- Fallback: si RLS es problema, usar storage bypass flag temporalmente (security revisado post)

### Risk 3: User Creation in auth.users (5c) — Medium

**Description:** Server Action crea user en auth.users (admin API con service_role). Si API está misconfigured o quotas excedidas, falla.

**Mitigation:**
- Test helper crea ~5 users en beforeEach; si falla, logs claro
- Error handling: Server Action retorna error claro ("No se pudo crear usuario, contactar soporte")
- No crear 1000 usuarios en test; solo 5-10 para e2e happy path

### Risk 4: Hash Migration Correctness — High

**Description:** Migración SQL backfill calcula hash. Si SQL tiene error, claves quedan mal hasheadas y redeemKey() falla.

**Mitigation:**
- Migration escrita + testeada en local (Supabase CLI) ANTES de merge
- Test SQL: insertar clave plaintext → run migration → verify hash correcto
- Fallback: migration tiene rollback SQL (DROP columnas si falla)
- Fixture: precalcular expected hash, comparar contra DB resultado

### Risk 5: JSON Content Validation — Low

**Description:** Zod schema rechaza JSON inválido. Si schema es muy estricto, admin no puede cargar ejercicios.

**Mitigation:**
- Schema definido en change 3 (workshop-sections); change 5 reutiliza
- Design phase especifica formato exacto (qué campos, tipos, opcionales vs requeridos)
- Error message al admin es claro y específico ("Exercises: 'objective' requerido en item 3")

### Risk 6: E2E Suite Timeout (Medium)

**Description:** Suite ya ~38min serial. Change 5 agrega 40-45 specs → ~50min. Si infra lenta, timeout.

**Mitigation:**
- Specs de admin son happy-path + seguridad (no exhaustivo UI)
- Reutilizar helpers (seed admin, precalc hash) para no duplicar setup
- SI timeout ocurre: mover specs de UI detallada a polish/v1.1
- Monitor: después de merge, observar suite duration en CI

### Risk 7: Backward-Compat (Plaintext Keys) — Low

**Description:** Si redeemKey() fallback a plaintext no funciona, alumnos con claves viejas (changes 2-4) no pueden canjear.

**Mitigation:**
- Test fixture: crear WorkshopAccess con plaintext access_key, sin hash (simula clave vieja)
- Test: redeemKey() con plaintext input debe comparar contra plaintext en DB
- Log warning en redeemKey: "Clave sin hash detectada; refactor needed" (helps identify legacy keys)

---

## Deliverables Summary

### Slice 5a
- Layout + guard: 1 file (~50 líneas)
- Pages + actions: 2 files (~60 líneas)
- Components: 2 files (~150 líneas)
- Styling: global.css edits (~20 líneas)
- Tests e2e: 1 file (~100 líneas)
- **Total 5a:** ~380 líneas

### Slice 5b
- Form components: 3 files (~200 líneas)
- Server Actions (upload, CRUD): 1 file (~150 líneas)
- Styling: component styles (~40 líneas)
- Tests e2e (CRUD, upload): 1 file (~90 líneas)
- **Total 5b:** ~480 líneas

### Slice 5c
- Student/key components: 3 files (~220 líneas)
- Server Actions (createStudent, generateKey): 1 file (~100 líneas)
- Tests e2e (create, redeem, security): 1 file (~100 líneas)
- **Total 5c:** ~420 líneas

### Slice 5d
- Migration SQL: 1 file (~40 líneas)
- Hash utility: 1 file (~30 líneas)
- redeemKey refactor: edit to actions.ts (~40 líneas)
- Tests updates + fixture: 1 file (~110 líneas)
- **Total 5d:** ~220 líneas

### Integration Points
- 5a establece layout + permisos
- 5b utiliza layout, agrega CRUD + Storage
- 5c utiliza 5b forms, extiende con students + reusa `getExerciseAwareProgress` (change 4)
- 5d refactors cambio 2, asegurado por test fixture
- Todos los slices integran server-side role check desde 5a

---

## Architecture Continuity

### Inherited from Changes 1-4

- Server Actions pattern (co-located en `/actions.ts`)
- Zod schemas en `src/lib/schemas/`
- RLS para table-level security (validado server-side)
- React 19 + useActionState hook
- Playwright e2e con workers=1, admin helpers singleton
- Dark mode established; no overhead de diseño
- PascalCase components / camelCase functions
- `getExerciseAwareProgress` reusable (change 4 definió)

### Established for Downstream (Changes 6-8)

- **Admin panel complete** → change 6 puede enviar emails con credenciales
- **Workshop data complete** → change 6 usa workshop fields para emails
- **Key generation automated** → change 7 accede a claves generadas
- **User model extended** → password_changed flag para change 1.1 (first-login flow)
- **Storage bucket `workshops`** → reutilizable para PDFs/assets de futuros changes

---

## Metrics & Verification

### Lines of Code
- **Functional code:** ~1,100 líneas (pages + components + actions + schemas)
- **Test code:** ~360 líneas (e2e + unit + helpers)
- **Migrations/utilities:** ~80 líneas
- **Configuration/styling:** ~80 líneas
- **Total:** ~1,620 líneas en 4 slices

### Test Coverage
- **Unit:** Zod schemas (createWorkshopSchema, createStudentSchema, workshopContentSchema) — 100% expected
- **Integration:** None (deferred; cambios 1-4 tampoco tienen integration tests)
- **E2E:** ~45 specs (admin guards, CRUD, upload, student creation, key generation, security)
- **Gate:** pnpm test:e2e (Playwright con e2e-gate) debe pasar para todos los slices

### Performance Targets
- **Catalog load:** fetchWorkshops query ~100ms para 50 talleres
- **Cover upload:** <1s para file <5MB
- **Student creation:** <500ms (auth.users create + public.users insert + workshop_access insert)
- **redeemKey:** <100ms (hash comparison + DB update)
- **E2E suite:** ~50min serial (aceptado; paralelo no viable en sa-east-1)

---

## Conclusion

**Change 5 (admin-panel)** es la infraestructura de gestión de Jennifer. Implementa CRUD de talleres, upload de portadas, creación de alumnos, y generación de claves de acceso — completando el flujo administrativo requerido en brief §7.4 y §9.1. Dividido en 4 slices chained (5a: shell+list, 5b: CRUD+upload, 5c: students+keys, 5d: hash migration) para respetar presupuesto de líneas y permitir feedback granular. Todas las decisiones se apoyan en patrones de changes 1-4 (Server Actions + role checks, Zod validation, e2e gate). Hash migration (slice 5d) es crítica de seguridad; se revisa con rigor. Ready for spec phase.

---

## Appendix: Slice Dependency Graph

```
5a (shell + list)
 ↓
5b (CRUD + upload) — depende de layout 5a
 ↓
5c (students + keys) — depende de form patterns 5b, reutiliza getExerciseAwareProgress
 ↓
5d (hash + refactor) — depende de 5c para test fixtures, refactors cambio 2 (change 2 must be master)
```

**Merge order:** 5a → master, 5b → 5a → master, 5c → 5b → master, 5d → 5c → master.
