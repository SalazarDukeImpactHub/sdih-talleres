# Deploy SDIH Talleres — VPS HostGator + Docker + Caddy del host

Guía paso a paso para desplegar el portal de SDIH Talleres en el VPS de HostGator y mantenerlo. Pensado para Jennifer.

## Resumen del stack

| Componente | Tecnología | Para qué |
|---|---|---|
| Hosting | VPS HostGator AlmaLinux 9.7 (`69.6.243.113`) | Corre el contenedor de la app |
| Runtime | Docker + Docker Compose | Aísla y orquesta el servicio de la app |
| App | Next.js 16 standalone (Node 22 alpine) | Sirve el portal, escucha `127.0.0.1:3001` |
| Reverse proxy + TLS | Caddy del host (NO en Docker) | HTTPS automático con Let's Encrypt, multiplexa varios subdominios |
| Subdominio | `talleres.salazardukeimpacthubteam.com` (DNS desde HostGator) | Apunta a la IP del VPS |
| Datos | Supabase (externo) | Auth, Postgres, Storage |
| Emails | Resend (externo) | Transaccionales |

El VPS ya corre Caddy en el host manejando `engram.salazardukeimpacthubteam.com` (→ `localhost:18080`) y `markitdown.salazardukeimpacthubteam.com` (→ `localhost:8001`). Nuestro setup sigue el mismo patrón: la app de talleres escucha en `localhost:3001` y agregamos un bloque al Caddyfile del host.

---

## Setup inicial — UNA SOLA VEZ

### 1. DNS — agregar registro en HostGator

Panel HostGator → **Domain Manager** → `salazardukeimpacthubteam.com` → **DNS Zone Editor** → agregar:

| Tipo | Nombre | Clase | TTL | Valor |
|------|--------|-------|-----|-------|
| `A` | `talleres` | `IN` | `3600` | `69.6.243.113` |

(No tocás el `@` ni los CNAME existentes — solo agregás `talleres`.)

Esperá 5-10 min y verificá desde tu Windows:

```bash
nslookup talleres.salazardukeimpacthubteam.com
# debe devolver: 69.6.243.113
```

### 2. Bootstrap del VPS

Conectate por SSH (puerto **22**, no 22022):

```bash
ssh root@69.6.243.113
```

Una vez adentro, corré el script de bootstrap:

```bash
curl -sSL https://raw.githubusercontent.com/SalazarDukeImpactHub/sdih-talleres/master/scripts/server-setup.sh | bash
```

El script verifica Docker + Caddy del host, clona el repo en `/opt/sdih-talleres` y genera un `.env.production` placeholder.

### 3. Completar `.env.production` con valores reales

Seguís en el VPS:

```bash
nano /opt/sdih-talleres/.env.production
```

Pegá esto y completá los valores marcados con `← TUYO`:

```bash
# Estas vars las consume el container de la app de Next.js.
# El Caddy del host NO usa este archivo — su config vive en /etc/caddy/Caddyfile.

NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co        # ← TUYO (del .env.local)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...                  # ← TUYO (del .env.local)
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...                      # ← TUYO (del .env.local)

NEXT_PUBLIC_BASE_URL=https://talleres.salazardukeimpacthubteam.com
NEXT_PUBLIC_WHATSAPP_NUMBER=573136139790

RESEND_API_KEY=re_...                                    # ← TUYO (cuenta Resend)
EMAIL_FROM=SDIH Talleres <onboarding@resend.dev>
EMAIL_PROVIDER_MODE=live
```

Guardalo y protegelo:

```bash
chmod 600 /opt/sdih-talleres/.env.production
```

### 4. Agregar el bloque de talleres al Caddyfile del host

Editá el Caddyfile del host (el que ya maneja engram y markitdown):

```bash
nano /etc/caddy/Caddyfile
```

Pegá al final del archivo:

```caddy
talleres.salazardukeimpacthubteam.com {
    reverse_proxy localhost:3001
}
```

Guardá y recargá Caddy (sin downtime):

```bash
systemctl reload caddy
```

Verificá que el bloque está OK:

```bash
caddy validate --config /etc/caddy/Caddyfile
# debe decir: "Valid configuration"
```

### 5. Primer build + start del container

```bash
cd /opt/sdih-talleres
docker compose up -d --build
```

El primer build tarda 3-5 minutos. Después:

```bash
docker compose ps                              # estado del container
docker compose logs -f                         # logs en vivo (Ctrl+C para salir)
ss -tlnp | grep :3001                          # confirmá que el container escucha
curl -I http://localhost:3001/auth/login       # request directo al container (sin Caddy)
```

### 6. Smoke test desde tu Windows

Caddy ya tiene certificado de Let's Encrypt para el subdominio (lo obtiene automáticamente en el primer request HTTPS). Probá:

```bash
curl -I https://talleres.salazardukeimpacthubteam.com
# debe devolver: HTTP/2 200 (o redirect a /auth/login)
```

Abrí el navegador en `https://talleres.salazardukeimpacthubteam.com`:
- Candado verde → TLS OK ✓
- Te lleva a `/auth/login` automáticamente
- Login con `alumna@test.com` / `Talleres2026!` (el seed user)

---

## Deploy de actualizaciones — cada vez que mergees un PR a master

Desde tu **máquina local Windows** (Git Bash):

```bash
cd C:/Users/jsala/trazzos-dev-system/experiments/sdih-talleres
./scripts/deploy.sh
```

El script te pide el password SSH (una sola vez por corrida), hace `git pull` en el VPS, rebuilds la imagen Docker, restartea el container y muestra el status. Toma ~2-3 min. **No toca el Caddyfile del host** — el bloque que agregaste sigue funcionando.

Si querés ver los logs después:

```bash
ssh root@69.6.243.113 'cd /opt/sdih-talleres && docker compose logs -f --tail=100'
```

---

## Seguridad — recomendado fuertemente

### Migrar de password SSH a SSH key

El VPS muestra **2.280 intentos de login fallidos** desde la última sesión exitosa — son bots brute-forcing el puerto 22. Para mitigar:

```bash
# En tu máquina local (si no tenés clave todavía):
ssh-keygen -t ed25519 -C "jennifer@sdih"
# Acepta el default (~/.ssh/id_ed25519). Passphrase opcional pero recomendado.

# Copialo al VPS (te pide el password una última vez):
ssh-copy-id root@69.6.243.113
```

Después de eso, `./scripts/deploy.sh` no te pide nada — autenticación automática.

### Deshabilitar password auth de SSH

```bash
ssh root@69.6.243.113
nano /etc/ssh/sshd_config
# Buscá y cambiá:
#   PasswordAuthentication no
#   PermitRootLogin prohibit-password
systemctl restart sshd
```

A partir de ahí solo entra con tu clave privada. Probá desde otra terminal ANTES de cerrar sesión (sino quedás afuera).

### Instalar fail2ban (opcional pero recomendado)

```bash
dnf install -y fail2ban
systemctl enable --now fail2ban
# Config básica: banea IPs que fallen 5 logins en 10 min
```

---

## Operación

### Ver logs
```bash
ssh root@69.6.243.113
cd /opt/sdih-talleres
docker compose logs -f                          # logs del container
journalctl -u caddy -f                          # logs de Caddy del host
```

### Restart sin rebuild
```bash
cd /opt/sdih-talleres
docker compose restart
```

### Stop / start
```bash
docker compose stop
docker compose start
```

### Status
```bash
docker compose ps
docker stats --no-stream      # CPU/RAM
```

### Borrar imágenes viejas (libera disco)
```bash
docker image prune -f
```

### Renovar certificado TLS

Caddy del host renueva automáticamente 30 días antes de expirar. Si necesitás forzarlo:

```bash
systemctl restart caddy
```

---

## Troubleshooting

### "El sitio no carga"

```bash
ssh root@69.6.243.113
# 1) ¿El container está Up?
cd /opt/sdih-talleres && docker compose ps
# 2) ¿Escucha en 3001?
ss -tlnp | grep :3001
# 3) ¿Responde directo (sin Caddy)?
curl -I http://localhost:3001/auth/login
# 4) ¿Caddy tiene el bloque cargado?
caddy validate --config /etc/caddy/Caddyfile
grep -A2 talleres /etc/caddy/Caddyfile
# 5) Logs de Caddy
journalctl -u caddy --since "10 min ago" --no-pager | tail -50
```

### TLS no funciona (no candado verde)

```bash
journalctl -u caddy --since "10 min ago" | grep -i "obtain\|acme\|cert"
# Causas comunes:
# - DNS aún no propagado: dig talleres.salazardukeimpacthubteam.com +short
# - Rate limit de Let's Encrypt (50 certs/semana por dominio): esperá 1h
# - El puerto 80 no es accesible (necesario para HTTP-01 challenge)
```

### App no levanta — error 500

```bash
docker compose logs app | tail -50
# Causas típicas:
# - Falta una var en .env.production (Supabase URL/keys, RESEND_API_KEY)
# - Supabase URL mal copiada
```

### Cambié `.env.production`, el cambio no se ve

`NEXT_PUBLIC_*` se hornean en el bundle durante build, así que solo cambiarlas en `.env.production` y restartear NO alcanza — hay que rebuildear:

```bash
docker compose up -d --build
```

Las variables server-side (`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_PROVIDER_MODE`) sí se aplican con solo restart.

### "Out of disk space"

```bash
df -h /
docker system df
docker image prune -af      # imagenes no usadas
docker container prune -f   # containers parados
docker builder prune -af    # caché de builds
```

---

## Backup

Lo único persistente del setup es `/opt/sdih-talleres/.env.production` (tus secrets) y el Caddyfile del host (`/etc/caddy/Caddyfile`). Todo lo demás vive en Supabase + GitHub, así que el VPS es **reemplazable en ~10 minutos**.

Backup mínimo recomendado: una vez por mes copiá esos 2 archivos a tu máquina:

```bash
scp root@69.6.243.113:/opt/sdih-talleres/.env.production ~/backups/
scp root@69.6.243.113:/etc/caddy/Caddyfile ~/backups/caddyfile-vps.bak
```

---

## Seguridad — checklist v1

- ✅ TLS automático con Let's Encrypt (Caddy del host)
- ✅ Container corre como usuario `nextjs:1001` no-root
- ✅ Container escucha solo en `127.0.0.1` (no exposición pública directa)
- ⚠ **Recomendado**: deshabilitar password SSH después de configurar SSH key
- ⚠ **Recomendado**: instalar fail2ban para SSH
- ⚠ **Recomendado**: headers de seguridad en el Caddyfile del host (HSTS, X-Frame-Options, etc.). Por ahora los bloques de engram/markitdown/talleres son minimales — si querés agregar, ver `caddy directives`.

---

## Archivos relacionados

- `Dockerfile` — build multi-stage para imagen pequeña
- `.dockerignore` — qué NO copiar al image
- `docker-compose.yml` — orquestación del container de la app
- `scripts/server-setup.sh` — bootstrap idempotente del VPS
- `scripts/deploy.sh` — deploy desde local
- `openspec/changes/docker-deploy/{proposal,design,tasks}.md` — decisiones SDD del slice 8b
