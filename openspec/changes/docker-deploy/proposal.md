# Proposal — slice 8b: docker-deploy

## Intent

Empaquetar el portal de SDIH Talleres como imagen Docker y desplegarlo en el VPS HostGator AlmaLinux 9.7 detrás de Caddy con TLS automático de Let's Encrypt. Habilita que cualquier merge a master se despliegue en producción con un comando (`./scripts/deploy.sh`). Cumple §11 del brief (operación con costo mínimo y mantenimiento autónomo).

## Scope

**Dentro**:
- `next.config.ts` — habilitar `output: "standalone"` para imágenes Docker chicas
- `Dockerfile` multi-stage (deps → builder → runner) con Node 22 alpine, usuario no-root, healthcheck
- `.dockerignore` — excluir `node_modules`, `.next`, tests, OpenSpec, env files, etc.
- `docker-compose.yml` — 2 servicios: `app` (interno) + `caddy` (público en 80/443)
- `Caddyfile` — TLS automático Let's Encrypt + headers de seguridad + redirect www → apex
- `scripts/server-setup.sh` — bootstrap idempotente del VPS (firewalld, clone, .env placeholder)
- `scripts/deploy.sh` — comando único de deploy desde local al VPS
- `docs/deploy.md` — guía completa: setup inicial, deploy de actualizaciones, troubleshooting, security

**Fuera (deferred a v1.1)**:
- CI/CD con GitHub Actions (por ahora `deploy.sh` manual es suficiente para 1 dev)
- Observability — Prometheus/Grafana/Loki, etc.
- Backup automático a S3/Backblaze (lo persistente vive en Supabase, el VPS es reemplazable)
- Auto-update de AlmaLinux (recomendado en docs pero no se configura)
- fail2ban (recomendado pero no se configura)

## Stakeholders & Decisiones tomadas con Jennifer

- **Hosting**: VPS HostGator + Docker (no Vercel — Jennifer ya tiene el VPS)
- **Modelo de acceso**: público + login (opción A — sin IP allowlist)
- **SSH**: por password (sin clave). El `deploy.sh` lo pide interactivo; docs recomienda migrar a SSH key.
- **Dominio**: `salazardukeimpacthubteam.com`, DNS configurado en HostGator → 69.6.243.113

## Riesgos

- **LOW** — Let's Encrypt rate limit: 50 certs/semana por dominio. Solo un problema si rebuild Caddy rápido reiteradamente. Caddy reusa cache, no es un problema en operación normal.
- **LOW** — `output: standalone` rompe algún import dinámico que Next.js no detecta: muy raro en Next 16, validable con build local.
- **MEDIUM** — Variables `NEXT_PUBLIC_*` se hornean en build (no runtime): cambio de var requiere `docker compose up -d --build`, no solo restart. Documentado en troubleshooting.
- **LOW** — Password SSH expuesto a brute-force: mitigable con SSH key + deshabilitar password auth. Recomendado en docs.

## Tamaño estimado

- ~400 LOC (Dockerfile + compose + Caddyfile + scripts + docs)
- 1 PR único
- Sin specs e2e nuevos (el deploy no es testable desde Playwright)
- Validación: `docker build` local + `docker compose config` + smoke test manual en VPS

## Next

`design.md` + `tasks.md` compactos en este mismo change. Después: PR + Jennifer ejecuta el bootstrap en el VPS.
