-- Drop unique constraint/index on slug so draft+published copies can coexist
ALTER TABLE "PageLayout" DROP CONSTRAINT IF EXISTS "PageLayout_slug_key";
DROP INDEX IF EXISTS "PageLayout_slug_key";

-- Partial unique index: only one published layout per slug
CREATE UNIQUE INDEX IF NOT EXISTS "PageLayout_slug_published_unique"
  ON "PageLayout"("slug")
  WHERE "isPublished" = true;
