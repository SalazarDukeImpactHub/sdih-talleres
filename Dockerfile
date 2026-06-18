# syntax=docker/dockerfile:1.7

# ─── Stage 1: deps ─────────────────────────────────────────────────────────────
# Instala dependencias en un layer cacheable. Sin código fuente acá: cualquier
# cambio en src/ no invalida este stage.
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# pnpm vía corepack (incluido en Node 22). El campo "packageManager" del
# package.json le dice a corepack qué versión de pnpm activar.
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

# Copiamos solo los manifests para maximizar el caché de Docker.
COPY package.json pnpm-lock.yaml ./
# --frozen-lockfile garantiza que el lockfile no se mueva.
# --config.confirmModulesPurge=false evita prompts interactivos.
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

# .env.production se copia al build context (NO al image final) para que
# Next.js lo lea automáticamente durante `next build` y hornee las
# NEXT_PUBLIC_* en el bundle del cliente. Las server-side vars se inyectan
# en runtime via env_file del docker-compose.yml.
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build


# ─── Stage 3: runner ───────────────────────────────────────────────────────────
# Imagen final mínima: solo lo necesario para ejecutar `node server.js`.
# NO incluye .env.production — secrets se inyectan en runtime via env_file.
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
