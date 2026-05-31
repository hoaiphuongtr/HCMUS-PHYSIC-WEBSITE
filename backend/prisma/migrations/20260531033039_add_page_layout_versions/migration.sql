-- CreateEnum
CREATE TYPE "PageLayoutVersionStatus" AS ENUM ('CURRENT', 'ARCHIVED');

-- CreateTable
CREATE TABLE "PageLayoutVersion" (
    "id" TEXT NOT NULL,
    "pageLayoutId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "puckData" JSONB,
    "status" "PageLayoutVersionStatus" NOT NULL DEFAULT 'ARCHIVED',
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "publishedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageLayoutVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PageLayoutVersion_pageLayoutId_versionNumber_key" ON "PageLayoutVersion"("pageLayoutId", "versionNumber");

-- CreateIndex
CREATE INDEX "PageLayoutVersion_pageLayoutId_idx" ON "PageLayoutVersion"("pageLayoutId");

-- CreateIndex
CREATE INDEX "PageLayoutVersion_status_idx" ON "PageLayoutVersion"("status");

-- CreateIndex
CREATE INDEX "PageLayoutVersion_publishedAt_idx" ON "PageLayoutVersion"("publishedAt");

-- AddForeignKey
ALTER TABLE "PageLayoutVersion" ADD CONSTRAINT "PageLayoutVersion_pageLayoutId_fkey" FOREIGN KEY ("pageLayoutId") REFERENCES "PageLayout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageLayoutVersion" ADD CONSTRAINT "PageLayoutVersion_publishedBy_fkey" FOREIGN KEY ("publishedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
