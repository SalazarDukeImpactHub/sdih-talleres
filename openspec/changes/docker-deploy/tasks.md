# Tasks — slice 8b: docker-deploy

## Pre-apply

- [x] Branch `change/docker-deploy` creada desde master
- [x] PR #14 (slice 8a middleware→proxy) ya en master
- [x] Datos del VPS confirmados con Jennifer (HostGator AlmaLinux 9.7, IP 69.6.243.113, puerto SSH 22022, password, Docker instalado, dominio apuntado)

## T-8b.1 — Next.js standalone output
- [x] `next.config.ts` con `output: "standalone"`
- [x] Verificar que `pnpm build` produce `.next/standalone/server.js`

## T-8b.2 — Dockerfile multi-stage
- [x] Stage `deps`: Node 22 alpine + pnpm (corepack) + `pnpm install --frozen-lockfile`
- [x] Stage `builder`: copia código + ARGs para `NEXT_PUBLIC_*` + `pnpm build`
- [x] Stage `runner`: usuario `nextjs:1001` no-root, copia `.next/standalone` + `.next/static` + `public`, expone `:3000`, healthcheck con `wget` a `/auth/login`
- [x] CMD final: `node server.js`

## T-8b.3 — .dockerignore
- [x] Excluir `.next`, `node_modules`, `.git`, `.env*`, `tests`, `playwright-report`, `openspec`, `docs`, `scripts/*.sh`, logs

## T-8b.4 — docker-compose.yml
- [x] Servicio `app`: build + env_file + expose 3000 + restart unless-stopped + red `web`
- [x] Servicio `caddy`: image `caddy:2-alpine` + ports 80/443 (tcp+udp) + Caddyfile mount + volumes persistentes
- [x] Variables `DOMAIN` + `ACME_EMAIL` consumidas en Caddyfile
- [x] Red interna `web` aísla app del host

## T-8b.5 — Caddyfile
- [x] Global block con `email {$ACME_EMAIL}` para Let's Encrypt
- [x] Server `{$DOMAIN}` con `reverse_proxy app:3000`
- [x] Headers de seguridad: HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, oculta Server
- [x] `encode zstd gzip`
- [x] Logs JSON a stdout
- [x] `www.{$DOMAIN}` → 301 → apex

## T-8b.6 — scripts/server-setup.sh
- [x] Verificar Docker + Docker Compose plugin instalados
- [x] `firewall-cmd --add-service=http/https --permanent + reload`
- [x] Clonar repo en `/opt/sdih-talleres` si no está; sino `git pull`
- [x] Generar `.env.production` placeholder si no existe (con valores cargados de change 5/6/7) + `chmod 600`
- [x] Mensajes claros de "próximos pasos"
- [x] Idempotente

## T-8b.7 — scripts/deploy.sh
- [x] Variables overridable: `VPS_HOST`, `VPS_PORT`, `VPS_USER`, `REMOTE_PATH`, `BRANCH`
- [x] Defaults: 69.6.243.113, 22022, root, /opt/sdih-talleres, master
- [x] Una sola conexión SSH ejecuta: git fetch + checkout + pull + docker compose build + up -d + image prune + ps
- [x] Mensaje final con la URL y comando de logs

## T-8b.8 — docs/deploy.md
- [x] Resumen del stack (tabla)
- [x] Setup inicial: DNS + bootstrap + .env.production + primer start
- [x] Deploy de actualizaciones (./scripts/deploy.sh)
- [x] Migración recomendada de password → SSH key
- [x] Operación: ver logs, restart, stop/start, prune
- [x] Troubleshooting: sitio no carga, TLS failure, app 500, env var no se ve, disco lleno
- [x] Backup (qué persiste, qué es regenerable)
- [x] Seguridad (checklist)

## T-8b.9 — Validación local
- [ ] `pnpm build` con `output: standalone` produce `.next/standalone/server.js`
- [ ] `docker build -t sdih-talleres .` produce imagen sin errores
- [ ] `docker compose config` parsea sin errores
- [ ] Imagen final pesa <250MB (`docker images`)

## T-8b.10 — Commit + PR
- [ ] Commit con scope claro: Dockerfile + compose + Caddy + scripts + docs
- [ ] Push branch
- [ ] PR body con resumen + pasos siguientes para Jennifer

## Validación post-merge (Jennifer en el VPS)

- [ ] `./scripts/server-setup.sh` corre OK en el VPS
- [ ] `.env.production` completado con valores reales
- [ ] `docker compose up -d --build` arranca los 2 containers
- [ ] Caddy obtiene certificado Let's Encrypt
- [ ] `curl -I https://salazardukeimpacthubteam.com` devuelve 200
- [ ] Login del alumno funciona en producción
- [ ] Admin puede crear alumno + se manda email vía Resend
- [ ] Botón WhatsApp aparece con el número configurado

## Review Workload Forecast

| Métrica | Valor |
|---------|-------|
| LOC estimado | ~400 (Dockerfile + compose + Caddyfile + 2 scripts + docs) |
| Chained PRs | No (slice único, 8b es el último del change 8) |
| Decision needed before apply | No |
| E2E impact | No agrega specs (deploy no es testable desde Playwright) |
| Pre-apply blockers | Confirmar datos del VPS (resuelto) |
