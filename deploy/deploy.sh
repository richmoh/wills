#!/usr/bin/env bash
# Deploy Wasiyyah to the VPS.
# Usage: ./deploy/deploy.sh  (run from the repo root on your machine)
set -euo pipefail

HOST=root@185.241.151.231
DIR=/var/www/wasiyyah

echo "→ syncing source"
rsync -az --delete \
  --exclude node_modules --exclude .next --exclude .git \
  --exclude .env.local --exclude tests/shots \
  ./ "$HOST:$DIR/"

echo "→ building on server"
ssh "$HOST" "set -e; cd $DIR; corepack enable >/dev/null 2>&1 || true; pnpm install --frozen-lockfile; pnpm build"

echo "→ restarting app"
ssh "$HOST" "cd $DIR && (pm2 restart wasiyyah --update-env 2>/dev/null || PORT=3011 pm2 start 'pnpm start' --name wasiyyah) && pm2 save"

echo "✓ deployed — https://wills.themuslimguide.org"
