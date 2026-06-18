# Design — slice 8b: docker-deploy

## Decisiones

### D-1: Next.js `output: "standalone"`

**Decisión**: agregar `output: "standalone"` al `next.config.ts`.

**Por qué**: Sin standalone, la imagen Docker necesita `node_modules` completo (~600MB). Con standalone, Next.js produce `.next/standalone/server.js` + node_modules acotado (~150MB total). Reduce el tamaño 4x y acelera deploys.

**Alternativas rechazadas**: bundle todo con Vercel deployment — descartado, Jennifer ya tiene VPS.

### D-2: Dockerfile multi-stage (deps → builder → runner)

```
Stage 1 (deps)    : pnpm install --frozen-lockfile    → cacheable
Stage 2 (builder) : pnpm build → .next/standalone     → reusable
Stage 3 (runner)  : copia solo standalone + static + public → final image
```

**Por qué**: cualquier cambio en `src/` invalida solo el stage `builder`, no `deps`. Re-builds son 10-15x más rápidos.

### D-3: Node 22 alpine + usuario no-root

- **Base**: `node:22-alpine` (Node 22 LTS + Alpine = ~50MB base vs ~150MB de Debian slim)
- **Usuario**: `nextjs:nodejs` (UID/GID 1001) — reduce superficie de ataque

### D-4: Caddy 2 como reverse proxy con TLS automático

**Decisión**: Caddy 2 alpine. Maneja Let's Encrypt sin intervención.

**Por qué Caddy y no Nginx**:
- Caddy: 1 archivo de config (`Caddyfile`), TLS automático sin configurar ACME manualmente, renovación automática
- Nginx: requiere `certbot` separado, cron jobs, más config

Para una app sola, Caddy es estricamente menos código de operar.

**Alternativas consideradas**: Traefik (más complejo, sobrante para 1 app), nginx + certbot (más config).

### D-5: Red interna `web` + Caddy expone solo 80/443

App escucha en 3000 pero **NO se publica** al host (solo `expose: 3000` en compose). Solo Caddy puede llegar a app:3000 a través de la red interna `web`. Esto cierra cualquier path directo a la app sin pasar por TLS + headers de seguridad.

### D-6: Volúmenes persistentes para Caddy

- `caddy_data` → `/data` (certificados + estado ACME) — **CRÍTICO**: si se borra, Caddy pide nuevos certificados (rate limit risk)
- `caddy_config` → `/config` (estado runtime) — regenerable, no crítico

### D-7: `env_file: .env.production` para variables runtime + `build args` para `NEXT_PUBLIC_*`

**Por qué distintos**:
- `NEXT_PUBLIC_*` se hornean en el bundle JS del cliente durante `next build`. Tienen que estar en build args.
- Variables server-side (`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`) se leen en runtime. Pueden estar en `env_file`.

Trade-off: cambiar `NEXT_PUBLIC_*` requiere `docker compose up -d --build` (rebuild). Documentado.

### D-8: Healthcheck simple en el container

`wget -qO- http://localhost:3000/auth/login`. Si la app no responde en 5s, Docker la marca unhealthy y la restartea (`restart: unless-stopped`).

### D-9: Script de deploy con SSH interactivo (sin sshpass)

`scripts/deploy.sh` usa `ssh -p 22022 root@69.6.243.113 bash -se <<EOF` que pide password interactivo. Una sola conexión, todo el deploy adentro.

**Por qué no `sshpass`**: requeriría instalar herramienta extra Y guardar password en variable de entorno. Más friction y peor seguridad que SSH key (la solución recomendada en docs).

### D-10: Script de bootstrap del VPS

`scripts/server-setup.sh`. **Idempotente**: chequea Docker, abre firewall, clona repo si no está, crea `.env.production` placeholder si no existe.

### D-11: `.env.production` se crea en el VPS, NO se commitea

Está en `.gitignore`. El script genera placeholder; Jennifer pega los valores reales con `nano` directo en el VPS. **Single source of truth de secrets en producción**: el archivo del VPS.

### D-12: Headers de seguridad estándar en Caddy

- `Strict-Transport-Security: max-age=31536000; includeSubDomains` — fuerza HTTPS por 1 año
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY` — evita iframe embedding
- `Referrer-Policy: strict-origin-when-cross-origin`
- `-Server` — oculta versión del servidor

### D-13: `www.<dominio>` redirige al apex

`www.salazardukeimpacthubteam.com` → 301 → `salazardukeimpacthubteam.com`. Single canonical URL.

## Trade-offs

- **Deploy manual vs CI/CD**: GitHub Actions habilitaría auto-deploy en push a master pero agrega complejidad (secrets en GitHub, webhook al VPS, etc). Para 1 dev + cadencia baja, `./scripts/deploy.sh` es suficiente. v1.1.
- **Sin observability**: stack de Prometheus + Grafana + Loki sería deseable pero no crítico para v1. Logs de Caddy y app van a stdout, accesibles con `docker compose logs`. v1.1.
- **Caddy en mismo VPS que app**: comparten recursos. Si el sitio crece, separar Caddy en otro VPS o usar CDN delante.
- **`output: standalone` rompe API routes que dependen de archivos no enlistados**: en este proyecto solo hay Server Actions + páginas, ningún API route especial. Validable con build local.

## Test plan

- [x] `pnpm build` localmente confirma que `output: standalone` no rompe nada
- [ ] `docker build .` localmente produce imagen sin errores (validar en `docker images` que pesa <250MB)
- [ ] `docker compose config` parsea sin errores
- [ ] `scripts/server-setup.sh` corrido en el VPS levanta firewall + repo + placeholder env
- [ ] `docker compose up -d --build` en el VPS pone los 2 services Up
- [ ] `curl -I https://salazardukeimpacthubteam.com` devuelve 200 con TLS válido
- [ ] Login del alumno en producción funciona end-to-end (smoke test manual)
- [ ] `./scripts/deploy.sh` desde local hace pull + rebuild + restart sin errores

Los últimos 4 ítems requieren el VPS — quedan para que Jennifer los ejecute después del merge.
