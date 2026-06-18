#!/usr/bin/env bash
# scripts/deploy.sh
#
# Hace deploy de la rama actual al VPS de producción.
# Asume que el repo ya está clonado en $REMOTE_PATH y que .env.production
# ya existe en el VPS con los valores reales (ver docs/deploy.md).
#
# Uso desde tu Windows (Git Bash) o cualquier shell Unix:
#   ./scripts/deploy.sh
#
# Te va a pedir el password de SSH (root). Si configuraste SSH key con
# ssh-copy-id, no te pide nada y es seamless.
#
# Variables overridable por env del shell:
#   VPS_HOST=69.6.243.113   # IP del VPS
#   VPS_PORT=22             # puerto SSH (default 22; cambialo si lo movés)
#   VPS_USER=root           # usuario SSH
#   REMOTE_PATH=/opt/sdih-talleres  # ruta del repo en el VPS

set -euo pipefail

VPS_HOST="${VPS_HOST:-69.6.243.113}"
VPS_PORT="${VPS_PORT:-22}"
VPS_USER="${VPS_USER:-root}"
REMOTE_PATH="${REMOTE_PATH:-/opt/sdih-talleres}"
BRANCH="${BRANCH:-master}"

echo "════════════════════════════════════════════════════════"
echo "  Deploy SDIH Talleres"
echo "  Host : ${VPS_USER}@${VPS_HOST}:${VPS_PORT}"
echo "  Path : ${REMOTE_PATH}"
echo "  Rama : ${BRANCH}"
echo "════════════════════════════════════════════════════════"
echo

# Una sola conexión SSH ejecuta todo el deploy.
# Con SSH key configurada, no pide password. Con password auth, pide UNA vez.
ssh -p "${VPS_PORT}" "${VPS_USER}@${VPS_HOST}" bash -se <<EOF
set -euo pipefail
cd "${REMOTE_PATH}"

echo "[1/4] Pull de la rama ${BRANCH}..."
git fetch origin
git checkout "${BRANCH}"
git pull --ff-only origin "${BRANCH}"

echo
echo "[2/4] Build de la imagen Docker..."
# --env-file es necesario para que docker compose sustituya los \${NEXT_PUBLIC_*}
# en build args desde .env.production (sino quedarían como strings vacíos).
docker compose --env-file .env.production build app

echo
echo "[3/4] Restart del container..."
docker compose --env-file .env.production up -d

echo
echo "[4/4] Limpieza de imágenes viejas..."
docker image prune -f

echo
echo "── Status ─────────────────────────────────────────────"
docker compose ps
EOF

echo
echo "✅ Deploy completo. Verificá: https://talleres.salazardukeimpacthubteam.com"
echo "   Logs: ssh -p ${VPS_PORT} ${VPS_USER}@${VPS_HOST} 'cd ${REMOTE_PATH} && docker compose logs -f --tail=100'"
