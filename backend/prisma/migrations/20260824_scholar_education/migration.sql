-- Quá trình đào tạo của giảng viên.
--
-- CỘNG THÊM, không đụng gì đang có: một enum bậc, một enum nguồn, một bảng.
-- Chạy lại nhiều lần không hỏng (IF NOT EXISTS / DO block), vì đây là CSDL khôi
-- phục từ bản chạy thật.

DO $$ BEGIN
  CREATE TYPE "EducationLevel" AS ENUM ('BACHELOR','ENGINEER','MASTER','PHD','POSTDOC','OTHER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "EducationSource" AS ENUM ('SELF','STAFF_PAGE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "ScholarEducation" (
  "id"          TEXT NOT NULL,
  "profileId"   TEXT NOT NULL,
  "level"       "EducationLevel" NOT NULL,
  "field"       TEXT,
  "institution" TEXT NOT NULL,
  "country"     TEXT,
  "year"        INTEGER,
  "note"        TEXT,
  "source"      "EducationSource" NOT NULL DEFAULT 'SELF',
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ScholarEducation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ScholarEducation_profileId_idx" ON "ScholarEducation"("profileId");

DO $$ BEGIN
  ALTER TABLE "ScholarEducation"
    ADD CONSTRAINT "ScholarEducation_profileId_fkey"
    FOREIGN KEY ("profileId") REFERENCES "ScholarProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
