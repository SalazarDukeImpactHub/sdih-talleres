---
tipo: proyecto
estado: activo
prioridad: alta
fecha_inicio: 2026-04-XX
fecha_snapshot: 2026-06-18
area: [[Salazar Duke Impact Hub]]
proyecto: [[Plataforma de Talleres SDIH]]
tags: [proyecto, plataforma, talleres, sdih]
---

# Plataforma de Talleres SDIH — Estado completo al 2026-06-18

> Documento de referencia para el cerebro de Salazar Duke Impact Hub.
> Pensado para retomarse después de tiempo sin perder contexto.
> Snapshot de un sprint largo que arrancó con un MVP deployado y termina con 7 talleres en producción + branding oficial.

---

## 0. Resumen ejecutivo

La plataforma **sdih-talleres** es el portal donde se publican los talleres de Salazar Duke Impact Hub. Funciona como una bóveda autenticada donde cada alumna entra con email + clave de acceso única por taller, navega por las 5 secciones (Inicio, Aprendizaje, Taller con ejercicios, Instalación, Glosario) y completa los ejercicios con autosave.

**Estado actual:** 7 talleres cargados en producción, plataforma desplegada en VPS HostGator con TLS, logo oficial integrado, upload de covers funcionando, infraestructura estable.

**URL pública:** https://talleres.salazardukeimpacthubteam.com

---

## 1. Stack técnico

| Capa | Tecnología | Notas |
|------|-----------|-------|
| **Frontend** | Next.js 16 App Router + React 19 | Server Components + Client islands |
| **Estilos** | Tailwind 4 | Paleta navy/cyan/magenta + tokens semánticos |
| **Auth** | Supabase Auth | Email + password, password_changed flag para forzar cambio inicial |
| **Base de datos** | Supabase Postgres | Sin Prisma — queries directos del SDK |
| **Storage** | Supabase Storage | Bucket `workshops` para covers |
| **Email** | Resend | Envío de claves de acceso |
| **Hosting** | VPS HostGator AlmaLinux 9.7 | IP 69.6.243.113 |
| **Container** | Docker + Docker Compose | Image `sdih-talleres:latest` |
| **Reverse proxy** | Caddy | TLS automático |
| **Package manager** | pnpm (pinned 10.33.0) | `packageManager` en package.json |
| **Node** | 22 alpine | En Dockerfile |
| **Testing** | Playwright (e2e) + Vitest | Tests por feature |

---

## 2. Arquitectura de datos

### Tablas principales

```
workshops               (1 fila por taller)
  ├── id UUID
  ├── slug UNIQUE       ← clave humana, ej "kaia-sistema-operativo-creativo"
  ├── title
  ├── description
  ├── instructor
  ├── date_live (nullable)
  ├── duration_min
  ├── prerequisites
  ├── status            CHECK IN ('disponible','en vivo','próximamente','completado')
  ├── cover_image       URL del Storage
  ├── whatsapp_message_template
  └── created_at

sections                (5 filas por taller — una por tipo)
  ├── id UUID
  ├── workshop_id FK
  ├── type              CHECK IN ('inicio','aprendizaje','taller','instalacion','glosario')
  ├── section_order     1..5
  └── content_json JSONB  ← schema discriminado por type (validado con Zod)

exercises               (N filas por taller — solo asociados a sección 'taller')
  ├── id UUID
  ├── workshop_id FK
  ├── title
  ├── objective
  ├── prompt_text
  └── "order"           reservado — siempre quoted en SQL

glossary_terms          (N filas por taller — solo asociados a sección 'glosario')
  ├── id UUID
  ├── workshop_id FK
  ├── term
  ├── definition
  ├── category          ej "fases", "frentes", "estrategias"
  └── UNIQUE(workshop_id, term)

workshop_access         (1 fila por alumna+taller — clave de acceso canjeada)
  ├── user_id FK
  ├── workshop_id FK
  ├── access_key
  ├── redeemed_at
  ├── expires_at
  └── UNIQUE(user_id, workshop_id)

users                   (managed por Supabase Auth)
  ├── id UUID
  ├── email
  ├── name
  ├── role              'admin' | 'alumno'
  └── password_changed  bool — fuerza cambio en primer login

exercise_progress       (autosave de respuestas)
  ├── exercise_id FK
  ├── user_id FK
  ├── user_response_text
  └── status            'pending' | 'in_progress' | 'done'
```

### Schemas de `content_json` por tipo de sección (Zod)

- **Inicio:** `{type, title, description, quick_links[{label, target_section}], video_url?}`
- **Aprendizaje:** `{type, title, slides[{kicker, title, body, notes}], pdf_url?}`
- **Taller:** `{type, title, instructions, placeholder?, video_url?}`
- **Instalacion:** `{type, title, steps[{order, title, description, code, language}], success_message?, video_url?}`
- **Glosario:** `{type, title, search_placeholder}` ← los términos viven en `glossary_terms`

**Enums importantes:**
- `step.language`: bash, python, javascript, typescript, sql, html, css, json, yaml
- `quick_link.target_section`: aprendizaje, taller, instalacion, glosario (NO inicio)

---

## 3. Talleres cargados en producción

| # | Slug | Título | Slides | Ejercicios | Términos |
|---|------|--------|--------|------------|----------|
| 01 | `engram-memoria-persistente` | Engram — Memoria persistente para tu IA | — | — | — |
| 02 | `gentle-ai-programacion-consciente` | Gentle AI — Programación consciente con IA | — | — | — |
| 03 | `del-sueno-a-la-convocatoria` | Del Sueño a la Convocatoria: cómo nace un negocio con propósito | 31 | 14 | 48 |
| 04 | `sistema-auto-proteccion-mental` | Tu Sistema de Auto-Protección Mental: infraestructura para decidir bien | 16 | 10 | 33 |
| 05 | `cerebro-aumentado-obsidian-claude-engram` | Tu Cerebro Aumentado: vault personal con Obsidian + Claude + Engram | 17 | 12 | 29 |
| 06 | `mapa-recuperacion-depresion` | Tu Mapa Personal de Recuperación de Depresión | 21 | 10 | 33 |
| 07 | `kaia-sistema-operativo-creativo` | KAIA: tu sistema operativo creativo | 19 | 13 | 21 |

### URLs de cada taller

```
https://talleres.salazardukeimpacthubteam.com/taller/{slug}
```

### Archivos seed en el repo

Todos los talleres tienen su archivo SQL versionado en:
```
experiments/sdih-talleres/docs/database/seed-taller-{NN}.sql
```

Cada uno es idempotente — empieza con `DELETE FROM workshops WHERE slug = '...'` y reconstruye todo.

⚠️ **Cuidado:** correr el seed dos veces borra y recrea el workshop. Si ya hay accesos canjeados, el CASCADE los elimina.

---

## 4. Patrón establecido para cargar nuevos talleres

Después de varios intentos, quedó claro que **el editor SQL web de Supabase tiene un límite de pegado que trunca SQL largos**. La solución que quedó:

1. Jennifer escribe el taller en markdown (en su vault de Obsidian)
2. Le pasa el archivo `.md` a Claude
3. Claude genera `seed-taller-{NN}.sql` en `docs/database/` del repo
4. Commit + push al branch activo
5. Jennifer descarga el **raw de GitHub** y pega entero en Supabase SQL Editor
6. Verificación con query estándar:

```sql
SELECT
  w.title,
  (SELECT COUNT(*) FROM sections WHERE workshop_id = w.id) AS secciones,
  (SELECT jsonb_array_length(content_json->'slides') FROM sections WHERE workshop_id = w.id AND type = 'aprendizaje') AS slides,
  (SELECT COUNT(*) FROM exercises WHERE workshop_id = w.id) AS ejercicios,
  (SELECT COUNT(*) FROM glossary_terms WHERE workshop_id = w.id) AS terminos
FROM workshops w WHERE slug = '{slug}';
```

7. Después: INSERT en `workshop_access` para alumna seed + admin

```sql
INSERT INTO workshop_access (user_id, workshop_id, access_key, redeemed_at, expires_at)
SELECT (SELECT id FROM users WHERE email = 'alumna@test.com'), id, '{CLAVE}-2026', now(), now() + interval '90 days'
FROM workshops WHERE slug = '{slug}'
ON CONFLICT (user_id, workshop_id) DO NOTHING;
```

### Convenciones para el contenido de los seeds

- **Tagging SQL:** dollar quoting con tags únicos (`$inicio$`, `$apr$`, `$taller$`, `$inst$`, `$glo$` para secciones; `$ej1$`, `$ej2$`... para ejercicios). Esto evita conflictos con `$$` que el editor web a veces malinterpreta.
- **JSON dentro de dollar quoting:** las comillas dobles del JSON no necesitan escape porque dollar quoting es literal.
- **Markdown dentro del JSON:** se escapa con `\n` para saltos de línea. Las comillas simples van sin escapar.
- **Tablas markdown:** se renderean correctamente con remark-gfm.
- **Bloques de código:** se permiten triple backtick dentro del JSON siempre que estén dentro de la cadena.

---

## 5. Cambios técnicos del sprint (2026-06-XX a 2026-06-18)

### Fixes críticos

| Issue | Fix | Archivo |
|-------|-----|---------|
| Upload de cover fallaba con error "This page couldn't load" | Subir `experimental.serverActions.bodySizeLimit` de 1MB default a 10MB | `next.config.ts` |
| Build de Next.js se trababa en "Collecting page data" en VPS | Agregar 2GB de swap permanente | VPS (`/swapfile` + `/etc/fstab`) |
| pnpm 11 default rompía `ERR_PNPM_IGNORED_BUILDS` (esbuild/sharp) | Pin `"packageManager": "pnpm@10.33.0"` | `package.json` |
| Typecheck OOM en VPS (tsc usa 2-3GB) | `typescript.ignoreBuildErrors: true` + `eslint.ignoreDuringBuilds: true` | `next.config.ts` |
| Editor SQL de Supabase truncaba pegues largos | Generar SQL en archivos del repo, descargar raw, pegar | docs/database/ |
| Markdown con asteriscos y tablas no renderaba | Crear componente `Markdown` con react-markdown + remark-gfm | `components/workshop/Markdown.tsx` |
| Íconos genéricos (emojis) en secciones | Crear componente `SectionIcon` con SVG outline (cyan) | `components/workshop/SectionIcon.tsx` |
| Logos de redes genéricos | Embed SVG oficial de IG/LinkedIn/TikTok/YouTube | `components/workshop/SocialFooter.tsx` |
| Sin video opcional por sección | Crear `VideoEmbed` (YouTube watch/embed/shorts → iframe responsive) | `components/workshop/VideoEmbed.tsx` |

### Features agregadas

- **Video opcional por sección**: campos `video_url` opcionales en schemas de Inicio, Aprendizaje (via slide), Taller, Instalación. Si no está definido, no aparece el video.
- **Markdown render unificado** en descripciones de Inicio, body de slides, instrucciones del Taller, descripciones de pasos de Instalación. NO se aplica al `prompt_text` de ejercicios (queda como `<pre>` literal para que la alumna pueda copiarlo tal cual).
- **Branding oficial** integrado en TopBar, AdminSidebar, LoginForm y favicon. Carpeta `public/branding/` con 8 variantes del logo + lockup + main.jpg.
- **Reportes** estructura `docs/reportes/` para documentar estado del proyecto (este archivo).

### Branding integrado

Archivos en `public/branding/`:
- `logo-brain.png` — isotipo cerebro neon sobre fondo navy (default)
- `logo-brain-navy.png` — alternativa con menos saturación
- `logo-brain-flat-navy.png` — cerebro sólido en color navy (para fondos claros)
- `logo-brain-flat-white.png` — cerebro sólido en blanco (para fondos oscuros)
- `logo-brain-outline-navy.png` / `logo-brain-outline-white.png` — outlines
- `logo-brain-white.png` — versión clara
- `logo-lockup.png` — cerebro + texto "SALAZAR DUKE IMPACT HUB" (usado en login)
- `logo-main.jpg` — versión principal alta resolución

Implementación:
- **TopBar** ([src/components/shell/TopBar.tsx](experiments/sdih-talleres/src/components/shell/TopBar.tsx)): isotipo 40×40 + texto "SALAZAR DUKE · Impact Hub"
- **AdminSidebar** ([src/components/admin/AdminSidebar.tsx](experiments/sdih-talleres/src/components/admin/AdminSidebar.tsx)): isotipo 40×40 + "SALAZAR DUKE / Panel Admin"
- **LoginForm** ([src/components/auth/LoginForm.tsx](experiments/sdih-talleres/src/components/auth/LoginForm.tsx)): lockup completo 128-144px arriba del form
- **Favicon** (`src/app/icon.png`): isotipo cerebro (lo detecta Next.js automáticamente)

Detalle técnico: los PNG tienen un frame gris exterior que no se ve bien sobre cualquier fondo. Solución → wrapper `overflow-hidden rounded-md` + `<Image>` con `object-cover scale-[1.35]` para que el frame quede cortado bajo el borde redondeado.

---

## 6. Infraestructura de producción

### VPS

| Campo | Valor |
|-------|-------|
| Proveedor | HostGator |
| Sistema | AlmaLinux 9.7 |
| IP pública | 69.6.243.113 |
| Puerto SSH | 22 |
| Acceso | Solo key (password disabled) |
| RAM | 1.7 GB |
| Swap | 2 GB (permanente, en `/swapfile`) |
| Path del proyecto | `/opt/sdih-talleres` |
| Container | `sdih-app` (de imagen `sdih-talleres:latest`) |
| Puerto interno | `127.0.0.1:3001:3000` |
| Reverse proxy | Caddy en host (NO en docker) |
| TLS | Automático via Caddy |

### Caddyfile (en host, NO en repo)

```
talleres.salazardukeimpacthubteam.com {
  reverse_proxy localhost:3001
}
```

### Comandos clave de deploy

```bash
# SSH al VPS
ssh root@69.6.243.113

# Deploy estándar
cd /opt/sdih-talleres
git pull origin master
docker compose build app && docker compose up -d
docker compose logs -f app  # Ctrl+C cuando veas "Ready in Xs"
```

### Variables de entorno (`/opt/sdih-talleres/.env.production` en VPS, NO en repo)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` ← nunca exponer al cliente
- `RESEND_API_KEY` ← **rotar — fue expuesta en captura anterior**
- `NEXT_PUBLIC_APP_URL`
- `ADMIN_EMAILS` (lista de emails con role admin)

---

## 7. URLs y accesos

| Recurso | URL |
|---------|-----|
| App producción | https://talleres.salazardukeimpacthubteam.com |
| Panel admin | https://talleres.salazardukeimpacthubteam.com/admin/talleres |
| Login | https://talleres.salazardukeimpacthubteam.com/auth/login |
| Repo GitHub | https://github.com/SalazarDukeImpactHub/sdih-talleres |
| Branch deploy | `master` |
| Branch desarrollo activa | `feat/video-embed-all-sections` |
| Supabase Dashboard | https://supabase.com/dashboard |

### Usuarios principales

- **Admin (Jennifer):** `salazardukeimpacthub@gmail.com` — role admin
- **Seed alumna (testing):** `alumna@test.com` — role alumno, password_changed=false en algunas instancias

---

## 8. Decisiones técnicas importantes (ADRs implícitos)

### D-4 — Sections como tabla separada con content_json JSONB
Cada workshop tiene 5 secciones, una por tipo. El contenido de cada sección vive en `content_json` validado con Zod (discriminated union por `type`). Esto permite agregar campos opcionales sin migraciones (ej: `video_url`).

### D-6 — TallerSection como Client Component
Maneja estado local de respuestas + autosave. Las otras secciones son Server Components.

### D-9 — Code blocks en Instalación con language enum
Cada `step` tiene `language` (enum) y se renderea con monospace + botón copiar. Sin syntax highlighting real (es overkill para los casos actuales).

### D-15 — Workshop metadata mínima + relaciones explícitas
La tabla `workshops` solo tiene metadata. Las secciones, ejercicios y glosario son tablas separadas con FK. Permite cargar contenido sin tocar la metadata.

### Decisiones no escritas que quedaron como convención

- **Markdown como source of truth** del contenido — no hay editor WYSIWYG en admin. Las secciones se cargan via SQL.
- **SQL versionado en `docs/database/`** — todos los seed permanecen en el repo para reproducibilidad.
- **Sin DO blocks complejos en seeds** — usar INSERT directos con `SELECT id FROM workshops WHERE slug = '...'`. Es menos elegante pero el editor de Supabase lo digiere mejor.
- **Dollar quoting con tags únicos** por sección/ejercicio — evita colisiones con `$$`.
- **Idempotencia con DELETE inicial** — cada seed empieza con `DELETE FROM workshops WHERE slug = '...'` para permitir re-correr sin estado parcial.

---

## 9. Pendientes y próximos pasos

### Contenido (depende de Jennifer)

- [ ] **Revisar y mejorar contenido** de los 7 talleres cargados (Jennifer va a iterar con calma)
- [ ] **Talleres 08+**: cuando tenga el markdown listo, mismo patrón
- [ ] **Videos explicativos** por sección (cuando se graben → completar campos `video_url` con UPDATE)
- [ ] **Covers reales** para cada taller (3 talleres ya tienen, faltan 4)
- [ ] **PDF descargable** opcional por sección de Aprendizaje (campo `pdf_url`)

### Técnico (cuando haya tiempo)

- [ ] **Rotar RESEND_API_KEY** (la actual fue expuesta en captura — alta prioridad)
- [ ] **Editor visual** en admin para crear/editar secciones y ejercicios (post-MVP, evitaría depender del SQL para cada cambio)
- [ ] **Fail2ban** en VPS para protección contra brute-force SSH
- [ ] **dnf-automatic** auto-updates de seguridad
- [ ] **Security headers** en Caddyfile (HSTS, CSP, X-Frame-Options)
- [ ] **2FA** en cuentas críticas (GitHub, Supabase, Resend, HostGator)
- [ ] **Backup mensual** de `.env.production` y dump de Supabase
- [ ] **Favicon mejorado** — el cerebro actual queda algo ampliado en la pestaña (regenerar PNG con padding)
- [ ] **Mergear branch** `feat/video-embed-all-sections` a `master` (acumula los talleres 03-07 + logo + fixes)

### Pendientes operativos

- [ ] Si Jennifer va a vender los talleres: integrar pasarela de pago (MercadoPago / Stripe / WompiCO según país)
- [ ] Sistema de generación masiva de claves de acceso (1 por compra)
- [ ] Email automático al canjear acceso (Resend ya está conectado, falta el flow)

---

## 10. Aprendizajes no obvios del sprint

1. **El editor SQL de Supabase web trunca pastes largos.** Por eso quedó el patrón de archivos en repo + raw.
2. **El default de 1MB de Next.js Server Actions** bloquea uploads de imagen reales. Subir a 10MB.
3. **VPS con 1.7GB de RAM** sin swap traba Next.js en "Collecting page data". 2GB de swap es regalo permanente.
4. **pnpm corepack default a v11** rompe builds con esbuild/sharp. Pinear a v10.33.0.
5. **DELETE FROM workshops es CASCADE** — borra secciones, ejercicios, glosario, accesos. Cuidado con re-ejecutar seeds sin querer.
6. **Markdown rendering necesita remark-gfm** para tablas. react-markdown solo no las soporta.
7. **Los PNG con frame exterior** sobre fondos arbitrarios necesitan `overflow-hidden + scale > 1` para verse bien en contenedores redondeados.

---

## 11. Comandos útiles cheatsheet

### Local

```bash
# Working directory
cd C:\Users\jsala\trazzos-dev-system\experiments\sdih-talleres

# Dev server
pnpm dev

# Build local
pnpm build

# Tests
pnpm test
pnpm test:e2e

# Git
git status
git log --oneline -5
git push origin feat/video-embed-all-sections
```

### Supabase (queries de mantenimiento)

```sql
-- Listar todos los talleres con contadores
SELECT
  w.slug,
  w.title,
  w.status,
  (SELECT COUNT(*) FROM sections WHERE workshop_id = w.id) AS sec,
  (SELECT COUNT(*) FROM exercises WHERE workshop_id = w.id) AS ej,
  (SELECT COUNT(*) FROM glossary_terms WHERE workshop_id = w.id) AS terms
FROM workshops w
ORDER BY w.created_at;

-- Ver accesos canjeados
SELECT u.email, w.title, wa.redeemed_at, wa.expires_at
FROM workshop_access wa
JOIN users u ON u.id = wa.user_id
JOIN workshops w ON w.id = wa.workshop_id
ORDER BY wa.redeemed_at DESC;

-- Borrar un workshop completo (CASCADE limpia todo)
DELETE FROM workshops WHERE slug = '{slug}';

-- Dar acceso a un usuario
INSERT INTO workshop_access (user_id, workshop_id, access_key, redeemed_at, expires_at)
SELECT (SELECT id FROM users WHERE email = '{email}'), id, '{CLAVE}', now(), now() + interval '365 days'
FROM workshops WHERE slug = '{slug}'
ON CONFLICT (user_id, workshop_id) DO NOTHING;
```

### VPS

```bash
# SSH
ssh root@69.6.243.113

# Estado del container
docker compose ps
docker compose logs -f app

# Restart sin rebuild
docker compose restart app

# Rebuild + redeploy
cd /opt/sdih-talleres
git pull origin master
docker compose build app && docker compose up -d

# Recursos del VPS
free -h          # RAM y swap
df -h            # Disco
docker system df # Espacio Docker
```

---

## 12. Estructura de archivos relevante

```
experiments/sdih-talleres/
├── docs/
│   ├── database/
│   │   ├── seed-taller-03.sql
│   │   ├── seed-taller-04.sql
│   │   ├── seed-taller-05.sql
│   │   ├── seed-taller-06.sql
│   │   ├── seed-taller-07.sql
│   │   ├── seed-workshops.sql       (legacy)
│   │   ├── manual-seed.sql          (alumna seed)
│   │   └── setup.md
│   ├── reportes/
│   │   └── 2026-06-18-estado-plataforma-talleres.md  ← ESTE archivo
│   ├── brief.md
│   ├── deploy.md
│   └── ...
├── public/
│   └── branding/
│       ├── logo-brain.png
│       ├── logo-lockup.png
│       └── ... (variantes)
├── src/
│   ├── app/
│   │   ├── icon.png                 ← favicon (next.js detect)
│   │   ├── page.tsx                 (redirect según auth)
│   │   ├── (auth)/auth/login/
│   │   ├── (authenticated)/
│   │   │   ├── catalogo/
│   │   │   └── taller/[slug]/
│   │   └── admin/
│   │       └── talleres/
│   ├── components/
│   │   ├── shell/TopBar.tsx         ← logo + nav
│   │   ├── admin/
│   │   │   ├── AdminSidebar.tsx     ← logo admin
│   │   │   ├── WorkshopForm.tsx
│   │   │   └── CoverUpload.tsx
│   │   ├── auth/LoginForm.tsx       ← logo login
│   │   ├── catalog/WorkshopCard.tsx
│   │   └── workshop/
│   │       ├── sections/
│   │       │   ├── InicioSection.tsx
│   │       │   ├── AprendizajeSection.tsx
│   │       │   ├── TallerSection.tsx
│   │       │   ├── InstalacionSection.tsx
│   │       │   └── GlosarioSection.tsx
│   │       ├── Markdown.tsx         ← render con remark-gfm
│   │       ├── VideoEmbed.tsx       ← YouTube embed responsive
│   │       ├── SectionIcon.tsx      ← SVG outline icons
│   │       ├── Sidebar.tsx
│   │       └── SocialFooter.tsx     ← SVG oficiales IG/LI/TT/YT
│   └── lib/
│       └── schemas/
│           ├── section-content.ts   ← Zod discriminated union
│           ├── workshop.ts
│           └── exercise.ts
├── Dockerfile                       (multi-stage Node 22 alpine)
├── docker-compose.yml               (1 service: app)
├── next.config.ts                   (bodySizeLimit 10MB + ignoreBuildErrors)
└── package.json                     (packageManager: pnpm@10.33.0)
```

---

## 13. Cómo retomar este proyecto en el futuro

Si volvés a este proyecto después de 2 semanas o más:

1. **Leé este documento entero** (15 min)
2. **Pulleá el repo** y verificá branch:
   ```bash
   cd experiments/sdih-talleres
   git fetch
   git status
   git log --oneline -10
   ```
3. **Si la rama activa cambió:** ver últimos commits para entender qué se hizo
4. **Verificá producción:** entrá a https://talleres.salazardukeimpacthubteam.com y andá a `/admin/talleres` con tu cuenta admin
5. **Si vas a cargar un taller nuevo:** seguí el patrón de la sección 4 (markdown → seed-taller-NN.sql → push → raw → Supabase)
6. **Si vas a tocar UI:** levantá `pnpm dev` y probá local antes de pushear
7. **Si vas a deployar:** sección 6 — SSH + `git pull` + `docker compose build && up -d`

### Si encontrás algo roto en producción

- **Build OOM:** revisar swap activo con `free -h` en VPS — debería tener `Swap: 2.0Gi`
- **Cover no sube:** verificar que `next.config.ts` tenga `serverActions.bodySizeLimit: "10mb"`
- **Workshop no carga:** ver `docker compose logs -f app` para ver el error real
- **SQL editor corta:** usar archivos del repo + raw, no pegar SQL grande directamente

---

## 14. Contactos y propietarios

| Recurso | Cuenta / responsable |
|---------|---------------------|
| GitHub repo | SalazarDukeImpactHub (org) |
| Dominio | HostGator |
| VPS | HostGator (root: jsala) |
| Supabase | Cuenta personal Jennifer |
| Resend | Cuenta personal Jennifer |
| Branding original | Jennifer (assets en `Downloads/Salazar Duke Impact Hub/assets/`) |
| Contenido de talleres | Jennifer (vault Obsidian en `OneDrive/.../Talleres/`) |

---

## 15. Métrica de cierre del sprint

**Lo que se entregó entre 2026-06-XX y 2026-06-18:**

- ✅ Plataforma deployada en VPS con TLS
- ✅ Admin funcional para crear talleres (metadata)
- ✅ Carga de contenido via SQL (5 talleres nuevos: 03, 04, 05, 06, 07)
- ✅ Logo oficial integrado en TopBar, Sidebar, Login, favicon
- ✅ Upload de covers funcionando (bodySizeLimit fix)
- ✅ Build estable en VPS (swap fix)
- ✅ Markdown rendering completo (tablas, código, citas)
- ✅ Video embed opcional por sección
- ✅ Patrón establecido para cargar talleres (archivo en repo → raw → Supabase)
- ✅ Documentación del estado en este reporte

**Lo que queda fuera del sprint pero está identificado:**

- Mejoras de contenido (Jennifer iterará con calma)
- Más talleres por cargar (08+)
- Editor visual de contenido en admin
- Pasarela de pago + flow comercial
- Hardening de seguridad del VPS

---

> **Nota final:** este documento es un snapshot vivo. Si algo cambia significativamente — nuevo taller, nueva feature, cambio de stack — actualizá este archivo o creá uno nuevo en `docs/reportes/{fecha}-{tema}.md`.
