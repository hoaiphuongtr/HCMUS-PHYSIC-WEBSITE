-- CreateTable
CREATE TABLE IF NOT EXISTS "PageLayout" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageLayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "WidgetInstance" (
    "id" TEXT NOT NULL,
    "widgetId" TEXT NOT NULL,
    "pageLayoutId" TEXT NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "order" INTEGER NOT NULL,
    "row" INTEGER NOT NULL DEFAULT 0,
    "colSpan" INTEGER NOT NULL DEFAULT 12,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WidgetInstance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PageLayout_slug_key" ON "PageLayout"("slug");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PageLayout_slug_idx" ON "PageLayout"("slug");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PageLayout_isPublished_idx" ON "PageLayout"("isPublished");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PageLayout_createdBy_idx" ON "PageLayout"("createdBy");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "WidgetInstance_pageLayoutId_idx" ON "WidgetInstance"("pageLayoutId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "WidgetInstance_widgetId_idx" ON "WidgetInstance"("widgetId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "WidgetInstance_order_idx" ON "WidgetInstance"("order");

-- AddForeignKey (idempotent — backfill safe for prod state)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PageLayout_createdBy_fkey') THEN
    ALTER TABLE "PageLayout" ADD CONSTRAINT "PageLayout_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WidgetInstance_widgetId_fkey') THEN
    ALTER TABLE "WidgetInstance" ADD CONSTRAINT "WidgetInstance_widgetId_fkey" FOREIGN KEY ("widgetId") REFERENCES "Widget"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WidgetInstance_pageLayoutId_fkey') THEN
    ALTER TABLE "WidgetInstance" ADD CONSTRAINT "WidgetInstance_pageLayoutId_fkey" FOREIGN KEY ("pageLayoutId") REFERENCES "PageLayout"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
