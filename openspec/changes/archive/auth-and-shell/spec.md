# Spec — auth-and-shell

**Change ID:** auth-and-shell  
**Status:** Draft  
**Date:** 2026-06-12  
**Proposal:** ./proposal.md  
**Brief:** ../../docs/brief.md

---

## Requisitos funcionales

### RF-1: Middleware de sesión
El middleware raíz (`src/middleware.ts`) debe:
- Refrescar la sesión Supabase en cada request sin efectos secundarios en Server Components
- Permitir acceso a rutas públicas (`/`, `/auth/login`, `/restricted`) sin validar autenticación
- Permitir acceso a rutas autenticadas (`/catalogo`, `/auth/change-password`) solo si existe sesión válida
- Redirigir silenciosamente (sin flash) a `/auth/login` si intenta acceder a ruta autenticada sin sesión
- Forzar redirect a `/auth/change-password` si accede a ruta autenticada con `password_changed = false`, EXCEPTO si la ruta es `/auth/change-password`

### RF-2: Login (`/auth/login`)
- Renderizar formulario con campos: email, password, botón "Ingresar", botón "Ingresar con Google" deshabilitado con tooltip "Disponible próximamente"
- Server Action `signIn()` valida input con Zod (email válido + password mínimo 8 chars)
- Llamar a `supabase.auth.signInWithPassword({email, password})`
- Si falla: mostrar mensaje inline en español: "Credenciales inválidas"
- Si OK: leer fila de `public.users` para chequear `password_changed`
  - Si `false` → redirigir a `/auth/change-password`
  - Si `true` → redirigir a `/catalogo`
- En caso de error de validación Zod: mostrar errores inline por campo

### RF-3: Cambio de password forzado (`/auth/change-password`)
- Accesible solo para usuarios autenticados con `password_changed = false`
- Si usuario accede con `password_changed = true`, redirigir a `/catalogo`
- Renderizar formulario con campos: password actual, password nueva, confirmar password nueva, botón "Cambiar contraseña"
- Incluir texto contextual: "Cambiá tu contraseña antes de continuar"
- Server Action `changePassword()` valida con Zod:
  - Nueva password ≠ password actual
  - Mínimo 8 caracteres
  - Ambas nuevas coinciden
- Re-verificar password actual con `supabase.auth.signInWithPassword()` (NO confiar solo en sesión)
- Llamar a `supabase.auth.updateUser({password: newPassword})`
- Hacer UPDATE en `public.users` seteando `password_changed = true` para `auth.uid()` actual
- Redirigir a `/catalogo` tras éxito
- Mostrar errores inline por campo si validación falla

### RF-4: Shell autenticado mínimo
Layout que envuelve rutas autenticadas (`/catalogo` y rutas futuras):
- Top bar fija horizontal con:
  - Logo SDIH a la izquierda (link a `/catalogo`)
  - Indicador de sesión con nombre del usuario logueado en el centro-derecha
  - Botón "Cerrar sesión" a la derecha
- Logout: Server Action `signOut()` que llama a `supabase.auth.signOut()` y redirige a `/auth/login`
- Fondo navy-900 heredado del brief §8
- Responsive en 360px sin scroll horizontal

### RF-5: Ruta `/catalogo` (placeholder autenticado)
- Renderizar shell autenticada (RF-4)
- Mostrar mensaje placeholder: "Catálogo — próximamente en change 2"
- Es el punto de entrada autenticado; contenido real implementado en change 2

### RF-6: Ruta `/restricted` (stub VPN)
- Pública, sin autenticación requerida
- Renderizar:
  - Isotipo cerebro SDIH (asset de `design/`)
  - Título: "Acceso restringido"
  - Texto: "Para acceder al portal necesitás estar conectado a la VPN. Si tenés problemas, contactá a Jennifer."
  - Link de contacto (WhatsApp tentativo, definitivo en change 7)
- En este change NO se integra con middleware VPN real (change 8)
- Responsive en 360px

---

## Requisitos no funcionales

### RNF-1: Seguridad (AGENTS.md blockers)
- Todos los inputs de Server Actions validados con Zod 4 antes de llegar a Supabase
- Ningún secreto hardcodeado: `SUPABASE_SERVICE_ROLE_KEY` solo en server, nunca expuesto al cliente
- `password_hash` vive en `auth.users` (gestionado por Supabase), nunca tocado directamente
- RLS activa en `public.users`: SELECT/UPDATE solo si `auth.uid() = id`
- Password hashing delegado a Supabase Auth (bcrypt, default)

### RNF-2: Performance
- Time to Interactive (TTI) de `/auth/login` < 2s en mobile (4G slow, 360px viewport)
- `/catalogo` carga sin waterfall de requests
- Sin warnings de Next.js 16 en `pnpm build`

### RNF-3: Responsive
- Mobile-first, breakpoints: 360 / 768 / 1024 / 1440
- Formularios de login y change-password funcionales en 360px sin scroll horizontal
- Inputs de 44px de altura mínima (touch-friendly)
- Label + input stack vertical en mobile, horizontal en 768px+

### RNF-4: Accesibilidad
- Contraste AA en formularios sobre fondo navy
- Labels asociados a inputs (`htmlFor` + `id`)
- Foco visible con glow cyan (token `--cyan: #19C6E6` del brief §8)
- Navegación por teclado: Tab order lógico, Enter submitea forms
- Error messages accesibles con ARIA live regions si es necesario

### RNF-5: i18n
- Todos los strings UI en español Rioplatense (voseo: "ingresá", "cambiá")
- Strings hardcodeados en este change; arquitectura preparada para i18n futuro (sin extraer a archivos aún)
- Ejemplos:
  - "Ingresar"
  - "Ingresá con Google"
  - "Email"
  - "Contraseña"
  - "Credenciales inválidas"
  - "Cambiá tu contraseña antes de continuar"
  - "Contraseña actual"
  - "Contraseña nueva"
  - "Confirmar contraseña"
  - "Cambiar contraseña"
  - "Cerrar sesión"
  - "Acceso restringido"
  - "Para acceder al portal necesitás estar conectado a la VPN. Si tenés problemas, contactá a Jennifer."

### RNF-6: Tipografía y colores (heredados del brief §8)
- Display: Space Grotesk
- Body: Inter
- Mono: JetBrains Mono (para código en futuras secciones)
- Colores:
  - Fondo: `--navy-900: #03050B`
  - Texto primario: `--text-primary: #E8EDF6`
  - Texto secundario: `--text-secondary: #95A2B8`
  - Accento: `--cyan: #19C6E6` (focus, hover en botones)
  - Buttons primarios: cyan
  - Buttons secundarios: outline cyan
  - Links: cyan con underline hover

---

## Escenarios de aceptación (Gherkin)

### Escenario 1: Login exitoso, primer ingreso (password_changed = false)
```gherkin
Dado que existe un usuario con email "alumna@test.com" y password_changed = false
Cuando ingreso a "/auth/login"
Y completo el campo email con "alumna@test.com"
Y completo el campo password con su contraseña temporal
Y hago clic en el botón "Ingresar"
Entonces soy redirigida a "/auth/change-password"
Y veo el mensaje "Cambiá tu contraseña antes de continuar"
```

### Escenario 2: Login exitoso, password ya cambiada (password_changed = true)
```gherkin
Dado que existe un usuario con email "alumna@test.com" y password_changed = true
Cuando ingreso a "/auth/login"
Y completo email y password correctos
Y hago clic en "Ingresar"
Entonces soy redirigida a "/catalogo"
Y veo la shell autenticada con mi nombre en la top bar
Y veo el botón "Cerrar sesión"
```

### Escenario 3: Login fallido (credenciales inválidas)
```gherkin
Dado que existe un usuario con email "alumna@test.com"
Cuando ingreso password incorrecta en "/auth/login"
Y hago clic en "Ingresar"
Entonces el formulario muestra el mensaje: "Credenciales inválidas"
Y NO soy redirigida
Y el campo password queda vacío (el email mantiene su valor)
```

### Escenario 4: Validación Zod de email y password inválidos
```gherkin
Cuando completo el formulario de login con:
  - email: "no-es-email"
  - password: "123"
Y hago clic en "Ingresar"
Entonces veo errores inline:
  - "Email inválido" en el campo email
  - "Mínimo 8 caracteres" en el campo password
Y el Server Action rechaza el request sin llamar a Supabase
```

### Escenario 5: Cambio de password forzado exitoso
```gherkin
Dado que estoy autenticada con password_changed = false en "/auth/change-password"
Cuando completo el formulario:
  - password actual: mi contraseña temporal correcta
  - password nueva: "NuevaPass123!"
  - confirmar password: "NuevaPass123!"
Y hago clic en "Cambiar contraseña"
Entonces mi password se actualiza en auth.users
Y el flag password_changed se setea en true en public.users
Y soy redirigida a "/catalogo"
```

### Escenario 6: Cambio de password — passwords nuevas no coinciden
```gherkin
Dado que estoy en "/auth/change-password"
Cuando completo:
  - password actual: correcto
  - password nueva: "A"
  - confirmar password: "B"
Y hago clic en "Cambiar contraseña"
Entonces veo error inline en el campo confirmar password: "Las contraseñas nuevas no coinciden"
Y mi password NO cambia
Y NO soy redirigida
```

### Escenario 7: Cambio de password — password actual incorrecta
```gherkin
Dado que estoy en "/auth/change-password"
Cuando completo:
  - password actual: incorrecta
  - password nueva: "NuevaPass123!" (válida, mínimo 8 chars)
  - confirmar password: "NuevaPass123!"
Y hago clic en "Cambiar contraseña"
Entonces veo error inline: "Contraseña actual incorrecta"
Y mi password NO cambia
Y NO soy redirigida
```

### Escenario 8: Cambio de password — nueva igual a actual
```gherkin
Dado que estoy en "/auth/change-password" con password actual "PassActual123"
Cuando completo:
  - password actual: "PassActual123"
  - password nueva: "PassActual123"
  - confirmar password: "PassActual123"
Y hago clic en "Cambiar contraseña"
Entonces veo error inline: "La nueva contraseña debe ser distinta a la actual"
Y mi password NO cambia
```

### Escenario 9: Acceso a ruta autenticada sin sesión
```gherkin
Dado que NO estoy autenticada
Cuando intento acceder a "/catalogo"
Entonces soy redirigida a "/auth/login" sin mensaje flash (silent redirect)
```

### Escenario 10: Acceso a /auth/change-password con password_changed = true
```gherkin
Dado que estoy autenticada con password_changed = true
Cuando ingreso a "/auth/change-password"
Entonces soy redirigida a "/catalogo"
```

### Escenario 11: Logout funcional
```gherkin
Dado que estoy en "/catalogo" autenticada
Cuando hago clic en el botón "Cerrar sesión"
Entonces mi sesión termina
Y soy redirigida a "/auth/login"
Y cuando intento volver a "/catalogo" sin loguearme
Entonces soy redirigida a "/auth/login" nuevamente
```

### Escenario 12: Acceso al stub de VPN
```gherkin
Cuando ingreso a "/restricted" sin estar autenticada
Entonces veo el isotipo cerebro
Y veo el título "Acceso restringido"
Y veo el mensaje sobre la VPN
Y veo un link de contacto (WhatsApp tentativo)
```

### Escenario 13: RLS — un usuario no puede leer datos de otro (validación manual)
```gherkin
Dado que existen dos usuarios A y B en public.users con ids distintos
Cuando A está autenticada
Y A intenta ejecutar: SELECT * FROM public.users WHERE id = B.id
Entonces el query devuelve 0 filas (no error SQL, simplemente vacío por RLS policy)
Y B no puede leer ningún dato personal de A
```

### Escenario 14: Botón "Ingresar con Google" deshabilitado
```gherkin
Cuando estoy en "/auth/login"
Entonces veo el botón "Ingresá con Google"
Y el botón está deshabilitado con tooltip "Disponible próximamente"
Y no puedo hacer clic en él
```

### Escenario 15: Shell responsive en 360px
```gherkin
Cuando accedo a "/catalogo" en viewport 360px
Entonces la top bar es legible sin scroll horizontal
Y el botón "Cerrar sesión" es clickeable (mínimo 44px de altura)
Y el nombre del usuario es visible y truncado si es necesario
```

---

## Schemas Zod (a implementar en sdd-apply)

### loginSchema
```typescript
z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
})
```

### changePasswordSchema
```typescript
z.object({
  currentPassword: z.string().min(8, "Mínimo 8 caracteres"),
  newPassword: z.string().min(8, "Mínimo 8 caracteres"),
  confirmPassword: z.string().min(8, "Mínimo 8 caracteres"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas nuevas no coinciden",
  path: ["confirmPassword"],
}).refine(data => data.newPassword !== data.currentPassword, {
  message: "La nueva contraseña debe ser distinta a la actual",
  path: ["newPassword"],
})
```

---

## Tabla `public.users` — schema requerido

Esta tabla será creada en la fase **sdd-design** (como SQL migration o script), pero la spec la define aquí para claridad de requisitos:

```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  role TEXT DEFAULT 'alumno' CHECK (role IN ('alumno', 'admin')),
  password_changed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policy: Each user can only read/update their own row
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Admins can read all (deferred to future policy definition)
-- CREATE POLICY "Admins can read all" ON public.users
--   FOR SELECT USING (
--     EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
--   );
```

---

## Cobertura de testing requerida

### Vitest (unit/integration de Server Actions)

#### Server Action `signIn`
- **TC-1.1**: Input válido → `supabase.auth.signInWithPassword` llamado → `password_changed: true` → redirige a `/catalogo`
- **TC-1.2**: Input válido → `supabase.auth.signInWithPassword` llamado → `password_changed: false` → redirige a `/auth/change-password`
- **TC-1.3**: Email inválido (no es email) → Zod rechaza → error mensaje "Email inválido"
- **TC-1.4**: Password corta (menos de 8 chars) → Zod rechaza → error mensaje "Mínimo 8 caracteres"
- **TC-1.5**: `supabase.auth.signInWithPassword` falla → error mensaje "Credenciales inválidas"

#### Server Action `changePassword`
- **TC-2.1**: Input válido (actual correcta, nuevas coinciden, ≠ actual) → `supabase.auth.updateUser` llamado → `public.users` actualizado → redirige a `/catalogo`
- **TC-2.2**: Nuevas no coinciden → Zod rechaza → error en confirmPassword
- **TC-2.3**: Nueva igual a actual → Zod rechaza → error en newPassword
- **TC-2.4**: Nueva password corta (menos de 8 chars) → Zod rechaza
- **TC-2.5**: Password actual incorrecta (re-verificación con signInWithPassword falla) → error "Contraseña actual incorrecta"

#### Server Action `signOut`
- **TC-3.1**: Llamar signOut → `supabase.auth.signOut` invocado → redirige a `/auth/login`

### Playwright (e2e flows)
- **E2E-1**: Login con `password_changed = false` → redirige a change-password → cambia password → redirige a `/catalogo`
- **E2E-2**: Login con `password_changed = true` → redirige directamente a `/catalogo`
- **E2E-3**: Login con credenciales inválidas → muestra error inline → no redirige
- **E2E-4**: Acceso a `/catalogo` sin sesión → redirige a `/auth/login`
- **E2E-5**: Logout desde `/catalogo` → redirige a `/auth/login` → `/catalogo` inaccesible sin re-login
- **E2E-6**: `/restricted` es accesible sin autenticación y renderiza correctamente
- **E2E-7**: Validación de form en login (email inválido, password corta) → errores inline
- **E2E-8**: Shell responsive en 360px viewport

### SQL/RLS (test manual o pgTAP futuro)
- **RLS-1**: User A SELECT own row → OK (1 fila)
- **RLS-2**: User A SELECT row de User B → OK (0 filas por RLS, no error)
- **RLS-3**: User A UPDATE own row → OK
- **RLS-4**: User A UPDATE row de User B → OK (0 rows afectadas por RLS, no error)

Documentar comando para validar manualmente en dashboard Supabase:
```sql
-- Ejecutar como User A (check en "Copy user UID" desde Supabase dashboard)
-- SELECT * FROM public.users WHERE id = '<uuid-de-user-a>'; -- OK, 1 fila
-- SELECT * FROM public.users WHERE id = '<uuid-de-user-b>'; -- OK, 0 filas
-- UPDATE public.users SET name = 'Updated A' WHERE id = '<uuid-de-user-a>'; -- OK, 1 fila
-- UPDATE public.users SET name = 'Updated B' WHERE id = '<uuid-de-user-b>'; -- OK, 0 filas (no error)
```

---

## Decisiones consumidas del orchestrator

Las siguientes decisiones fueron cerradas por el orchestrator antes de esta fase y NO se re-negocian:

1. **Password hashing:** `bcrypt` (default de Supabase Auth). No usar argon2.
2. **Stack de testing:** Vitest + Playwright instalados como parte de este change.
3. **Ruta autenticada de entrada:** `/catalogo` (slug en español, sin tilde).
4. **Tabla de usuarios:** `public.users` con `id UUID PRIMARY KEY` que referencia `auth.users(id) ON DELETE CASCADE`. Columnas: `id, email, name, role ('alumno'|'admin'), password_changed BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT now()`. RLS habilitada.
5. **Flash de sesión expirada:** NO se implementa flash. Silent redirect a `/auth/login`.

---

## Dependencias del change

### Externa (humana, antes de sdd-apply)
1. Proyecto Supabase activo con auth email/password habilitado
2. Tabla `public.users` creada con la migración correspondiente (sdd-design define el SQL)
3. Al menos un usuario seed con `password_changed: false` para testing manual
4. `.env.local` poblado con:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### Interna (cambios previos en SDD)
- Ninguna. Esta es change 1; no hay precedencias.

---

## Exclusiones explícitas (deferred a otros changes)

- **VPN enforcement real:** Change 8 (middleware con IP allowlist). Change 1 incluye solo stub visual.
- **Emails transaccionales (Resend):** Change 6. Creación de usuarios inicial es acción admin o script.
- **Google OAuth:** Phase 2 (fuera de v1).
- **Catálogo de talleres:** Change 2.
- **Contenido de talleres (5 secciones):** Change 3.
- **Panel admin (CRUD + key generation):** Change 5.
- **Botón WhatsApp flotante:** Change 7.

---

## Abierto para la fase design

- *Ninguno.* Todas las decisiones arquitectónicas están cacheadas. La fase design define:
  - SQL exacto de migration `public.users`
  - Componentes Tailwind derivados del prototype
  - Estructura de carpetas (`src/lib/supabase/`, `src/app/(auth)/`, etc.)
  - Manejo de errores granular (toast vs inline)
  - Estrategia de refresh de sesión en middleware (con validación de @supabase/ssr v0.12)

---

## Riesgos asumidos en spec

1. **Cookie handling en Next.js 16 + Supabase SSR:** Mitigado usando Server Actions para mutaciones, middleware solo para refresh.
2. **`password_changed` flag sincronización:** Mitigado implementando explícitamente en Server Actions con transacciones si es necesario.
3. **RLS policy syntax:** Validado en tests RLS (manual o pgTAP).
4. **Diseño mobile en 360px:** Verificado en E2E-8.

---

## Control de versión y entrega

- **Artifact store:** openspec (file-based)
- **Archivo:** `openspec/changes/auth-and-shell/spec.md`
- **Rama:** feat/pirka-v0-luli-archive-engram-skills (o equivalente en SDIH)
- **Estimado de cambio:** ~400 líneas (boundary case, potencial para chained PRs si RLS incluye políticas complejas)
- **Delivery strategy:** ask-on-risk (revisar con Jennifer si excede 400 líneas)
