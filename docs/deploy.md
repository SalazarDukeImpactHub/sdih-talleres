# Deploy SDIH Talleres — VPS AlmaLinux + Docker + Caddy

Guía paso a paso para desplegar el portal de SDIH Talleres en el VPS de HostGator y mantenerlo. Pensado para Jennifer.

## Resumen del stack

| Componente | Tecnología | Para qué |
|---|---|---|
| Hosting | VPS HostGator AlmaLinux 9.7 (`69.6.243.113`) | Corre el contenedor de la app |
| Runtime | Docker + Docker Compose | Aísla y orquesta los servicios |
| App | Next.js 16 standalone (Node 22 alpine) | Sirve el portal |
| Reverse proxy | Caddy 2 (alpine) | HTTPS automático con Let's Encrypt |
| Dominio | `talleres.salazardukeimpacthubteam.com` (subdominio, DNS desde HostGator) | Apunta a la IP del VPS |
| Datos | Supabase (externo) | Auth, Postgres, Storage |
| Emails | Resend (externo) | Transaccionales |

---

## Setup inicial — UNA SOLA VEZ

### 1. DNS

El portal vive en el **subdominio** `talleres.salazardukeimpacthubteam.com`. El dominio apex `salazardukeimpacthubteam.com` queda con su landing actual de HostGator.

En tu panel de HostGator, agregá UN registro DNS:

```
A     talleres     69.6.243.113
```

(El `@` del apex queda apuntando a donde ya está hoy — no lo tocás.)

La propagación tarda entre 5 min y unas horas. Verificá con:

```bash
dig talleres.salazardukeimpacthubteam.com +short
# debe devolver: 69.6.243.113
```

### 2. Bootstrap del VPS

Conectate por SSH:

```bash
ssh -p 22022 root@69.6.243.113
```

Una vez adentro, corré el script de bootstrap:

```bash
curl -sSL https://raw.githubusercontent.com/SalazarDukeImpactHub/sdih-talleres/master/scripts/server-setup.sh | bash
```

El script verifica Docker, abre los puertos 80/443 en firewalld, clona el repo en `/opt/sdih-talleres` y genera un `.env.production` placeholder.

### 3. Completar `.env.production` con valores reales

Editá el archivo en el VPS:

```bash
nano /opt/sdih-talleres/.env.production
```

Pegá esto y completá los valores marcados:

```bash
# ─── Dominio y TLS ─────────────────────────────────────────
DOMAIN=talleres.salazardukeimpacthubteam.com
ACME_EMAIL=info@salazardukeimpacthub.com

# ─── Supabase ──────────────────────────────────────────────
# Los mismos valores de tu .env.local de desarrollo:
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# ─── App pública ───────────────────────────────────────────
NEXT_PUBLIC_BASE_URL=https://talleres.salazardukeimpacthubteam.com
NEXT_PUBLIC_WHATSAPP_NUMBER=573136139790

# ─── Resend ────────────────────────────────────────────────
RESEND_API_KEY=re_...
EMAIL_FROM=SDIH Talleres <onboarding@resend.dev>
EMAIL_PROVIDER_MODE=live
```

Guardalo y protegelo:

```bash
chmod 600 /opt/sdih-talleres/.env.production
```

### 4. Primer build + start

```bash
cd /opt/sdih-talleres
docker compose up -d --build
```

El primer build tarda 3-5 minutos. Después:

- Caddy obtiene certificado de Let's Encrypt automáticamente (~30s)
- App arranca en background
- Verificá:

```bash
docker compose ps          # ambos containers deben estar Up
docker compose logs -f     # logs en vivo (Ctrl+C para salir)
curl -I https://talleres.salazardukeimpacthubteam.com   # debe devolver 200 o redirect
```

Abrí el navegador en `https://talleres.salazardukeimpacthubteam.com` — debería cargar la landing.

---

## Deploy de actualizaciones — cada vez que mergees un PR a master

Desde tu **máquina local Windows** (Git Bash):

```bash
cd C:/Users/jsala/trazzos-dev-system/experiments/sdih-talleres
./scripts/deploy.sh
```

El script te pide el password SSH (una sola vez por corrida), hace `git pull` en el VPS, rebuilds la imagen Docker, restartea los containers y muestra el status. Toma ~2-3 min.

Si querés ver los logs después:

```bash
ssh -p 22022 root@69.6.243.113 'cd /opt/sdih-talleres && docker compose logs -f --tail=100'
```

---

## Recomendado: pasar de password a SSH key

Tener que escribir el password cada deploy es lento y menos seguro que SSH key. Setup de UNA SOLA VEZ:

```bash
# En tu máquina local (si no tenés clave todavía):
ssh-keygen -t ed25519 -C "jennifer@sdih"
# Acepta el default (~/.ssh/id_ed25519). Passphrase opcional.

# Copialo al VPS (te pide el password una última vez):
ssh-copy-id -p 22022 root@69.6.243.113
```

Después de eso, `./scripts/deploy.sh` no te pide nada — autenticación automática. Y para máxima seguridad, **deshabilitá password auth** en el VPS:

```bash
ssh -p 22022 root@69.6.243.113
nano /etc/ssh/sshd_config
# Buscá y poné: PasswordAuthentication no
systemctl restart sshd
```

A partir de ahí solo se entra con la clave privada que tenés en tu máquina.

---

## Operación

### Ver logs
```bash
ssh -p 22022 root@69.6.243.113
cd /opt/sdih-talleres
docker compose logs -f app      # solo la app
docker compose logs -f caddy    # solo el proxy
docker compose logs -f          # todo
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

### Status de los containers
```bash
docker compose ps
docker stats --no-stream      # CPU/RAM en vivo
```

### Borrar imágenes viejas (libera disco)
```bash
docker image prune -f
```

### Renovar certificado TLS manualmente

Caddy renueva automáticamente 30 días antes de expirar. Si querés forzarlo:

```bash
docker compose exec caddy caddy reload
```

---

## Troubleshooting

### "El sitio no carga" o "ERR_CONNECTION_REFUSED"

```bash
docker compose ps
# ¿Ambos services muestran "Up"?
# Si caddy está "Restarting", revisá el log:
docker compose logs caddy
# Causa típica: el puerto 80 o 443 no está abierto en firewalld.
firewall-cmd --list-services
# Si falta http o https:
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload
```

### Certificate failure de Let's Encrypt

```bash
docker compose logs caddy | grep -i "obtain"
# Mensajes comunes:
# - "no DNS record for X": DNS no propagado todavía, esperá.
# - "rate limit exceeded": demasiados intentos en poco tiempo,
#   esperá 1 hora antes de retry.
# - "failed authorization": el puerto 80 está bloqueado.
```

### App no levanta — Server error 500

```bash
docker compose logs app | tail -50
# Causas típicas:
# - Falta una variable en .env.production
# - Supabase URL/keys mal copiadas
# - Resend API key inválida (NO bloquea — el email es best-effort,
#   pero loguea warning continuo)
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
docker system prune -af --volumes  # ⚠ esto borra TODO lo no usado, incluyendo
                                    # caddy_data si caddy está stopped — NO correr
                                    # con caddy parado, perdés los certificados.
# Más seguro:
docker image prune -af
docker container prune -f
docker builder prune -af
```

---

## Backup

Lo único persistente del VPS son los certificados de Let's Encrypt (volumen `caddy_data`). Si se pierden, Caddy los regenera automáticamente al próximo restart (sin downtime visible — usa los del cache hasta lograr nuevos).

Todo lo demás vive en Supabase + GitHub, así que el VPS es **reemplazable en ~10 minutos**: setup nuevo + bootstrap + .env.production + deploy.

---

## Seguridad

- ✅ TLS automático con Let's Encrypt (Caddy)
- ✅ Headers HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy (Caddyfile)
- ✅ Container corre como usuario `nextjs` no-root
- ✅ Solo puertos 80, 443 y 22022 abiertos (firewalld)
- ⚠ Recomendado: deshabilitar password SSH después de configurar SSH key
- ⚠ Recomendado: instalar fail2ban para SSH (`dnf install fail2ban` + config básica)
- ⚠ Recomendado: configurar actualizaciones automáticas de seguridad de AlmaLinux

---

## Archivos relacionados

- `Dockerfile` — build multi-stage para imagen pequeña
- `.dockerignore` — qué NO copiar al image
- `docker-compose.yml` — orquestación de app + Caddy
- `Caddyfile` — config del reverse proxy + TLS
- `scripts/server-setup.sh` — bootstrap idempotente del VPS
- `scripts/deploy.sh` — deploy desde local
- `openspec/changes/docker-deploy/{proposal,design,tasks}.md` — decisiones SDD del slice 8b
