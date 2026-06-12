# Tasks — auth-and-shell

**Change ID:** auth-and-shell  
**Status:** Ready for apply  
**Fecha:** 2026-06-12  
**Proposal:** ./proposal.md  
**Spec:** ./spec.md  
**Design:** ./design.md

---

## Review Workload Forecast

- **Estimated changed lines (code only):** 630
- **Estimated changed lines (with tests + configs + docs):** ~1,200
- **400-line budget risk:** High
- **Decision needed before apply:** No (resolved by orchestrator)
- **Delivery method:** size:exception (approved by Jennifer for change 1 only)
- **Reason logged:** testing infra one-off setup (~250 líneas que no se repiten en changes 2-8) + auth/shell son inseparables funcionalmente
- **Chained PRs recommended:** No (for this change; future changes return to ~400-line target per brief §13)

---

## Pre-apply blockers (acciones humanas, fuera del scope de sdd-apply)

Tareas para **Jennifer** ANTES de que sdd-apply pueda arrancar:

- [ ] **B-1**: Crear proyecto Supabase con email/password auth habilitado.
  - Dashboard → Authentication → Providers → Email enabled.
  
- [ ] **B-2**: Copiar credenciales a `.env.local` (basado en `.env.local.example`).
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_APP_URL=http://localhost:3000`

- [ ] **B-3**: Correr la migración SQL del design D-3 en Supabase SQL Editor.
  - Alternativa: via CLI si está instalada (`supabase migration up`).
  - SQL en `supabase/migrations/20260612000000_create_users_table.sql` (creado en T-2.1).

- [ ] **B-4**: Crear al menos 1 usuario de prueba en Supabase Auth Dashboard.
  - Email: `test@example.com` (ejemplo)
  - Contraseña temporal: generada por Supabase
  - Crear INSERT manual en `public.users` con `password_changed=false` para ese mismo `id`.
  - Script de ejemplo en `docs/database/manual-seed.sql` (creado en T-2.3).

---

## Apply tasks (sdd-apply las consume en orden)

Agrupadas por bloque lógico. Cada bloque puede ser un commit independiente (work-unit-commits skill).

### Bloque 1: Testing infrastructure (setup one-off)

- [ ] **T-1.1**: Instalar deps de dev para testing.
  ```bash
  pnpm add -D vitest@^3.0.0 @vitejs/plugin-react@^4.3.0 jsdom@^25.0.0 @playwright/test@^1.48.0 playwright@^1.48.0
  ```

- [ ] **T-1.2**: Instalar browsers para Playwright.
  ```bash
  pnpm exec playwright install chromium
  ```

- [ ] **T-1.3**: Crear `vitest.config.ts` en raíz del proyecto.
  - Environment: `jsdom`
  - Globals: `true` (describe, it, expect sin imports)
  - Alias: `@/*` pointing a `src/`
  - Setup file: `tests/setup.ts`
  - Include: `['tests/vitest/**/*.test.ts']`

- [ ] **T-1.4**: Crear `playwright.config.ts` en raíz del proyecto.
  - `baseURL: 'http://localhost:3000'`
  - `webServer: { command: 'pnpm dev', port: 3000, timeout: 120000 }`
  - Devices: Desktop Chrome (1280x720) + Mobile (360x800)
  - Include: `['tests/playwright/**/*.spec.ts']`

- [ ] **T-1.5**: Crear `tests/setup.ts` para Vitest.
  - Mock de `@supabase/ssr` cookies si es necesario
  - Patrón: D-5 del design (MSW o Vitest mocks)

- [ ] **T-1.6**: Agregar scripts a `package.json`.
  - `"test": "vitest"`
  - `"test:unit": "vitest --run"`
  - `"test:e2e": "playwright test"`
  - `"test:e2e:headed": "playwright test --headed"`
  - `"test:all": "pnpm test && pnpm test:e2e"`

- [ ] **T-1.7**: Agregar `.gitignore` entries.
  - `/test-results/`
  - `/playwright-report/`
  - `/playwright/.cache/`
  - `/coverage/` (si se usa coverage en Vitest)

---

### Bloque 2: Database

- [ ] **T-2.1**: Crear archivo de migración SQL.
  - Ruta: `supabase/migrations/20260612000000_create_users_table.sql`
  - Contenido: SQL del design D-3 (CREATE TABLE + RLS policies)
  - Incluir comentarios con pasos B-3 para Jennifer

- [ ] **T-2.2**: Documentar en archivo de migración.
  - Paso a paso para ejecutar en dashboard o via CLI
  - Warning: "Esta migración debe ejecutarse en el SQL Editor de Supabase antes de que sdd-apply continúe"

- [ ] **T-2.3**: Crear `docs/database/manual-seed.sql`.
  - INSERT de ejemplo para usuario de prueba
  - Incluir instrucciones para Jennifer (paso B-4)
  - Valores: `id` = UUID del usuario creado en Auth, `email`, `password_changed=false`

---

### Bloque 3: Schemas Zod compartidos

- [ ] **T-3.1**: Crear `src/lib/schemas/auth.ts`.
  - `loginSchema`: email + password (spec §Schemas Zod)
  - `changePasswordSchema`: currentPassword + newPassword + confirmPassword con refines
  - Mensajes de error en español (Rioplatense)

- [ ] **T-3.2**: Exportar tipos inferidos.
  - `type LoginInput = z.infer<typeof loginSchema>`
  - `type ChangePasswordInput = z.infer<typeof changePasswordSchema>`
  - Exportar también los schemas

---

### Bloque 4: Middleware raíz

- [ ] **T-4.1**: Crear `src/middleware.ts`.
  - Invoke `updateSession` de `src/lib/supabase/middleware.ts`
  - Matcher: excluir `_next/static`, `_next/image`, `favicon.ico`, archivos públicos
  - Rutas públicas: `/`, `/auth/login`, `/restricted`
  - Rutas autenticadas: `/catalogo`, `/auth/change-password`
  - Silent redirect a `/auth/login` si sin sesión
  - Chequeo de `password_changed` (ver design D-2, nota sobre v0.12)

- [ ] **T-4.2**: Configurar matcher correctamente.
  - Patrón en design D-2

- [ ] **T-4.3**: Validar con `pnpm dev` que middleware no rompe landing actual.
  - Navegar a `/` → debe ser accesible
  - Navegar a `/auth/login` → debe ser accesible
  - Navegar a `/catalogo` sin sesión → redirect a `/auth/login` (verificar en Network tab)

---

### Bloque 5: Auth helpers y components base

- [ ] **T-5.1**: Crear `src/lib/auth/helpers.ts` (o split si es necesario).
  - `validateCredentials()`: wrapper para chequear password actual vía Supabase
  - `checkPasswordChanged()`: leer flag de `public.users`
  - Exportar tipos compartidos

- [ ] **T-5.2**: Crear `src/components/auth/AuthCard.tsx`.
  - Wrapper card con backdrop blur, border, shadow
  - Props: `className?`, `children`
  - Tailwind: `backdrop-blur-sm bg-navy-700 border border-navy-600 rounded-lg p-6 sm:p-8 max-w-md mx-auto`
  - Responsive: padding menor en mobile

- [ ] **T-5.3**: Crear `src/components/auth/FormError.tsx`.
  - Props: `message?: string | string[]`
  - Renderiza texto rojo bajo input si error existe
  - Accesible: `aria-live="polite"` si es necesario

- [ ] **T-5.4**: Crear `src/components/auth/SubmitButton.tsx`.
  - Props: `children`, `disabled?`
  - Usa `useFormStatus` de React 19
  - Muestra spinner o "Cargando..." si `pending`
  - Tailwind: `w-full bg-cyan text-navy-900 py-2.5 rounded font-semibold disabled:opacity-50`

---

### Bloque 6: Ruta /auth/login

- [ ] **T-6.1**: Crear estructura `src/app/(auth)/login/page.tsx`.
  - Server Component
  - Renderiza `<LoginForm />`
  - Layout: centrado vertical + horizontal, fondo navy-900

- [ ] **T-6.2**: Crear `src/app/(auth)/login/actions.ts`.
  - Server Action `signInAction` (o `signIn`)
  - Validar con `loginSchema` (T-3.1)
  - Llamar `supabase.auth.signInWithPassword()`
  - Si falla: return `{ errors: { submit: "Credenciales inválidas" } }`
  - Si OK: leer `public.users` para chequear `password_changed`
    - `false` → `redirect("/auth/change-password")`
    - `true` → `redirect("/catalogo")`
  - Manejar errores Zod: return `{ errors: fieldErrors }`

- [ ] **T-6.3**: Crear `src/app/(auth)/login/LoginForm.tsx`.
  - Client Component con `"use client"`
  - Usa `useFormState` de React 19
  - Campos: email (type="email"), password (type="password")
  - Labels + htmlFor + id
  - Botón primario cyan: "Ingresar"
  - Botón secundario deshabilitado con tooltip: "Ingresá con Google" (disabled + title)
  - Renderiza errores inline con `<FormError />`
  - Microanimación `sd-rise` en card

- [ ] **T-6.4**: Crear `src/app/(auth)/layout.tsx`.
  - Route group `(auth)`
  - Layout compartido para `/login` y `/change-password`
  - Fondo común navy-900
  - Children centrados

- [ ] **T-6.5**: Agregar button "Ingresar con Google" deshabilitado.
  - `disabled`
  - `title="Disponible próximamente"`
  - Styling: outline cyan, no cursor-pointer
  - (Ya incluido en T-6.3 pero documentar acá)

- [ ] **T-6.6**: Validar `pnpm dev` → navegar a `/auth/login`.
  - Ver render OK en desktop (1280px) y mobile (360px)
  - Sin scroll horizontal en 360px
  - Inputs legibles y clickeables (44px altura mínima)

---

### Bloque 7: Ruta /auth/change-password

- [ ] **T-7.1**: Crear `src/app/(auth)/change-password/page.tsx`.
  - Server Component
  - Validar sesión activa + `password_changed=false`
  - Si no cumple (ej: password_changed=true), redirect a `/catalogo`
  - Renderiza `<ChangePasswordForm />`

- [ ] **T-7.2**: Crear `src/app/(auth)/change-password/actions.ts`.
  - Server Action `changePasswordAction` (o `changePassword`)
  - Validar con `changePasswordSchema` (T-3.1)
  - Re-verificar password actual: `supabase.auth.signInWithPassword()` (NO confiar solo en sesión)
  - Si falla: return `{ errors: { currentPassword: "Contraseña actual incorrecta" } }`
  - Llamar `supabase.auth.updateUser({ password: newPassword })`
  - Hacer UPDATE en `public.users` seteando `password_changed=true`
  - Redirect a `/catalogo` tras éxito
  - Manejar errores: return `{ errors: fieldErrors }`

- [ ] **T-7.3**: Crear `src/app/(auth)/change-password/ChangePasswordForm.tsx`.
  - Client Component
  - Usa `useFormState`
  - Campos: currentPassword, newPassword, confirmPassword (todos type="password")
  - Mensaje contextual: "Cambiá tu contraseña antes de continuar"
  - Botón: "Cambiar contraseña"
  - Errores inline con `<FormError />`
  - Responsive en 360px

---

### Bloque 8: Shell autenticado + /catalogo placeholder

- [ ] **T-8.1**: Crear `src/app/(authenticated)/layout.tsx`.
  - Route group `(authenticated)`
  - Layout autenticado con TopBar
  - Valida sesión (si no, redirect a `/auth/login`)
  - Renderiza TopBar + children
  - Fondo navy-900

- [ ] **T-8.2**: Crear `src/components/shell/TopBar.tsx`.
  - Logo SDIH a la izquierda (link a `/catalogo`)
  - Indicador de sesión con nombre del usuario en el centro
  - Botón "Cerrar sesión" a la derecha
  - Responsive: padding y text-size ajustados en mobile
  - Altura mínima botones: 44px

- [ ] **T-8.3**: Crear `src/app/(authenticated)/_actions/sign-out.ts` (o `actions.ts`).
  - Server Action `signOutAction` (o `signOut`)
  - Llamar `supabase.auth.signOut()`
  - Redirect a `/auth/login`

- [ ] **T-8.4**: Crear `src/app/(authenticated)/catalogo/page.tsx`.
  - Server Component
  - Renderiza shell autenticada (ya en layout)
  - Mensaje placeholder: "Catálogo — próximamente en change 2"
  - Responsive

---

### Bloque 9: Ruta /restricted (VPN stub)

- [ ] **T-9.1**: Crear `src/app/restricted/page.tsx`.
  - Renderiza isotipo cerebro SDIH (asset de `design/`)
  - Título: "Acceso restringido"
  - Texto: "Para acceder al portal necesitás estar conectado a la VPN. Si tenés problemas, contactá a Jennifer."
  - Link de contacto (WhatsApp tentativo, definitivo en change 7)
  - Responsive en 360px
  - NO requiere autenticación

---

### Bloque 10: Eliminar landing placeholder vieja

- [ ] **T-10.1**: Reemplazar `src/app/page.tsx`.
  - Nuevo comportamiento: redirect basado en sesión + password_changed
  - Si autenticado + password_changed → `/catalogo`
  - Si autenticado + NO password_changed → `/auth/change-password`
  - Si NO autenticado → `/auth/login`
  - Usar Server Component para lógica

---

### Bloque 11: Tests Vitest (unit/integration)

- [ ] **T-11.1**: Crear `tests/vitest/schemas/auth.test.ts`.
  - Test `loginSchema` con 3 casos:
    - Input válido → parse OK
    - Email inválido → error "Email inválido"
    - Password corta → error "Mínimo 8 caracteres"

- [ ] **T-11.2**: Agregar al mismo archivo tests para `changePasswordSchema`.
  - Test valid input → parse OK
  - Test passwordsNoMatch → error en confirmPassword
  - Test newEqualsOld → error en newPassword
  - Test shortPassword → error
  - Test (1 más según TC-2.x)

- [ ] **T-11.3**: Crear `tests/vitest/actions/sign-in.test.ts`.
  - Mock `supabase.auth.signInWithPassword`
  - Test TC-1.1: input válido → password_changed true → redirige a `/catalogo`
  - Test TC-1.2: input válido → password_changed false → redirige a `/auth/change-password`
  - Test TC-1.3: email inválido → Zod rechaza
  - Test TC-1.4: password corta → Zod rechaza
  - Test TC-1.5: Supabase falla → error "Credenciales inválidas"

- [ ] **T-11.4**: Crear `tests/vitest/actions/change-password.test.ts`.
  - Mock `supabase.auth.updateUser` + update de `public.users`
  - Test TC-2.1: input válido → updateUser llamado → public.users actualizado → redirige a `/catalogo`
  - Test TC-2.2: newPassword !== confirmPassword → Zod rechaza
  - Test TC-2.3: newPassword === currentPassword → Zod rechaza
  - Test TC-2.4: newPassword corta → Zod rechaza
  - Test TC-2.5: password actual incorrecta → error "Contraseña actual incorrecta"

- [ ] **T-11.5**: Crear `tests/vitest/actions/sign-out.test.ts`.
  - Mock `supabase.auth.signOut`
  - Test TC-3.1: llamar signOut → supabase.auth.signOut invocado → redirige a `/auth/login`

---

### Bloque 12: Tests Playwright (e2e)

- [ ] **T-12.1**: Crear `tests/playwright/auth.spec.ts`.
  - **E2E-1**: Login con `password_changed=false` → redirige a change-password → cambia password → redirige a `/catalogo`
  - **E2E-2**: Login con `password_changed=true` → redirige directamente a `/catalogo`
  - **E2E-3**: Login con credenciales inválidas → muestra error inline → no redirige
  - **E2E-4**: Acceso a `/catalogo` sin sesión → redirige a `/auth/login`
  - **E2E-5**: Logout desde `/catalogo` → redirige a `/auth/login` → `/catalogo` inaccesible sin re-login
  - Notas de setup: `.env.local` con Supabase de test, usuarios seed creados en B-4

- [ ] **T-12.2**: Agregar specs adicionales al mismo archivo o nuevo.
  - **E2E-6**: `/restricted` accesible sin autenticación, renderiza isotipo + mensaje + link
  - **E2E-7**: Validación de form en login (email inválido, password corta) → errores inline, botón disabled mientras se carga
  - **E2E-8**: Shell responsive en 360px viewport → top bar legible, botón logout clickeable (44px), nombre truncado si es necesario

- [ ] **T-12.3**: Crear `tests/playwright/responsive.spec.ts` (opcional, puede ir en auth.spec.ts).
  - **E2E-8.1**: Login en 360px sin scroll horizontal
  - **E2E-8.2**: Change-password en 360px sin scroll horizontal
  - **E2E-8.3**: `/catalogo` top bar en 360px, botón 44px min
  - Usar `page.setViewportSize({ width: 360, height: 800 })`

- [ ] **T-12.4**: Crear `tests/playwright/restricted.spec.ts` (opcional).
  - **E2E-6.1**: Acceso a `/restricted` sin sesión
  - **E2E-6.2**: Renderiza isotipo
  - **E2E-6.3**: Renderiza título y mensaje
  - **E2E-6.4**: Link de contacto visible

---

### Bloque 13: Documentación

- [ ] **T-13.1**: Crear `docs/database/setup.md`.
  - Pasos B-1 a B-4 expandidos con screenshots y ejemplos
  - URL del dashboard Supabase
  - Comando SQL para crear usuario de test
  - Verificación: "¿Cómo sé que la migración se ejecutó?"
  - Troubleshooting: errores comunes al conectar

- [ ] **T-13.2**: Crear o actualizar `.env.local.example`.
  - Si el design D-X cambió variables:
    - `NEXT_PUBLIC_SUPABASE_URL=https://...`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`
    - `SUPABASE_SERVICE_ROLE_KEY=...` (servidor solo)
    - `NEXT_PUBLIC_APP_URL=http://localhost:3000`
  - Incluir comentario: "IMPORTANTE: Copiar a .env.local antes de pnpm dev"

- [ ] **T-13.3**: Crear `docs/TESTING.md` (si no existe).
  - Cómo correr tests locales: `pnpm test`, `pnpm test:e2e`
  - Setup de Supabase local (opcional, puede deferirse)
  - Validación manual de RLS: comando SQL en dashboard
  - Debug de tests: `--ui` flag para Playwright

- [ ] **T-13.4**: Actualizar `AGENTS.md` si emerge convención propia.
  - Probablemente NO necesario
  - Si surge algo importante (ej: "siempre usar Server Components en routes autenticadas"), documentar

---

### Bloque 14: Verificación local final

- [ ] **T-14.1**: `pnpm install` → no errores.
  - Verificar que todas las deps se instalaron (vitest, playwright, etc.)

- [ ] **T-14.2**: `pnpm lint` → no errores nuevos.
  - ESLint debe pasar en toda la carpeta `src/`

- [ ] **T-14.3**: `pnpm build` → compila limpio sin warnings de Next.js 16.
  - Buscar warnings en output
  - Verificar que no hay `console.warn` o `console.error` sin razón

- [ ] **T-14.4**: `pnpm test` (Vitest) → todos verdes.
  - Coverage: no requerida en v1 pero es bueno verla

- [ ] **T-14.5**: Setup `.env.local` con Supabase staging o local + B-1 a B-4 completados.
  - `pnpm dev` → app inicia sin errores
  - Navegar a `/auth/login` → formulario visible
  - Login con credenciales válidas (usuario seed creado en B-4)
  - Redirige a `/auth/change-password` si `password_changed=false`
  - Cambiar password → redirige a `/catalogo`
  - Logout desde `/catalogo` → redirige a `/auth/login`
  - `pnpm test:e2e` → todos los specs verdes

---

## Dependencias entre bloques

```
Bloque 1 (testing infra)
  ↓
  ├─→ Bloque 3 (schemas) ← Bloque 4 (middleware)
  │     ↓
  │     ├─→ Bloque 6 (login) ← Bloque 5 (helpers + components)
  │     ├─→ Bloque 7 (change-password)
  │     └─→ Bloque 11 (tests vitest)
  │
  ├─→ Bloque 2 (database)
  │     ↓
  │     └─→ Bloque 8 (shell + catalogo)
  │
  └─→ Bloque 5 (helpers + components) ← Bloques 6, 7, 8

Bloque 10 (landing redirect) ← Bloque 6, 7, 8

Bloque 12 (tests e2e) ← Bloque 8, 10 (requiere shell + routes funcionales)

Bloque 13 (documentación) — paralela a cualquier bloque

Bloque 9 (restricted stub) — puede ir en paralelo a bloques 6-8

Bloque 14 (verificación) — FINAL, después de todos los bloques
```

**Resumen de paralelismo:**
- **Secuencial obligatorio:** 1 → (2 || 3 || 5) → (4 || 6 || 7 || 8 || 9) → 10 → 12 → 14
- **Paralelo recomendado:** 2 y 3 pueden arrancarse juntos tras T-1.7
- **Paralelo flexible:** Bloques 6, 7, 8, 9 pueden ejecutarse en paralelo una vez que Bloque 5 esté listo
- **Bloque 13:** Documentación puede hacerse en paralelo a cualquier bloque

---

## Estrategia de commits (work-unit-commits skill)

**Patrón recomendado:** 1 commit por bloque cuando todas las tasks del bloque están verdes localmente.

**Mensaje de commit:**
```
feat(auth-and-shell): <descripción del bloque>

Changes:
- <T-X.Y: descripción breve>
- <T-X.Y: descripción breve>

Closes change 1 task block <N>/14.
```

**Nota:** Change 1 es `size:exception`. El PR final contiene todos los bloques en una sola revisión (no encadenados).

**Ejemplos de mensajes:**
```
feat(auth-and-shell): setup testing infrastructure (vitest + playwright)

Changes:
- T-1.1 to T-1.7: install deps, create configs, add scripts

Closes change 1 task block 1/14.
```

```
feat(auth-and-shell): create database schema with RLS policies

Changes:
- T-2.1 to T-2.3: create migration, seed script

Closes change 1 task block 2/14.
```

---

## Riesgos cacheados del design (sdd-apply debe respetar estos)

1. **Supabase SSR v0.12 middleware → validar password_changed en Server Components, NO en middleware.**
   - Design D-2 documenta cómo leer sesión en Server Components
   - T-4.1 debe implementar exactamente ese patrón

2. **Migración SQL sin trigger auto-creador → admin panel (change 5) crea usuarios manualmente.**
   - T-2.1 NO incluye trigger de auto-creación
   - Documentar en T-2.2 que T-2.3 y `docs/database/setup.md` incluyen pasos manuales

3. **RLS sin tests auto → un test e2e que valide aislamiento.**
   - T-12.x debe incluir test de RLS (E2E que intenta leer datos ajenos o Network inspection)
   - T-13.3 documenta validación manual SQL

4. **Vitest mocking de Supabase → patrón MSW o mocks directos.**
   - T-1.5 crea `tests/setup.ts` con el patrón
   - T-11.x usa ese patrón

5. **Tailwind 4 keyframes → fallback a tailwind.config.ts con theme.extend.keyframes.**
   - T-5.2 implementa microanimación `sd-rise` en globals.css
   - Si no funciona, T-14.3 debe ajustar a config.ts

---

## Open issues

**Ninguno.** Todas las decisiones están cerradas por orchestrator + design.

**Preguntas resueltas:**
- ¿Migración SQL manual o via CLI? → Documentado en T-2.2, ambas opciones válidas
- ¿Trigger de auto-creación? → NO en v1 (T-2.1 explícitamente sin trigger)
- ¿Test runner? → Vitest + Playwright (cacheado en design D-5)
- ¿Flash de sesión expirada? → NO, silent redirect (cached en spec)

---

## Resumen ejecutivo de tareas

**Total de tareas:** 56 (14 bloques x ~4 tareas por bloque)

**Líneas estimadas de código producido:**
- Bloque 1-13: ~630 líneas (código funcional)
- Bloque 12-14 (tests + docs): ~570 líneas
- **Total:** ~1,200 líneas

**Duración estimada (por implementador experimentado):**
- Bloques 1-4 (setup): 2-3 horas
- Bloques 5-10 (features): 4-6 horas
- Bloques 11-13 (tests + docs): 3-4 horas
- Bloque 14 (verificación): 1 hora
- **Total estimado:** 10-14 horas

**Ruta crítica de ejecución:**
1. Bloques 1 → 2 || 3 || 5 (paralelo posible)
2. Bloque 4 (middleware)
3. Bloques 6 || 7 || 8 || 9 (paralelo posible)
4. Bloque 10 (landing)
5. Bloques 12 || 13 (paralelo)
6. Bloque 14 (verificación final)

**Dependencias críticas en pre-apply:**
- B-1 a B-4 deben completarse ANTES de que sdd-apply pueda validar tests e2e
- Supabase proyecto + tabla + usuarios seed son humanos (Jennifer)
- sdd-apply NO bloquea por esto, pero T-14.5 fallará si no están listos

---

## Próximos pasos

1. **Jennifer completa B-1 a B-4:** proyecto Supabase, credenciales, migración, usuarios seed
2. **sdd-apply arranca:** Bloques 1-14 en orden respetando dependencias
3. **Verificación local:** T-14.1 a T-14.5 pasan, no hay regresiones
4. **Commit final:** Todos los bloques en un único PR (size:exception)
5. **Review:** Team review de código (auth logic, tests, design implementation)
6. **Merge:** PR a main (o staging según política de Jennifer)
7. **Next change:** Change 2 (catalog) puede arrancarse
