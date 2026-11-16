#!/usr/bin/env bash
#
# Nightly copy of the Wasiyyah database, kept on the server.
#
# Live copy: /usr/local/bin/wasiyyah-backup, run by /etc/cron.d/wasiyyah-backup
# (see wasiyyah-backup.cron). This file is the source of truth: `npm run deploy`
# installs both on every deploy.
#
#   wasiyyah-backup            # take tonight's copy
#   wasiyyah-backup --status   # when the last good copy was taken; exits 1 if
#                              # it is more than 36 hours old
#
# What it keeps, in /root/backups/wasiyyah/nightly (readable by root only):
#   daily/    one per day, the last 30
#   monthly/  the copy from the 1st of each month, the last 12
#   last-success   the time and size of the last good copy
#
# What it does NOT do: these copies live on the same server as the database, so
# they cover a bad migration, a bug or a mistaken delete, not the loss of the
# server itself. An off-site copy needs somewhere to send it (see README).
#
# Restore: README → "Restoring the database".
set -euo pipefail

ENV_FILE=/var/www/wasiyyah/.env.local
DEST=/root/backups/wasiyyah/nightly
KEEP_DAILY=30
KEEP_MONTHLY=12
STALE_HOURS=36

ts() { date +"%Y-%m-%dT%H:%M:%S%z"; }

if [ "${1:-}" = "--status" ]; then
  if [ ! -f "$DEST/last-success" ]; then
    echo "no nightly backup has been taken yet"
    exit 1
  fi
  age_hours=$(( ( $(date +%s) - $(stat -c %Y "$DEST/last-success") ) / 3600 ))
  echo "$(cat "$DEST/last-success") (${age_hours}h ago)"
  [ "$age_hours" -lt "$STALE_HOURS" ]
  exit
fi

# Only the database NAME is taken from the app's settings; the dump is made as
# the postgres superuser, the same way a deploy does it.
DB_NAME=$(grep -m1 -E '^DATABASE_URL=' "$ENV_FILE" | cut -d= -f2- | tr -d '"' \
  | sed -E 's|^[a-z]+://[^/]+/([^?]+).*|\1|')
[ -n "$DB_NAME" ] || { echo "$(ts) FAILED: no database name in $ENV_FILE" >&2; exit 1; }

umask 077
mkdir -p "$DEST/daily" "$DEST/monthly"
DAY=$(date +%F)
TMP=$(mktemp "$DEST/.wasiyyah-XXXXXX.dump")
trap 'rm -f "$TMP"' EXIT

# Custom format, and checked to be a readable archive that holds the tables
# before it replaces anything. A dump that fails either test is thrown away.
sudo -u postgres pg_dump --format=custom "$DB_NAME" > "$TMP"
listing=$(pg_restore --list "$TMP")
for table in users wills payments; do
  printf '%s\n' "$listing" | grep -qE "TABLE DATA public $table " \
    || { echo "$(ts) FAILED: the dump has no data for the $table table" >&2; exit 1; }
done
BYTES=$(stat -c %s "$TMP")

cp -p "$TMP" "$DEST/daily/wasiyyah-$DAY.dump"
if [ "$(date +%d)" = "01" ]; then
  cp -p "$TMP" "$DEST/monthly/wasiyyah-$DAY.dump"
fi

# Retention: by count, newest first, so a run of failed nights never deletes
# the last good copies.
ls -1t "$DEST"/daily/wasiyyah-*.dump | tail -n +$((KEEP_DAILY + 1)) | xargs -r rm --
# (there is no monthly copy until the first 1st of a month)
{ ls -1t "$DEST"/monthly/wasiyyah-*.dump 2>/dev/null || true; } | tail -n +$((KEEP_MONTHLY + 1)) | xargs -r rm --

echo "last-success $(ts) db-bytes $BYTES" > "$DEST/last-success"
echo "$(ts) backup ok ($DB_NAME, $BYTES bytes, $(ls -1 "$DEST/daily" | wc -l) daily copies kept)"
