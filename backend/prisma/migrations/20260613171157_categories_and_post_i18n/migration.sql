-- ─────────────────────────────────────────────────────────────────────────
-- feat-013 step 1: Category model + Post i18n JSON + legacyId.
-- Idempotent — re-runnable on partial state.
-- ─────────────────────────────────────────────────────────────────────────

-- Category table
CREATE TABLE IF NOT EXISTS "Category" (
  "id"        TEXT NOT NULL,
  "slug"      TEXT NOT NULL,
  "name"      JSONB NOT NULL,
  "excerpt"   JSONB,
  "image"     TEXT,
  "legacyId"  INTEGER,
  "status"    BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Category_slug_key" ON "Category"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "Category_legacyId_key" ON "Category"("legacyId");
CREATE INDEX IF NOT EXISTS "Category_slug_idx" ON "Category"("slug");

-- Seed default categories (idempotent)
INSERT INTO "Category" ("id", "slug", "name") VALUES
  ('cat_default_educational',   'educational-news',       '{"vi": "Tin học vụ", "en": "Educational News"}'::jsonb),
  ('cat_default_scientific',    'scientific-information', '{"vi": "Tin khoa học", "en": "Scientific Information"}'::jsonb),
  ('cat_default_recruitment',   'recruitment',            '{"vi": "Tuyển dụng", "en": "Recruitment"}'::jsonb),
  ('cat_default_event',         'event',                  '{"vi": "Sự kiện", "en": "Event"}'::jsonb),
  ('cat_default_scholarship',   'scholarship',            '{"vi": "Học bổng", "en": "Scholarship"}'::jsonb)
ON CONFLICT ("id") DO NOTHING;

-- Post: add categoryId + legacyId if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Post' AND column_name = 'categoryId') THEN
    ALTER TABLE "Post" ADD COLUMN "categoryId" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Post' AND column_name = 'legacyId') THEN
    ALTER TABLE "Post" ADD COLUMN "legacyId" INTEGER;
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS "Post_legacyId_key" ON "Post"("legacyId");

-- Backfill categoryId from old enum if column still exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Post' AND column_name = 'category') THEN
    UPDATE "Post" SET "categoryId" = 'cat_default_educational' WHERE "category"::text = 'EDUCATIONAL_NEWS' AND "categoryId" IS NULL;
    UPDATE "Post" SET "categoryId" = 'cat_default_scientific'  WHERE "category"::text = 'SCIENTIFIC_INFORMATION' AND "categoryId" IS NULL;
    UPDATE "Post" SET "categoryId" = 'cat_default_recruitment' WHERE "category"::text = 'RECRUITMENT' AND "categoryId" IS NULL;
    UPDATE "Post" SET "categoryId" = 'cat_default_event'       WHERE "category"::text = 'EVENT' AND "categoryId" IS NULL;
    UPDATE "Post" SET "categoryId" = 'cat_default_scholarship' WHERE "category"::text = 'SCHOLARSHIP' AND "categoryId" IS NULL;
  END IF;
END $$;

-- Safety fallback
UPDATE "Post" SET "categoryId" = 'cat_default_educational' WHERE "categoryId" IS NULL;

-- Enforce NOT NULL + FK + index
ALTER TABLE "Post" ALTER COLUMN "categoryId" SET NOT NULL;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Post_categoryId_fkey') THEN
    ALTER TABLE "Post" ADD CONSTRAINT "Post_categoryId_fkey"
      FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS "Post_categoryId_idx" ON "Post"("categoryId");

-- UserPreference.categories: enum array → text array (must precede DROP TYPE)
DO $$
DECLARE
  current_type text;
BEGIN
  SELECT data_type INTO current_type FROM information_schema.columns
    WHERE table_name = 'UserPreference' AND column_name = 'categories';
  IF current_type = 'ARRAY' THEN
    -- Detect element type; only convert if it's the enum
    IF EXISTS (
      SELECT 1 FROM pg_attribute a
        JOIN pg_class c ON a.attrelid = c.oid
        JOIN pg_type t ON a.atttypid = t.oid
        WHERE c.relname = 'UserPreference' AND a.attname = 'categories'
          AND t.typname = '_PostCategory'
    ) THEN
      ALTER TABLE "UserPreference" ALTER COLUMN "categories"
        TYPE TEXT[] USING "categories"::TEXT[];
    END IF;
  END IF;
END $$;

-- Drop old enum column on Post + enum type
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Post' AND column_name = 'category') THEN
    DROP INDEX IF EXISTS "Post_category_idx";
    ALTER TABLE "Post" DROP COLUMN "category";
  END IF;
END $$;
DROP TYPE IF EXISTS "PostCategory";

-- Convert Post.title/body/excerpt → JSONB { "vi": <old value> } (only if still TEXT)
DO $$
DECLARE
  t text;
BEGIN
  SELECT data_type INTO t FROM information_schema.columns WHERE table_name = 'Post' AND column_name = 'title';
  IF t <> 'jsonb' THEN
    ALTER TABLE "Post" ALTER COLUMN "title" TYPE JSONB USING jsonb_build_object('vi', "title");
  END IF;
  SELECT data_type INTO t FROM information_schema.columns WHERE table_name = 'Post' AND column_name = 'body';
  IF t <> 'jsonb' THEN
    ALTER TABLE "Post" ALTER COLUMN "body" TYPE JSONB
      USING CASE WHEN "body" IS NULL THEN NULL ELSE jsonb_build_object('vi', "body") END;
  END IF;
  SELECT data_type INTO t FROM information_schema.columns WHERE table_name = 'Post' AND column_name = 'excerpt';
  IF t <> 'jsonb' THEN
    ALTER TABLE "Post" ALTER COLUMN "excerpt" TYPE JSONB
      USING CASE WHEN "excerpt" IS NULL THEN NULL ELSE jsonb_build_object('vi', "excerpt") END;
  END IF;
END $$;
