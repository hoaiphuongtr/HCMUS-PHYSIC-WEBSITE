#!/usr/bin/env bash
# backup-db.sh — dump the HCMUS Physics CMS PostgreSQL database.
#
# Runs ON the sandbox box (where the DB container lives). Writes a
# timestamped gzip dump and keeps the most recent $KEEP copies.
#
# One-off:   ./backup-db.sh
# Cron:      0 2 * * *  /home/vlkt/deploy/backup-db.sh >> /home/vlkt/db-backups/backup.log 2>&1
#
# Restore:   gunzip -c hcmus_physics_YYYYmmdd_HHMMSS.sql.gz \
#              | docker exec -i hcmus-cms-db-1 psql -U physics -d hcmus_physics
set -euo pipefail

DB_CONTAINER="${DB_CONTAINER:-hcmus-cms-db-1}"
DB_USER="${DB_USER:-physics}"
DB_NAME="${DB_NAME:-hcmus_physics}"
BACKUP_DIR="${BACKUP_DIR:-$HOME/db-backups}"
KEEP="${KEEP:-30}"                 # keep last N dumps

mkdir -p "$BACKUP_DIR"
TS="$(date +%Y%m%d_%H%M%S)"
OUT="$BACKUP_DIR/${DB_NAME}_${TS}.sql.gz"

echo "[$(date '+%F %T')] dumping $DB_NAME from $DB_CONTAINER -> $OUT"

# --clean --if-exists makes the dump self-contained for a clean restore.
# --no-owner/--no-acl keep it portable across roles.
docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" \
    --clean --if-exists --no-owner --no-acl \
  | gzip -9 > "$OUT.tmp"

# Only promote if non-trivial (guard against an empty/failed dump clobbering good ones)
SIZE=$(stat -c%s "$OUT.tmp" 2>/dev/null || echo 0)
if [ "$SIZE" -lt 2000 ]; then
  echo "[$(date '+%F %T')] ERROR: dump too small (${SIZE}B) — keeping .tmp for inspection, not rotating"
  exit 1
fi
mv "$OUT.tmp" "$OUT"
echo "[$(date '+%F %T')] wrote $OUT (${SIZE} bytes)"

# Rotate: keep newest $KEEP
ls -1t "$BACKUP_DIR"/${DB_NAME}_*.sql.gz 2>/dev/null | tail -n +$((KEEP+1)) | while read -r old; do
  echo "[$(date '+%F %T')] pruning old backup: $old"
  rm -f "$old"
done

echo "[$(date '+%F %T')] done. current backups:"
ls -1t "$BACKUP_DIR"/${DB_NAME}_*.sql.gz 2>/dev/null | head -5
