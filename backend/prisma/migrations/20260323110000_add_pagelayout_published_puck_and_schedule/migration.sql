-- AlterTable (idempotent)
ALTER TABLE "PageLayout" ADD COLUMN IF NOT EXISTS "publishedPuckData" JSONB;
ALTER TABLE "PageLayout" ADD COLUMN IF NOT EXISTS "scheduledAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PageLayout_scheduledAt_idx" ON "PageLayout"("scheduledAt");
