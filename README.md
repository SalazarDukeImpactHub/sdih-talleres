<div align="center">

<img src="public/branding/logo-lockup.png" alt="Salazar Duke Impact Hub" width="180" />

# SDIH Talleres

### Portal de talleres de Salazar Duke Impact Hub

*Inteligencia con alma* — una plataforma donde el conocimiento se vende, se aprende y se practica.

<br />

![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-149ECA?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Deploy](https://img.shields.io/badge/Deploy-VPS%20%2B%20Docker%20%2B%20Caddy-2496ED?style=for-the-badge&logo=docker&logoColor=white)

**🌐 [talleres.salazardukeimpacthubteam.com](https://talleres.salazardukeimpacthubteam.com)**

</div>

---

## ✨ Qué es

Una plataforma completa de punta a punta para **publicar, vender y dictar talleres online**. Desde que una persona desconocida ve la vitrina pública, hasta que hace los ejercicios interactivos de un taller que compró — todo en un solo lugar, con su propia identidad de marca.

> 9 talleres en producción · vitrina pública · autoregistro · claves de acceso · autosave de ejercicios · panel admin completo.

---

## 🎯 Cómo funciona

```mermaid
flowchart TD
    A([Visitante]) --> B[🌐 Vitrina pública<br/>ve los talleres sin login]
    B --> C{¿Le interesa?}
    C -->|Sí| D[💬 Compra por WhatsApp]
    D --> E[📝 Se registra sola]
    E --> F[🔑 Recibe su clave<br/>y la canjea]
    F --> G[📚 Taller desbloqueado]
    G --> H[Inicio · Aprendizaje · Taller<br/>Instalación · Glosario]
    H --> I[✍️ Hace ejercicios<br/>se guardan solos]

    style B fill:#0B1220,stroke:#19C6E6,color:#E8EDF6
    style G fill:#0B1220,stroke:#A3E635,color:#E8EDF6
    style H fill:#0B1220,stroke:#D946EF,color:#E8EDF6
```

**Del lado admin** (Jennifer): crea talleres, sube portadas, asigna claves a alumnas y ve todo desde un panel dedicado.

---

## 🧩 Features

| | |
|---|---|
| 🌐 **Vitrina pública** | Cualquiera ve los talleres (portada, precio, categoría) sin login |
| 📝 **Autoregistro** | Las alumnas crean su cuenta solas |
| 🔑 **Claves de acceso** | Sistema de canje con hash SHA-256; panel admin para asignarlas |
| 📚 **5 secciones por taller** | Inicio · Aprendizaje (slides) · Taller (ejercicios) · Instalación · Glosario |
| ✍️ **Autosave** | Las respuestas de los ejercicios se guardan solas con reintentos |
| 🎨 **Contenido rico** | Markdown con tablas, código copiable, videos de YouTube embebidos |
| 🗂️ **Categorías + filtros** | Chips dinámicos en catálogo y vitrina |
| 🛡️ **Seguridad auditada** | RLS en todas las tablas, security headers, contenido pago protegido a nivel DB |
| 📊 **Panel admin** | Talleres, alumnas, claves — todo con navegación fluida |

---

## 🏗️ Arquitectura

```mermaid
flowchart LR
    subgraph Cliente
        V[Vitrina pública]
        C[Catálogo]
        T[Taller]
        AD[Panel Admin]
    end

    subgraph "Next.js 16 · App Router"
        SC[Server Components]
        SA[Server Actions]
        PX[Proxy / middleware]
    end

    subgraph "Supabase"
        AU[Auth]
        DB[(Postgres + RLS)]
        ST[Storage · covers]
    end

    RE[Resend · emails]

    V & C & T & AD --> SC
    SC --> SA
    SA --> AU
    SA --> DB
    SA --> ST
    SA --> RE
    PX -.protege rutas.-> SC

    style DB fill:#0B1220,stroke:#3FCF8E,color:#E8EDF6
    style SA fill:#0B1220,stroke:#19C6E6,color:#E8EDF6
```

**Stack:** Next.js 16 (App Router, RSC) · React 19 · TypeScript strict · Tailwind 4 · Supabase (Auth + Postgres + Storage) · Resend · Docker + Caddy sobre VPS.

---

## 🗃️ Modelo de datos

```mermaid
erDiagram
    workshops ||--o{ sections : tiene
    workshops ||--o{ exercises : tiene
    workshops ||--o{ glossary_terms : tiene
    workshops ||--o{ workshop_access : "acceso por"
    users ||--o{ workshop_access : "canjea"
    users ||--o{ exercise_progress : "responde"
    exercises ||--o{ exercise_progress : "de"

    workshops {
        uuid id
        text slug "inmutable"
        text title
        text category
        text price_display
        text status
    }
    workshop_access {
        text access_key_hash "SHA-256"
        timestamptz redeemed_at
        timestamptz expires_at
    }
    users {
        text email
        text role "alumno|admin"
    }
```

> **RLS everywhere:** el contenido de cada taller (secciones, ejercicios, glosario) solo es visible si la alumna **canjeó** su acceso — se valida en la base de datos, no solo en la interfaz.

---

## 🚀 Desarrollo

```bash
# Requisitos: Node 22, pnpm 10.33
pnpm install
pnpm dev            # http://localhost:3000

pnpm build          # build de producción
pnpm test           # unit (Vitest)
pnpm test:e2e       # end-to-end (Playwright)
```

Variables de entorno (ver `.env.local.example`):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # server-only, nunca al cliente
RESEND_API_KEY=
NEXT_PUBLIC_WHATSAPP_NUMBER=
```

---

## 📦 Deploy

Corre en un **VPS con Docker + Caddy** (TLS y security headers automáticos):

```bash
ssh root@<vps>
cd /opt/sdih-talleres
git pull
docker compose build app && docker compose up -d
```

Las migraciones de base de datos viven en `supabase/migrations/` y se aplican manualmente en el SQL Editor de Supabase.

---

## 📂 Estructura

```
src/
├── app/
│   ├── page.tsx              → vitrina pública / router de sesión
│   ├── (auth)/               → login · registro · cambio de clave
│   ├── (authenticated)/      → catálogo · taller/[slug]
│   └── admin/                → talleres · claves · alumnas
├── components/
│   ├── catalog/              → Vitrina · CatalogView · WorkshopCard
│   ├── auth/ · admin/ · shell/
│   └── workshop/             → secciones · Markdown · ExerciseCard · VideoEmbed
└── lib/
    ├── auth/ · crypto/ · supabase/ · email/ · schemas/
docs/database/                → seeds de los 9 talleres (SQL)
supabase/migrations/          → 11 migraciones
```

---

## 🛡️ Seguridad

Auditado con lente OWASP antes de abrir a alumnas reales:

- ✅ **RLS** habilitado en las 8 tablas; contenido pago gated a nivel DB
- ✅ Claves con **hash SHA-256** + comparación timing-safe; nunca en texto plano
- ✅ **Security headers** (CSP, HSTS, X-Frame-Options) en Caddy
- ✅ `service_role` marcado `server-only` — imposible filtrarlo al bundle
- ✅ Uploads validados por **magic bytes**, no por MIME declarado

---

<div align="center">

**Salazar Duke Impact Hub** · Hecho con 🧠 e *inteligencia con alma*

</div>
