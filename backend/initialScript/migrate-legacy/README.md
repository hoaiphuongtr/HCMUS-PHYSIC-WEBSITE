# Legacy Migration (feat-013)

Migrates the legacy MariaDB dump (`phys_db_*.sql.gz`) into the new Postgres
schema. Idempotent via `legacyId`: re-running the script never duplicates,
only inserts missing rows and updates existing ones.

## Prerequisites

1. **Docker** running. The legacy dump is restored into a temp MariaDB.
2. **Postgres** running locally (the harness DB the new app already uses).
3. Legacy dump file extracted to `dump/legacy.sql`.

## Steps

```bash
# 1. Boot temp MariaDB and restore dump
docker rm -f legacy-mariadb 2>/dev/null
docker run -d --name legacy-mariadb \
  -e MARIADB_ROOT_PASSWORD=root \
  -p 3309:3306 mariadb:10.6
until docker exec legacy-mariadb mariadb-admin ping -uroot -proot \
  2>/dev/null | grep -q alive; do sleep 2; done
docker exec legacy-mariadb mariadb -uroot -proot \
  -e "CREATE DATABASE legacy CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci;"
docker cp dump/legacy.sql legacy-mariadb:/tmp/legacy.sql
docker exec legacy-mariadb sh -c \
  "mariadb -uroot -proot legacy < /tmp/legacy.sql"

# 2. Run the migration
cd backend
pnpm tsx initialScript/migrate-legacy/run.ts

# 3. Optionally drop the temp MariaDB
docker rm -f legacy-mariadb
```

## What it does

- **Departments** — upserts every `depts` row, joining `deptslang` for VI/EN.
- **Users** — copies `users` rows. Password hash kept as-is (legacy bcrypt
  hash incompatible with new Argon2 hash format — users need a password
  reset on first login; documented in the User Decisions log).
- **Categories** — every `categories` row joined with `categorieslang` becomes
  a `Category` row. Reuses the 5 default `cat_default_*` cuids seeded in P1
  when the slug matches; otherwise inserts a fresh cuid.
- **Posts** — every `posts` row joined with `postslang` becomes a new Post.
  `title/body/excerpt` become localized JSON. `coverUrl` carries the legacy
  image path (P4 downloads them locally).

## Skipped tables

- `attributes`, `calendars`, `classes`, `homes`, `links`, `majors`, `menus`,
  `partners`, `slideshows`, `staffs` — out of scope for this migration; the
  new system models content differently.
- `notification`, `online`, `slogs`, `tokens`, `userlogs`, `widgets`,
  `widgetslang` — runtime state, not migrated.

## Reverting

```bash
psql ... -c "DELETE FROM \"Post\" WHERE \"legacyId\" IS NOT NULL;
            DELETE FROM \"Category\" WHERE \"legacyId\" IS NOT NULL
              AND id NOT LIKE 'cat_default_%';
            DELETE FROM \"User\" WHERE id LIKE 'legacy_%';
            DELETE FROM \"Department\" WHERE id LIKE 'dept_legacy_%';"
```
