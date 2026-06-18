# syntax=docker/dockerfile:1.7

# ─── Stage 1: deps ─────────────────────────────────────────────────────────────
# Instala dependencias en un layer cacheable. Sin código fuente acá: cualquier
# cambio en src/ no invalida este stage.
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# pnpm vía corepack (incluido en Node 22, no necesita pnpm install global).
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

# Copiamos solo los manifests para maximizar el caché de Docker.
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile


# ─── Stage 2: builder ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

# Reusamos los node_modules del stage `deps`.
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Vars públicas (NEXT_PUBLIC_*) horneadas en el bundle de Next.js durante build.
# Las pasamos como build-args desde docker compose (ver docker-compose.yml).
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_WHATSAPP_NUMBER
ARG NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_WHATSAPP_NUMBER=$NEXT_PUBLIC_WHATSAPP_NUMBER
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL

ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build


# ─── Stage 3: runner ───────────────────────────────────────────────────────────
# Imagen final mínima: solo lo necesario para ejecutar `node server.js`.
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Usuario no-root para reducir superficie de ataque.
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# .next/standalone trae el server.js + node_modules acotado.
# .next/static y public/ se copian aparte porque standalone no los incluye.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000

# Healthcheck simple: pega al endpoint público de login.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD wget -qO- http://localhost:3000/auth/login > /dev/null || exit 1

CMD ["node", "server.js"]
