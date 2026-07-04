#!/usr/bin/env bash
# =============================================================================
# deploy.sh — one-shot deploy for the HCMUS Physics CMS on CentOS 7.9
#
# Run AS ROOT, from the repo root, ON THE SERVER:
#     sudo bash deploy/deploy.sh
#
# It is idempotent — safe to re-run. It:
#   1. Repairs CentOS 7 EOL yum repos (mirrorlist is dead → vault.centos.org)
#   2. Ensures a swap file (the 4GB box OOMs while building 2 Next.js apps)
#   3. Installs Docker CE + compose plugin, enables the service
#   4. Opens firewall ports 3000/3001/3002
#   5. Checks env files exist, then builds + starts the stack
#   6. Waits for health and prints URLs
#
# Node 24 needs glibc >= 2.28; CentOS 7 has 2.17 — so everything runs in Docker.
# =============================================================================
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$REPO_ROOT/docker-compose.prod.yml"
SWAP_FILE="/swapfile"
SWAP_SIZE_GB=4
PORTS=(3000 3001 3002)

log() { printf '\n\033[1;34m==>\033[0m %s\n' "$*"; }
die() { printf '\n\033[1;31mERROR:\033[0m %s\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || die "Run as root:  sudo bash deploy/deploy.sh"

# --- 1. CentOS 7 EOL yum repair --------------------------------------------
if grep -qi "CentOS Linux 7" /etc/os-release 2>/dev/null || [ -f /etc/centos-release ]; then
  log "CentOS 7 detected — pointing yum at vault.centos.org (EOL mirrors are down)"
  for f in /etc/yum.repos.d/CentOS-Base.repo; do
    [ -f "$f" ] || continue
    if ! grep -q "vault.centos.org" "$f"; then
      cp -n "$f" "$f.bak.$(date +%s 2>/dev/null || echo bak)" 2>/dev/null || true
      sed -i \
        -e 's/^mirrorlist=/#mirrorlist=/g' \
        -e 's|^#\?baseurl=http://mirror.centos.org|baseurl=http://vault.centos.org|g' \
        "$f"
    fi
  done
  yum clean all >/dev/null 2>&1 || true
fi

# --- 2. Swap ----------------------------------------------------------------
if ! swapon --show 2>/dev/null | grep -q .; then
  log "No swap active — creating ${SWAP_SIZE_GB}G swap at $SWAP_FILE"
  if [ ! -f "$SWAP_FILE" ]; then
    fallocate -l "${SWAP_SIZE_GB}G" "$SWAP_FILE" 2>/dev/null \
      || dd if=/dev/zero of="$SWAP_FILE" bs=1M count=$((SWAP_SIZE_GB*1024))
    chmod 600 "$SWAP_FILE"
    mkswap "$SWAP_FILE"
  fi
  swapon "$SWAP_FILE"
  grep -q "$SWAP_FILE" /etc/fstab || echo "$SWAP_FILE none swap sw 0 0" >> /etc/fstab
else
  log "Swap already active — skipping"
fi

# --- 3. Docker --------------------------------------------------------------
if ! command -v docker >/dev/null 2>&1; then
  log "Installing Docker CE"
  yum install -y yum-utils device-mapper-persistent-data lvm2 git curl
  yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
  # CentOS 7 is EOL; if the newest docker-ce won't install, pin the last CentOS-7 line:
  #   yum install -y docker-ce-24.0.9 docker-ce-cli-24.0.9 containerd.io docker-compose-plugin
  yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin \
    || yum install -y docker-ce-24.0.9 docker-ce-cli-24.0.9 containerd.io docker-compose-plugin \
    || die "Docker install failed. See deploy/DEPLOY.md → Troubleshooting."
else
  log "Docker already installed ($(docker --version))"
fi
systemctl enable --now docker

docker compose version >/dev/null 2>&1 || die "docker compose plugin missing (install docker-compose-plugin)"

# --- 4. Firewall ------------------------------------------------------------
if systemctl is-active --quiet firewalld 2>/dev/null; then
  log "Opening firewall ports: ${PORTS[*]}"
  for p in "${PORTS[@]}"; do firewall-cmd --permanent --add-port="${p}/tcp" >/dev/null || true; done
  firewall-cmd --reload >/dev/null || true
else
  log "firewalld not active — skipping (ensure the cloud security group allows ${PORTS[*]})"
fi

# --- 5. Env checks ----------------------------------------------------------
cd "$REPO_ROOT"
[ -f .env ] || die "Missing $REPO_ROOT/.env — copy deploy/.env.prod.example → .env and edit it."
[ -f backend/.env ] || die "Missing backend/.env — see deploy/DEPLOY.md (backend secrets, REDIS_URL=redis://redis:6379, FRONTEND_URLS)."
grep -q "<SERVER_IP>" .env && die "Edit .env: replace <SERVER_IP> with the real server IP."

# --- 6. Build + up ----------------------------------------------------------
log "Building images (this is the slow part; ~10-20 min on 4GB — swap is active)"
docker compose -f "$COMPOSE_FILE" build

log "Starting the stack"
docker compose -f "$COMPOSE_FILE" up -d

# --- 7. Health --------------------------------------------------------------
log "Waiting for services..."
sleep 8
docker compose -f "$COMPOSE_FILE" ps
IP="$(grep -E '^NEXT_PUBLIC_API_URL=' .env | sed -E 's#.*//([^:/]+).*#\1#')"
cat <<EOF

Done. Open:
  Public site : http://${IP}:3002/vi
  Admin CMS   : http://${IP}:3000
  API health  : http://${IP}:3001/health   (or /page-layouts/slug/trang-chu)

Logs:    docker compose -f docker-compose.prod.yml logs -f <backend|public|admin>
Restart: docker compose -f docker-compose.prod.yml restart <service>
EOF
