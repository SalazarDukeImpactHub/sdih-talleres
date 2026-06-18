#!/usr/bin/env bash
# scripts/server-setup.sh
#
# Bootstrap UNA SOLA VEZ del VPS AlmaLinux 9.7. Idempotente — podés
# correrlo de nuevo y no rompe nada (skipea lo ya hecho).
#
# Hace:
#   1. Verifica Docker + Docker Compose plugin
#   2. Abre el firewall (firewalld) para los puertos 80 y 443
#      (el 22022 ya tiene que estar abierto, sino no podrías conectarte)
#   3. Crea el directorio /opt/sdih-talleres
#   4. Clona el repo desde GitHub si no está
#   5. Crea .env.production a partir del template (vos lo editás después)
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

# ─── 1. Verificar Docker ───────────────────────────────────────────────────────
echo "[1/5] Verificando Docker..."
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

# ─── 2. Firewall: abrir 80/tcp y 443/tcp ───────────────────────────────────────
echo
echo "[2/5] Abriendo puertos en firewalld..."
if command -v firewall-cmd >/dev/null 2>&1; then
	firewall-cmd --permanent --add-service=http   || true
	firewall-cmd --permanent --add-service=https  || true
	firewall-cmd --reload
	echo "✓ HTTP y HTTPS habilitados"
else
	echo "ℹ firewall-cmd no disponible — saltando (asumimos firewall ya configurado)"
fi

# ─── 3. Crear directorio ──────────────────────────────────────────────────────
echo
echo "[3/5] Creando ${INSTALL_PATH}..."
mkdir -p "${INSTALL_PATH}"
cd "${INSTALL_PATH}"

# ─── 4. Clone del repo (si no existe) ─────────────────────────────────────────
echo
echo "[4/5] Setup del repo..."
if [ ! -d ".git" ]; then
	echo "  Clonando ${REPO_URL}..."
	git clone "${REPO_URL}" .
else
	echo "  Repo ya clonado, haciendo pull..."
	git pull --ff-only origin master
fi

# ─── 5. .env.production ────────────────────────────────────────────────────────
echo
echo "[5/5] .env.production..."
if [ -f ".env.production" ]; then
	echo "  ✓ .env.production ya existe — NO se sobrescribe"
else
	cat > .env.production <<'TPL'
# Generado por server-setup.sh. EDITALO con los valores reales.

DOMAIN=talleres.salazardukeimpacthubteam.com
ACME_EMAIL=info@salazardukeimpacthub.com

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
echo "  1) Editá .env.production con los valores reales:"
echo "     nano ${INSTALL_PATH}/.env.production"
echo
echo "  2) Primera build + start:"
echo "     cd ${INSTALL_PATH}"
echo "     docker compose up -d --build"
echo
echo "  3) Verificá DNS y certificado:"
echo "     curl -I https://talleres.salazardukeimpacthubteam.com"
