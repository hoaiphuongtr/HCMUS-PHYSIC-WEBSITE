-- Hồ sơ khoa học — xem docs/ho-so-khoa-hoc.md
--
-- Cộng thêm hoàn toàn + chạy lại nhiều lần vẫn an toàn: chỉ tạo enum/bảng mới và
-- thêm một giá trị vào enum Role. KHÔNG đụng vào bảng nào đang có dữ liệu.
--
-- Chạy:
--   docker compose -f docker-compose.sandbox.yml exec -T db \
--     psql -U <user> <db> -f - < backend/prisma/migrations/20260822_scholar_profile/migration.sql

-- ── Vai trò giảng viên ───────────────────────────────────────────────────────
-- Chỉ dùng cho app hồ sơ khoa học. RolesGuard chặn mặc định mọi route quản trị
-- không ghi rõ @Roles(RoleName.Lecturer) — phải deploy backend TRƯỚC khi tạo tài
-- khoản LECTURER đầu tiên.
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'LECTURER';

-- ── Enum mới ─────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "PublicationStatus" AS ENUM
    ('SUBMITTED', 'ACCEPTED', 'IN_PRESS', 'PUBLISHED', 'RETRACTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "AuthorClaimStatus" AS ENUM ('CONFIRMED', 'PENDING', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Lý lịch khoa học ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ScholarProfile" (
  "id"              TEXT PRIMARY KEY,
  "userId"          TEXT NOT NULL,
  "orcid"           TEXT,
  "scopusAuthorId"  TEXT,
  "researcherId"    TEXT,
  "googleScholarId" TEXT,
  "researchGateUrl" TEXT,
  "staffPageSlug"   TEXT,
  "showOnWeb"       BOOLEAN NOT NULL DEFAULT true,
  "lastOrcidSyncAt" TIMESTAMP(3),
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ScholarProfile_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "ScholarProfile_userId_key" ON "ScholarProfile" ("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "ScholarProfile_orcid_key"  ON "ScholarProfile" ("orcid");
CREATE INDEX IF NOT EXISTS "ScholarProfile_staffPageSlug_idx" ON "ScholarProfile" ("staffPageSlug");

-- ── Bộ tên thường dùng khi đăng báo ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ScholarNameVariant" (
  "id"         TEXT PRIMARY KEY,
  "profileId"  TEXT NOT NULL,
  "raw"        TEXT NOT NULL,
  "normalized" TEXT NOT NULL,
  "isPrimary"  BOOLEAN NOT NULL DEFAULT false,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ScholarNameVariant_profileId_fkey"
    FOREIGN KEY ("profileId") REFERENCES "ScholarProfile"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "ScholarNameVariant_profileId_normalized_key"
  ON "ScholarNameVariant" ("profileId", "normalized");
CREATE INDEX IF NOT EXISTS "ScholarNameVariant_normalized_idx"
  ON "ScholarNameVariant" ("normalized");

-- ── Công trình ───────────────────────────────────────────────────────────────
-- Một bài = một dòng, dùng chung cho mọi đồng tác giả trong Khoa.
CREATE TABLE IF NOT EXISTS "Publication" (
  "id"                 TEXT PRIMARY KEY,
  "doi"                TEXT,
  "arxivId"            TEXT,
  "isbn"               TEXT,
  "issn"               TEXT,
  "type"               TEXT NOT NULL DEFAULT 'journal-article',
  "title"              TEXT NOT NULL,
  "containerTitle"     TEXT,
  "volume"             TEXT,
  "issue"              TEXT,
  "pages"              TEXT,
  "publisher"          TEXT,
  "url"                TEXT,
  "status"             "PublicationStatus" NOT NULL DEFAULT 'PUBLISHED',
  "publishedYear"      INTEGER,
  "publishedMonth"     INTEGER,
  "acceptedYear"       INTEGER,
  "acceptedMonth"      INTEGER,
  "countYear"          INTEGER,
  "authorsRaw"         JSONB NOT NULL DEFAULT '[]'::jsonb,
  "source"             TEXT NOT NULL DEFAULT 'manual',
  "raw"                JSONB,
  "catalogCode"        TEXT,
  "quartile"           TEXT,
  "classifiedBy"       TEXT,
  "classifiedAt"       TIMESTAMP(3),
  "satellite"          BOOLEAN NOT NULL DEFAULT false,
  "reprint"            BOOLEAN NOT NULL DEFAULT false,
  "fromProject"        BOOLEAN NOT NULL DEFAULT false,
  "stage"              INTEGER NOT NULL DEFAULT 0,
  "totalAuthors"       INTEGER NOT NULL DEFAULT 1,
  "schoolAuthors"      INTEGER NOT NULL DEFAULT 1,
  "mainAuthorAtSchool" BOOLEAN NOT NULL DEFAULT false,
  "createdBy"          TEXT,
  "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt"          TIMESTAMP(3)
);
CREATE UNIQUE INDEX IF NOT EXISTS "Publication_doi_key"     ON "Publication" ("doi");
CREATE INDEX IF NOT EXISTS "Publication_countYear_idx"      ON "Publication" ("countYear");
CREATE INDEX IF NOT EXISTS "Publication_catalogCode_idx"    ON "Publication" ("catalogCode");
CREATE INDEX IF NOT EXISTS "Publication_status_idx"         ON "Publication" ("status");
CREATE INDEX IF NOT EXISTS "Publication_deletedAt_idx"      ON "Publication" ("deletedAt");
CREATE INDEX IF NOT EXISTS "Publication_issn_idx"           ON "Publication" ("issn");

-- ── Tác giả trong Khoa + cơ chế xác nhận ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS "PublicationAuthor" (
  "id"              TEXT PRIMARY KEY,
  "publicationId"   TEXT NOT NULL,
  "userId"          TEXT NOT NULL,
  "authorIndex"     INTEGER NOT NULL DEFAULT -1,
  "isFirst"         BOOLEAN NOT NULL DEFAULT false,
  "isCorresponding" BOOLEAN NOT NULL DEFAULT false,
  "isLast"          BOOLEAN NOT NULL DEFAULT false,
  "sharePercent"    INTEGER,
  "claimStatus"     "AuthorClaimStatus" NOT NULL DEFAULT 'PENDING',
  "invitedBy"       TEXT,
  "respondedAt"     TIMESTAMP(3),
  "showOnWeb"       BOOLEAN NOT NULL DEFAULT true,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PublicationAuthor_publicationId_fkey"
    FOREIGN KEY ("publicationId") REFERENCES "Publication"("id") ON DELETE CASCADE,
  CONSTRAINT "PublicationAuthor_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "PublicationAuthor_publicationId_userId_key"
  ON "PublicationAuthor" ("publicationId", "userId");
CREATE INDEX IF NOT EXISTS "PublicationAuthor_userId_claimStatus_idx"
  ON "PublicationAuthor" ("userId", "claimStatus");
