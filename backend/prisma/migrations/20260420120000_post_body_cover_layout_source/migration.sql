-- AlterTable: Post new content fields
ALTER TABLE "Post"
  ADD COLUMN IF NOT EXISTS "body" TEXT,
  ADD COLUMN IF NOT EXISTS "coverMediaId" TEXT,
  ADD COLUMN IF NOT EXISTS "coverUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "coverAlt" TEXT;

-- FK: Post.coverMediaId -> Media(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Post_coverMediaId_fkey'
  ) THEN
    ALTER TABLE "Post"
      ADD CONSTRAINT "Post_coverMediaId_fkey"
      FOREIGN KEY ("coverMediaId") REFERENCES "Media"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Post_coverMediaId_idx" ON "Post"("coverMediaId");

-- AlterTable: PageLayout.sourcePostId
ALTER TABLE "PageLayout"
  ADD COLUMN IF NOT EXISTS "sourcePostId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PageLayout_sourcePostId_fkey'
  ) THEN
    ALTER TABLE "PageLayout"
      ADD CONSTRAINT "PageLayout_sourcePostId_fkey"
      FOREIGN KEY ("sourcePostId") REFERENCES "Post"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "PageLayout_sourcePostId_idx" ON "PageLayout"("sourcePostId");
