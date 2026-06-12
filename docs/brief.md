# Brief Definitivo — SDIH Talleres v1

**Producto:** Portal privado de talleres en vivo de Salazar Duke Impact Hub
**Dominio:** talleres.salazardukeimpacthubteams.com
**Fecha:** 2026-06-12
**Propietaria:** Jennifer Salazar Duque (info@trazzoslabs.com)

---

## 1. Producto en una frase

Portal privado bajo VPN donde los alumnos de Jennifer Salazar acceden a sus talleres comprados, consumen contenido por secciones y ejecutan ejercicios accionables con autosave de progreso.

## 2. Usuarios

| Rol | Qué hace |
|-----|----------|
| Alumno | Login, ingresa al catálogo, desbloquea talleres con clave, consume contenido, ejecuta ejercicios, marca progreso |
| Jennifer (admin) | Crea talleres, genera claves de acceso, sube diapositivas, define ejercicios, ve progreso de alumnos |

## 3. Alcance v1

### Incluido

- Auth email + password
- Cambio de password obligatorio en primer login
- Catálogo de talleres con 4 estados: disponible / en vivo / próximamente / completado
- Modal de acceso con clave única por taller
- 5 secciones por taller: **Inicio · Aprendizaje · Taller · Instalación · Glosario**
- Tracking de progreso por alumno con autosave (debounce 1s)
- Panel admin: CRUD de talleres + generación de claves
- Emails transaccionales (bienvenida, clave, recordatorio de taller en vivo)
- Botón flotante WhatsApp con mensaje pre-llenado por taller
- Pantalla "Acceso restringido — necesitás VPN"

### Excluido v1 (no construir)

- Login con Google (fase 2)
- Integración de pagos (manual vía WhatsApp + Bre-B/Bold)
- Streaming en vivo (Zoom/Meet externo, link en sección Inicio)
- Landing público en dominio raíz (se hace después)
- Foro / chat entre alumnos
- Certificados automatizados (fase 2)
- App móvil nativa (mobile-first web es suficiente)

## 4. Stack

| Capa | Tecnología |
|------|------------|
| Frontend | Next.js 16 (App Router) + React 19 |
| Estilos | Tailwind 4 |
| Validación | Zod 4 (cliente y servidor) |
| Backend | Next.js API routes + Supabase |
| Auth | Supabase Auth (email/password) |
| DB | Supabase Postgres con RLS por alumno |
| Storage | Supabase Storage (PDFs, portadas) |
| Emails | Resend + React Email |
| Hosting | Vercel detrás de VPN (IP allowlist o middleware) |
| Tipografía | Space Grotesk (display) + Inter (texto) + JetBrains Mono (código) |

## 5. Arquitectura — 3 niveles

```
1. Login (dentro del VPN)
   ↓
2. Catálogo de talleres del alumno
   ↓
3. Taller individual desbloqueado con clave única
   └─ Sidebar con las 5 secciones + barra de progreso
```

## 6. Modelo de datos

```
User
  id, email, password_hash, name, created_at,
  role (alumno | admin), password_changed (boolean)

Workshop
  id, slug, title, description, instructor, date_live, duration_min,
  prerequisites, status, cover_image, whatsapp_message_template,
  price_display, created_at

WorkshopAccess
  id, user_id, workshop_id, access_key, redeemed_at, expires_at

Section (5 fijas por taller)
  id, workshop_id, type (inicio|aprendizaje|taller|instalacion|glosario),
  content_json, order

Exercise
  id, workshop_id, title, objective, prompt_text, order

ExerciseProgress
  id, user_id, exercise_id, status (pending|in_progress|done),
  user_response_text, updated_at

GlossaryTerm
  id, workshop_id, term, definition, category
```

## 7. Flujos críticos

### 7.1 Compra (manual, fuera del sistema)

1. Prospecto contacta a Jennifer por WhatsApp desde canales externos
2. Jennifer envía link de Bre-B / Bold y confirma el pago manualmente
3. Jennifer entra al panel admin → genera clave para el taller comprado
4. Sistema crea `WorkshopAccess` + dispara email al alumno con credenciales temporales + clave del taller

### 7.2 Onboarding del alumno

1. Recibe email con credenciales temporales + clave del taller
2. Conecta VPN
3. Login → cambio de password obligatorio en primer ingreso
4. Catálogo → click "Ingresar" → modal pide clave → desbloquea
5. Aterriza en sección Inicio del taller

### 7.3 Consumo del taller

1. Recorre las 5 secciones desde el sidebar
2. En "Taller": copia prompts con un click, escribe su respuesta en el textarea (autosave 1s)
3. Marca ejercicios como completados → progreso se actualiza en el sidebar
4. Glosario y Aprendizaje disponibles en paralelo

### 7.4 Admin crea taller nuevo

1. Login admin → panel "Nuevo taller"
2. Carga título, descripción, fecha, diapositivas (PDF), ejercicios, glosario, guía de instalación
3. Publica como "Próximamente"
4. Por cada pago confirmado → genera clave individual desde el panel

## 8. Identidad visual

Hereda 100% de Salazar Duke Impact Hub. Assets de diseño en `/design/` del repo.

### Tokens de diseño

```css
/* Colores */
--navy-900: #03050B
--navy-800: #05080F
--navy-700: #0B1220
--navy-600: #0D1525
--cyan: #19C6E6
--magenta: #D946EF
--orange: #FF7A1A
--lime: #A3E635
--yellow: #FACC15
--text-primary: #E8EDF6
--text-secondary: #95A2B8
--text-muted: #5E6B82

/* Tipografía */
--font-display: 'Space Grotesk', sans-serif
--font-body: 'Inter', sans-serif
--font-mono: 'JetBrains Mono', monospace

/* Tagline oficial */
"Inteligencia con alma"
```

### Componentes a derivar de los mockups

- Botones (primario cyan, secundario outline, terciario ghost)
- Inputs con focus glow cyan
- Tarjetas con borde sutil y backdrop blur
- Badges de estado con dot animado (live, disponible, próximamente, completado)
- Modal con estados idle / error / success
- Sidebar con navegación activa con glow
- Progress bar con gradiente
- Microanimaciones: `sdPulse`, `sdCheck`, `sdRise`, `sdLive`, `sdToast` (ver `design/portal-talleres/SDIH Talleres.dc.html`)

### Estructura de assets en el repo

```
/design/
  ├── manual-de-marca/
  │   └── Manual de Marca.dc.html
  ├── sistema-de-logo/
  │   └── Sistema de Logo.dc.html
  ├── aplicaciones-de-marca/
  │   └── Aplicaciones de Marca.dc.html
  ├── portal-talleres/
  │   └── SDIH Talleres.dc.html
  └── assets/
      ├── logo-brain.png
      ├── logo-lockup.png
      └── favicon-brain.png
```

## 9. Gaps a construir derivando del design system

El prototipo cubre el 90% del producto. Estos 3 elementos NO tienen mockup y deben construirse extrapolando del sistema visual existente:

### 9.1 Panel admin

Pantallas CRUD utilitarias para Jennifer:

- Lista de talleres con filtros por estado
- Formulario crear/editar taller (uploads de cover, PDF, JSON de ejercicios y glosario)
- Lista de alumnos por taller con su % de progreso
- Acción "Generar clave de acceso": seleccionar alumno + taller → genera clave + envía email automático
- Tabla de claves generadas con estado (pendiente / canjeada / expirada)

### 9.2 Pantalla de cambio de password al primer login

Reutilizar componente de Login. Mensaje contextual: "Cambiá tu contraseña antes de continuar".

### 9.3 Botón flotante WhatsApp

- Posición fixed bottom-right
- Icono WhatsApp con glow naranja (`--orange`)
- Tooltip "Contactá a Jennifer"
- Lee `whatsapp_message_template` del taller actual
- Solo visible dentro del portal privado, no en Login

## 10. Requisitos no funcionales

| Categoría | Requisito |
|-----------|-----------|
| Seguridad | VPN obligatoria, password hasheado (argon2/bcrypt), sesiones con expiración, claves de un solo uso |
| Performance | TTI < 2s en catálogo, < 1s navegando secciones del taller |
| Responsive | Mobile-first, breakpoints 360 / 768 / 1024 / 1440 |
| Accesibilidad | Contraste AA, navegación por teclado, foco visible |
| Persistencia | Autosave con debounce 1s en respuestas de ejercicios |
| Backup | Snapshot diario de la base |
| i18n | Español Rioplatense por defecto, arquitectura preparada para inglés en fase 2 |
| Errores | Página de error elegante con isotipo cerebro + link a soporte |

## 11. Criterios de aceptación v1

- [ ] Alumno puede recibir clave por email, conectar VPN, ingresar, cambiar password, desbloquear taller, completar ejercicios con su progreso guardado
- [ ] Jennifer puede crear un taller nuevo desde el panel admin en menos de 30 minutos
- [ ] Jennifer puede generar una clave para un alumno específico en menos de 1 minuto
- [ ] Ningún alumno puede ver contenido de un taller que no desbloqueó (validado con tests de RLS)
- [ ] El portal funciona completo en mobile (360px) sin pérdida de funcionalidad
- [ ] Todos los emails transaccionales se envían con templates branded
- [ ] El botón WhatsApp abre con el mensaje pre-llenado correcto por taller
- [ ] Deploy en staging detrás de VPN con HTTPS válido

## 12. Decisiones cacheadas (no re-preguntar)

| Decisión | Valor |
|----------|-------|
| Pagos | Fuera del sistema, manual por WhatsApp + Bre-B/Bold |
| Claves | Una por taller por alumno, generadas desde el panel admin |
| Landing público | Fuera de v1, se hace después con el sitio general SDIH |
| Backend | Supabase (auth + DB + storage en uno) |
| Branding | Heredado 100% de SDIH, tagline "Inteligencia con alma" |
| Submarca | No — usa identidad SDIH directamente |
| Redes sociales | En footer del sidebar del taller, no en catálogo |
| Modo oscuro | Default (único modo en v1) |
| i18n | Solo español Rioplatense en v1 |
| Tests | Mínimo: RLS por alumno + flujos de acceso. Resto a discreción del dev system |

## 13. Plan SDD sugerido — 8 changes secuenciales

Cada change con su propio PR pequeño (target ~400 líneas).

1. **`auth-and-shell`** — Auth + shell layout + login + cambio de password
2. **`catalog-and-access`** — Catálogo + modal de clave + WorkshopAccess
3. **`workshop-sections`** — Las 5 secciones del taller + sidebar + progreso
4. **`exercises-autosave`** — Tarjetas de ejercicios con autosave
5. **`admin-panel`** — CRUD de talleres + generación de claves
6. **`transactional-emails`** — Templates Resend + envíos
7. **`whatsapp-button`** — Botón flotante + template por taller
8. **`vpn-and-deploy`** — Middleware VPN + deploy en staging

## 14. Modo de ejecución para el orquestador SDD

- **Modo:** Interactive (revisar entre fases)
- **Artifact store:** openspec (file-based, commits trazables)
- **Delivery strategy:** ask-on-risk (preguntar ante PRs grandes)

## 15. Instrucción de arranque

Cuando el repo esté inicializado con Next.js 15 + Tailwind 4 + Supabase, y la carpeta `/design/` esté copiada, decirle al orquestador SDD:

> "Implementá SDIH Talleres v1 siguiendo `docs/brief.md`. Empezá con `sdd-init` y después arrancá con el change 1 (`auth-and-shell`). Modo interactive, openspec, ask-on-risk."

El orquestador toma el control desde ahí.
