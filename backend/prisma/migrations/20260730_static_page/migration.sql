-- Standalone HTML pages (event microsites etc.) served on the public domain
-- without the Puck layout designer. Additive + idempotent — safe to run on the
-- restored production DB (creates one new table, touches nothing else). Apply with:
--   docker compose ... exec -T db psql -U physics hcmus_physics \
--     -f - < backend/prisma/migrations/20260730_static_page/migration.sql
-- or paste the CREATE TABLE via `psql -c`.
CREATE TABLE IF NOT EXISTS "StaticPage" (
  "id"          TEXT PRIMARY KEY,
  "slug"        TEXT NOT NULL,
  "title"       TEXT NOT NULL,
  "html"        TEXT NOT NULL,
  "renderMode"  TEXT NOT NULL DEFAULT 'iframe',
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "createdBy"   TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- @unique on slug in the Prisma model → index name Prisma expects.
CREATE UNIQUE INDEX IF NOT EXISTS "StaticPage_slug_key" ON "StaticPage" ("slug");
CREATE INDEX IF NOT EXISTS "StaticPage_isPublished_idx" ON "StaticPage" ("isPublished");
