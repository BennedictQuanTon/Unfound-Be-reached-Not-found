#!/usr/bin/env bash
# One command to run Unfound locally with a real TideCloak realm and Tide's MCP for Claude Code.
#
#   cp .env.example .env      # fill in the three values, they are yours to give
#   bash scripts/setup-local.sh
#
# Steps: install deps · add Tide's MCP to Claude Code · start TideCloak in Docker · provision a
# licensed Tide realm · wait for YOUR Tide enrolment in the browser · copy tidecloak.json + create
# the _tide_addr* roles · start the app on http://localhost:3000.
set -euo pipefail
cd "$(dirname "$0")/.."

say() { printf "\n\033[1m▸ %s\033[0m\n" "$*"; }
die() { printf "\n\033[31m✖ %s\033[0m\n" "$*" >&2; exit "${2:-1}"; }

[ -f .env ] && set -a && . ./.env && set +a

# Tide's rule: only you can give the licence email and accept the Terms. No defaults.
if [ -z "${TIDE_LICENSE_EMAIL:-}" ] || [ "${TIDE_TERMS_ACCEPTED:-}" != "yes" ]; then
  die "Set TIDE_LICENSE_EMAIL (an address you control) and TIDE_TERMS_ACCEPTED=yes in .env
   after reading https://tide.org/legal. See .env.example." 2
fi
[ -n "${KC_BOOTSTRAP_ADMIN_PASSWORD:-}" ] || die "Set KC_BOOTSTRAP_ADMIN_PASSWORD in .env (local TideCloak master admin)." 2
REALM="${TIDE_REALM:-unfound}"
case "$(uname -s)" in MINGW*|MSYS*|CYGWIN*) WIN=1 ;; *) WIN= ;; esac

command -v node >/dev/null || die "Node.js 20+ is required."
command -v docker >/dev/null || die "Docker is required (Docker Desktop on macOS or Windows)."

say "Installing dependencies"
npm install --no-audit --no-fund

if command -v claude >/dev/null; then
  say "Adding Tide's MCP server to Claude Code (local scope)"
  claude mcp get tide >/dev/null 2>&1 || claude mcp add --transport http tide https://mcp.tide.org/mcp
else
  echo "Claude Code not found, skipping MCP. To add it later: claude mcp add --transport http tide https://mcp.tide.org/mcp"
fi

say "Starting TideCloak on http://localhost:8080"
if ! docker info >/dev/null 2>&1; then
  if [ "$(uname)" = Darwin ]; then
    open -a Docker
  elif [ -n "$WIN" ] && [ -f "/c/Program Files/Docker/Docker/Docker Desktop.exe" ]; then
    "/c/Program Files/Docker/Docker/Docker Desktop.exe" >/dev/null 2>&1 &
  fi
  for i in $(seq 1 40); do docker info >/dev/null 2>&1 && break; sleep 3; done
fi
docker info >/dev/null 2>&1 || die "Docker is not running."
mkdir -p .tide/data
# Docker Desktop on Windows needs a C:/... path for the bind mount, and Git Bash must not rewrite it.
DATA_DIR="$PWD/.tide/data"
[ -n "$WIN" ] && DATA_DIR="$(pwd -W)/.tide/data"
if docker ps -a --format '{{.Names}}' | grep -qx unfound-tidecloak; then
  docker start unfound-tidecloak >/dev/null
else
  MSYS_NO_PATHCONV=1 docker run --name unfound-tidecloak -d --restart unless-stopped -p 8080:8080 \
    -v "$DATA_DIR:/opt/keycloak/data/h2" \
    -e KC_BOOTSTRAP_ADMIN_USERNAME=admin -e KC_BOOTSTRAP_ADMIN_PASSWORD="$KC_BOOTSTRAP_ADMIN_PASSWORD" \
    tideorg/tidecloak-dev:latest >/dev/null
fi
for i in $(seq 1 60); do curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/ | grep -qE "200|302" && break; sleep 3; done

if [ ! -f .tide/realm-kit/init/tcinit.sh ]; then
  say "Fetching Tide's realm kit (answer TypeScript, and 'n' to 'Initialize TideCloak now?': this script does it next)"
  (cd .tide && npm init @tidecloak/nextjs@latest realm-kit)
fi
[ -f .tide/realm-kit/init/tcinit.sh ] || die "Tide's realm kit has no init/tcinit.sh. Look in .tide/realm-kit for the init script and tell us its path."

say "Provisioning realm '$REALM' (licence: $TIDE_LICENSE_EMAIL)"
echo "When it prints ACTION REQUIRED, open the link, create or sign in to your Tide account, and leave this running."
NEW_REALM_NAME="$REALM" SUBSCRIPTION_EMAIL="$TIDE_LICENSE_EMAIL" KC_USER=admin KC_PASSWORD="$KC_BOOTSTRAP_ADMIN_PASSWORD" \
  bash .tide/realm-kit/init/tcinit.sh || die "Realm provisioning failed. If the log says KEYGEN_FAILED / 'Not enough orks', Tide's network is busy: wait a minute, set TIDE_REALM to a new name and rerun."

say "Wiring the app to the realm"
TC_PASS="$KC_BOOTSTRAP_ADMIN_PASSWORD" node tools/tide-setup.mjs .tide/realm-kit "$REALM"

say "Starting Unfound on http://localhost:3000 (open /demo and choose 'With a Tide account')"
npm run dev
