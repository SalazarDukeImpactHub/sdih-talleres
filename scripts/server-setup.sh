#!/usr/bin/env bash
# scripts/server-setup.sh
#
# Bootstrap UNA SOLA VEZ del VPS AlmaLinux 9.7. Idempotente — podés
# correrlo de nuevo y no rompe nada (skipea lo ya hecho).
#
# Asume que el VPS YA tiene:
#   - Docker + Docker Compose plugin
#   - Caddy corriendo en el host (escucha 80/443, ya tiene firewall abierto)
#   - Otros sitios funcionando (engram, markitdown) con el mismo patrón
#
# Hace:
#   1. Verifica Docker + Docker Compose + Caddy en host
#   2. Crea el directorio /opt/sdih-talleres
#   3. Clona el repo desde GitHub si no está
#   4. Crea .env.production a partir del template (vos lo editás después)
#
# Uso desde el VPS:
#   curl -sSL https://raw.githubusercontent.com/SalazarDukeImpactHub/sdih-talleres/master/scripts/server-setup.sh | bash
# o si ya clonaste:
#   bash scripts/server-setup.sh

set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/SalazarDukeImpactHub/sdih-talleres.git}"
INSTALL_PATH="${INSTALL_PATH:-/opt/sdih-talleres}"

echo "════════════════════════════════════════════════════════"
echo "  Bootstrap VPS — SDIH Talleres"
echo "  Install path : ${INSTALL_PATH}"
echo "════════════════════════════════════════════════════════"
echo

# ─── 1. Verificar el stack base del VPS ───────────────────────────────────────
echo "[1/4] Verificando stack base del VPS..."
if ! command -v docker >/dev/null 2>&1; then
	echo "✗ Docker no está instalado. Instalalo primero:"
	echo "   dnf install -y docker"
	echo "   systemctl enable --now docker"
	exit 1
fi
if ! docker compose version >/dev/null 2>&1; then
	echo "✗ Docker Compose plugin no está. Instalalo:"
	echo "   dnf install -y docker-compose-plugin"
	exit 1
fi
echo "✓ Docker $(docker --version)"
echo "✓ Compose $(docker compose version --short)"

if systemctl is-active --quiet caddy 2>/dev/null; then
	echo "✓ Caddy corriendo en el host"
else
	echo "⚠ Caddy NO está corriendo en el host. Verificá con:"
	echo "   systemctl status caddy"
	echo "  Sin Caddy, https://talleres.salazardukeimpacthubteam.com NO va a responder."
fi

# ─── 2. Crear directorio ──────────────────────────────────────────────────────
echo
echo "[2/4] Creando ${INSTALL_PATH}..."
mkdir -p "${INSTALL_PATH}"
cd "${INSTALL_PATH}"

# ─── 3. Clone del repo (si no existe) ─────────────────────────────────────────
echo
echo "[3/4] Setup del repo..."
if [ ! -d ".git" ]; then
	echo "  Clonando ${REPO_URL}..."
	git clone "${REPO_URL}" .
else
	echo "  Repo ya clonado, haciendo pull..."
	git pull --ff-only origin master
fi

# ─── 4. .env.production placeholder ───────────────────────────────────────────
echo
echo "[4/4] .env.production..."
if [ -f ".env.production" ]; then
	echo "  ✓ .env.production ya existe — NO se sobrescribe"
else
	cat > .env.production <<'TPL'
# Generado por server-setup.sh. EDITALO con los valores reales.
# Estas vars las consume el container de la app de Next.js (servicio `app`
# en docker-compose.yml). El Caddy del host NO usa este archivo — su config
# vive en /etc/caddy/Caddyfile.

NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

NEXT_PUBLIC_BASE_URL=https://talleres.salazardukeimpacthubteam.com
NEXT_PUBLIC_WHATSAPP_NUMBER=573136139790

RESEND_API_KEY=
EMAIL_FROM=SDIH Talleres <onboarding@resend.dev>
EMAIL_PROVIDER_MODE=live
TPL
	chmod 600 .env.production
	echo "  ✓ .env.production creado (placeholder). EDITALO:"
	echo "     nano ${INSTALL_PATH}/.env.production"
fi

echo
echo "════════════════════════════════════════════════════════"
echo "  ✅ Bootstrap completo"
echo "════════════════════════════════════════════════════════"
echo
echo "Próximos pasos:"
echo
echo "  1) Editá .env.production con los valores reales:"
echo "     nano ${INSTALL_PATH}/.env.production"
echo
echo "  2) Agregá este bloque al final de /etc/caddy/Caddyfile:"
echo
echo "     talleres.salazardukeimpacthubteam.com {"
echo "         reverse_proxy localhost:3001"
echo "     }"
echo
echo "  3) Recargá Caddy para que tome el nuevo bloque:"
echo "     systemctl reload caddy"
echo
echo "  4) Primera build + start del container:"
echo "     cd ${INSTALL_PATH}"
echo "     docker compose up -d --build"
echo
echo "  5) Verificá:"
echo "     curl -I https://talleres.salazardukeimpacthubteam.com"
