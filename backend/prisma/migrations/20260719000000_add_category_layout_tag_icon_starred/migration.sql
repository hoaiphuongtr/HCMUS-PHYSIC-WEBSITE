-- Additive: PageLayout.categoryId (FK Category), Tag.icon, UserPreference.starred* arrays
ALTER TABLE "PageLayout" ADD COLUMN "categoryId" TEXT;
CREATE INDEX "PageLayout_categoryId_idx" ON "PageLayout"("categoryId");
ALTER TABLE "PageLayout" ADD CONSTRAINT "PageLayout_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Tag" ADD COLUMN "icon" TEXT;
ALTER TABLE "UserPreference" ADD COLUMN "starredLayoutIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "UserPreference" ADD COLUMN "starredWidgetIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
