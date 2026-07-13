-- Rename the Puck component types SiteHeader -> Header and SiteFooter -> Footer
-- across every stored layout. The Puck registry keys were renamed in
-- frontend/src/views/admin/widgets-layout/{puck-config.tsx,components/site-syndication.tsx};
-- saved layouts reference components by that `type`, so the stored JSON must match or
-- the blocks stop rendering. This is a pure key rename — no props change.
--
-- Idempotent (re-running is a no-op once migrated) and reversible (swap the arguments).
-- Run against each database that holds layouts (dev + any deployed box):
--   psql "$DATABASE_URL" -f rename-header-footer-puck-types.sql
--
-- jsonb::text normalises to `"type": "SiteHeader"` (one space after the colon), so this
-- exact-fragment replace is safe and matches nested occurrences too.

UPDATE "PageLayout"
SET "puckData" = replace(
                   replace("puckData"::text, '"type": "SiteHeader"', '"type": "Header"'),
                   '"type": "SiteFooter"', '"type": "Footer"'
                 )::jsonb
WHERE "puckData"::text LIKE '%"type": "Site%';

UPDATE "PageLayout"
SET "publishedPuckData" = replace(
                            replace("publishedPuckData"::text, '"type": "SiteHeader"', '"type": "Header"'),
                            '"type": "SiteFooter"', '"type": "Footer"'
                          )::jsonb
WHERE "publishedPuckData" IS NOT NULL
  AND "publishedPuckData"::text LIKE '%"type": "Site%';
