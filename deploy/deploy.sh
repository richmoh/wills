#!/usr/bin/env bash
#
# Deploy Wasiyyah to the VPS, where it is served at https://wasiyyahwills.com.
#
#   npm run deploy          # deploy this folder as it is now
#   npm run deploy:check    # show what a deploy would change; changes nothing
#
# The server's /var/www/wasiyyah IS the deployment (there are no release
# folders to roll back to), so the order is chosen to fail as early as it can:
# check the server → sync source → migrations → install and build → restart →
# checks. It stops at the first failure. Migrations run before the build
# because they only ever add things, so the running app is unaffected by them,
# whereas a build replaces the files the running app is serving: nothing may
# fail between the build and the restart.
set -euo pipefail

cd "$(dirname "$0")/.."

HOST=root@185.241.151.231
DIR=/var/www/wasiyyah
APP=wasiyyah                 # PM2 process name
PORT=3011
URL=https://wasiyyahwills.com
# path:expected-status pairs, checked on the server against 127.0.0.1:$PORT
# after the restart. /dashboard must redirect (307) when signed out: that shows
# the sign-in guard ran, not just that something is listening.
CHECKS="/:200 /pricing:200 /login:200 /dashboard:307"

DRY_RUN=no
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=yes ;;
    -h|--help) sed -n '3,12p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "unknown argument: $arg" >&2; exit 1 ;;
  esac
done

SSH=(ssh -o BatchMode=yes -o ConnectTimeout=15 "$HOST")

# What is sent is this folder, not a commit, so say what that is.
if git rev-parse --git-dir >/dev/null 2>&1; then
  dirty=$(git status --porcelain -uall | wc -l | tr -d ' ')
  echo "── Deploying this folder: commit $(git rev-parse --short HEAD) plus $dirty uncommitted file(s)"
fi

# ── Check the server before touching it. Setting NAMES only are examined or
# printed; values must not reach a terminal or a log.
echo "── Checking the server"
"${SSH[@]}" "bash -s -- '$DIR' '$URL'" <<'PREFLIGHT'
set -euo pipefail
DIR=$1 URL=$2
cd "$DIR"
[ -f .env.local ] || { echo "error: $DIR/.env.local is missing" >&2; exit 1; }
has() { grep -qE "^$1=.+" .env.local; }

missing=""
for key in DATABASE_URL SESSION_SECRET NEXT_PUBLIC_APP_URL; do
  has "$key" || missing="$missing $key"
done
[ -z "$missing" ] || { echo "error: .env.local has no value for:$missing" >&2; exit 1; }

# NEXT_PUBLIC_APP_URL is baked into the build, so a stale one goes live.
app_url=$(grep -E '^NEXT_PUBLIC_APP_URL=' .env.local | head -1 | cut -d= -f2- | tr -d '"')
[ "$app_url" = "$URL" ] || echo "   ! NEXT_PUBLIC_APP_URL is $app_url, not $URL: email links and page metadata will use it"
{ has POSTAL_API_KEY && has EMAIL_FROM; } || echo "   ! POSTAL_API_KEY / EMAIL_FROM not set: password-reset emails will not send"
{ has STRIPE_SECRET_KEY && has STRIPE_WEBHOOK_SECRET; } || echo "   ! Stripe keys not set: payments stay switched off"

# The nightly database copy fails silently if nobody looks, so look here.
if [ -x /usr/local/bin/wasiyyah-backup ]; then
  /usr/local/bin/wasiyyah-backup --status >/dev/null 2>&1 \
    || echo "   ! the nightly database backup is missing or stale: $(/usr/local/bin/wasiyyah-backup --status 2>&1 | head -1 || true)"
else
  echo "   ! the nightly database backup is not installed yet (a deploy installs it)"
fi

# Builds are the memory spike on a server with no swap, and when memory runs
# out the kernel may kill another app rather than this build.
avail=$(awk '/MemAvailable/{print int($2/1024)}' /proc/meminfo)
[ "$avail" -ge 1500 ] || echo "   ! only ${avail}MB of memory free and the server has no swap: the build may be killed"

echo "   ✓ server reachable, required settings present"
PREFLIGHT

# The contact address is on the site's pages, the will and the reset email. If
# its domain cannot receive mail, everyone who writes to it gets a bounce.
CONTACT=hello@wasiyyahwills.com
if command -v dig >/dev/null 2>&1 && [ -z "$(dig +short MX "${CONTACT#*@}" 2>/dev/null)" ]; then
  echo "   ! ${CONTACT#*@} has no mail (MX) record: email sent to $CONTACT bounces"
fi

# ── rsync. --delete stops removed files piling up on the server, so anything
# that lives only on the server must be excluded here or it is deleted. The
# server's .env.local is its own; no env file other than the example is sent.
RSYNC_ARGS=(-az --delete
  --exclude .git --exclude node_modules --exclude .next
  --include .env.example --exclude ".env*"
  --exclude tests/shots --exclude .DS_Store)

if [ "$DRY_RUN" = yes ]; then
  echo "── Dry run: what a deploy would change in $HOST:$DIR (nothing is changed)"
  rsync -n -v "${RSYNC_ARGS[@]}" ./ "$HOST:$DIR/"
  exit 0
fi

echo "── Syncing source"
rsync "${RSYNC_ARGS[@]}" ./ "$HOST:$DIR/"

echo "── Migrating, building, restarting"
"${SSH[@]}" "bash -s -- '$DIR' '$APP' '$PORT' '$CHECKS'" <<'REMOTE'
set -euo pipefail
DIR=$1 APP=$2 PORT=$3 CHECKS=$4
cd "$DIR"

# ── Migrations. The tables belong to the postgres superuser, and the app's own
# role may read and write them but not change them, so migrations run as
# postgres and the app's role is then granted the use of whatever they made.
# Every migration is idempotent (create/alter ... if not exists), so all of
# them run on each deploy. Only the database and role NAMES are taken from
# DATABASE_URL.
DATABASE_URL=$(grep -E '^DATABASE_URL=' .env.local | head -1 | cut -d= -f2- | tr -d '"')
DB_NAME=$(printf '%s' "$DATABASE_URL" | sed -E 's|^[a-z]+://[^/]+/([^?]+).*|\1|')
DB_USER=$(printf '%s' "$DATABASE_URL" | sed -E 's|^[a-z]+://([^:@/]+).*|\1|')

# Besides the nightly copies, keep one from just before each deploy: it is the
# one to go back to if this deploy's migrations turn out to be wrong.
mkdir -p /root/backups/wasiyyah
sudo -u postgres pg_dump -Fc "$DB_NAME" > "/root/backups/wasiyyah/db-$(date +%Y%m%d%H%M%S).dump"
ls -1t /root/backups/wasiyyah/db-*.dump | tail -n +11 | xargs -r rm --
echo "   ✓ database copied to /root/backups/wasiyyah (last 10 kept)"

# The nightly backup job is installed from the repo on every deploy, so the
# copy that runs can never drift from the one that is reviewed.
install -m 755 deploy/wasiyyah-backup.sh /usr/local/bin/wasiyyah-backup
install -m 644 deploy/wasiyyah-backup.cron /etc/cron.d/wasiyyah-backup
echo "   ✓ nightly backup job installed (03:10, $(/usr/local/bin/wasiyyah-backup --status 2>&1 | head -1 || true))"

for f in migrations/*.sql; do
  sudo -u postgres PGOPTIONS='-c client_min_messages=warning' \
    psql -d "$DB_NAME" -v ON_ERROR_STOP=1 -q < "$f"
  echo "   ✓ $f"
done
sudo -u postgres psql -d "$DB_NAME" -v ON_ERROR_STOP=1 -q -c \
  "grant all privileges on all tables in schema public to \"$DB_USER\"; grant all privileges on all sequences in schema public to \"$DB_USER\";"
# the app's own role must be able to reach what the code expects
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -Atqc "select 1 from users limit 1; select 1 from password_resets limit 1;" >/dev/null
echo "   ✓ the app can use the database"

corepack enable >/dev/null 2>&1 || true
pnpm install --frozen-lockfile
pnpm build

if pm2 describe "$APP" >/dev/null 2>&1; then
  pm2 restart "$APP" >/dev/null
else
  PORT="$PORT" pm2 start 'pnpm start' --name "$APP" >/dev/null
fi
# Without this the process is forgotten at the next reboot.
pm2 save >/dev/null

# Give the new process up to 30 seconds to answer before judging it.
for _ in $(seq 1 30); do
  curl -s -o /dev/null --max-time 2 "http://127.0.0.1:$PORT/" && break
  sleep 1
done

fails=0
for spec in $CHECKS; do
  path="${spec%:*}"; want="${spec##*:}"
  got=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "http://127.0.0.1:$PORT$path" || true)
  if [ "$got" = "$want" ]; then
    echo "   ✓ $path ($got)"
  else
    echo "   ✗ $path: expected $want, got $got"
    fails=$((fails + 1))
  fi
done

# "online" in PM2 proves nothing: the old build stays up through a failed
# restart. Every page the new build serves carries its build id.
BUILD_ID=$(cat .next/BUILD_ID)
if curl -s --max-time 15 "http://127.0.0.1:$PORT/" | grep -q "$BUILD_ID"; then
  echo "   ✓ the app is serving the new build ($BUILD_ID)"
else
  echo "   ✗ the app is not serving the build that was just made ($BUILD_ID)"
  fails=$((fails + 1))
fi

if [ "$fails" != 0 ]; then
  echo "── Checks FAILED. Last error lines from the app:"
  pm2 logs "$APP" --err --lines 30 --nostream || true
  echo "   There is no earlier release to roll back to: fix it and deploy again."
  exit 1
fi
REMOTE

# ── The same check from outside, through nginx and TLS.
echo "── Checking $URL"
BUILD_ID=$("${SSH[@]}" "cat '$DIR/.next/BUILD_ID'")
if curl -s --max-time 20 "$URL/" | grep -q "$BUILD_ID"; then
  echo "   ✓ $URL is serving the new build ($BUILD_ID)"
else
  echo "   ✗ $URL is not serving build $BUILD_ID. The app itself passed its checks, so look at nginx or DNS." >&2
  exit 1
fi

echo "── Deployed ✓  $URL"
