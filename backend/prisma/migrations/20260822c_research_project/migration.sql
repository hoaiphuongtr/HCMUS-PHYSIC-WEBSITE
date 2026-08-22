-- Đề tài, dự án NCKH — Bảng 2 của Phụ lục 2.
--
-- Cộng thêm hoàn toàn + chạy lại nhiều lần vẫn an toàn.
--
-- Chạy:
--   docker compose -f docker-compose.sandbox.yml exec -T db \
--     sh -c 'psql -U "$POSTGRES_USER" "$POSTGRES_DB"' \
--     < backend/prisma/migrations/20260822c_research_project/migration.sql

DO $$ BEGIN
  CREATE TYPE "ProjectRole" AS ENUM ('LEAD', 'SECRETARY', 'MEMBER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ProjectStatus" AS ENUM ('PROPOSED', 'ONGOING', 'COMPLETED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "ResearchProject" (
  "id"          TEXT PRIMARY KEY,
  "code"        TEXT,
  "title"       TEXT NOT NULL,
  "catalogCode" TEXT,
  "funder"      TEXT,
  -- Kinh phí VND: đề tài tiền tỷ vượt phạm vi int32.
  "budget"      BIGINT,
  "status"      "ProjectStatus" NOT NULL DEFAULT 'ONGOING',
  "startYear"   INTEGER,
  "startMonth"  INTEGER,
  "endYear"     INTEGER,
  "endMonth"    INTEGER,
  -- Số tháng thực hiện chính thức; Phụ lục 2 chia đều giờ cho từng tháng.
  "months"      INTEGER,
  "note"        TEXT,
  "createdBy"   TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt"   TIMESTAMP(3)
);
CREATE INDEX IF NOT EXISTS "ResearchProject_catalogCode_idx" ON "ResearchProject" ("catalogCode");
CREATE INDEX IF NOT EXISTS "ResearchProject_status_idx"      ON "ResearchProject" ("status");
CREATE INDEX IF NOT EXISTS "ResearchProject_deletedAt_idx"   ON "ResearchProject" ("deletedAt");

CREATE TABLE IF NOT EXISTS "ProjectMember" (
  "id"           TEXT PRIMARY KEY,
  "projectId"    TEXT NOT NULL,
  "userId"       TEXT NOT NULL,
  "role"         "ProjectRole" NOT NULL DEFAULT 'MEMBER',
  "sharePercent" INTEGER,
  "claimStatus"  "AuthorClaimStatus" NOT NULL DEFAULT 'PENDING',
  "invitedBy"    TEXT,
  "respondedAt"  TIMESTAMP(3),
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProjectMember_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "ResearchProject"("id") ON DELETE CASCADE,
  CONSTRAINT "ProjectMember_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "ProjectMember_projectId_userId_key"
  ON "ProjectMember" ("projectId", "userId");
CREATE INDEX IF NOT EXISTS "ProjectMember_userId_claimStatus_idx"
  ON "ProjectMember" ("userId", "claimStatus");

-- Cờ hiển thị đề tài trên trang nhân sự, cùng ý nghĩa với PublicationAuthor.showOnWeb.
ALTER TABLE "ProjectMember"
  ADD COLUMN IF NOT EXISTS "showOnWeb" BOOLEAN NOT NULL DEFAULT true;
