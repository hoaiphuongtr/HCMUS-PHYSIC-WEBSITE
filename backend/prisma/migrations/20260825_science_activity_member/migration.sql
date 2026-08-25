-- Đồng thực hiện hoạt động Bảng 3 (đồng hướng dẫn SV đạt giải, đồng chủ trì…).
--
-- CỘNG THÊM, không đụng gì đang có: một bảng, hai chỉ mục, hai khoá ngoại.
-- Chạy lại nhiều lần không hỏng (IF NOT EXISTS / DO block) — CSDL khôi phục từ
-- bản chạy thật.

CREATE TABLE IF NOT EXISTS "ScienceActivityMember" (
  "id"          TEXT NOT NULL,
  "activityId"  TEXT NOT NULL,
  "userId"      TEXT NOT NULL,
  "role"        TEXT,
  "claimStatus" "AuthorClaimStatus" NOT NULL DEFAULT 'PENDING',
  "invitedBy"   TEXT,
  "respondedAt" TIMESTAMP(3),
  "showOnWeb"   BOOLEAN NOT NULL DEFAULT true,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ScienceActivityMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ScienceActivityMember_activityId_userId_key"
  ON "ScienceActivityMember"("activityId", "userId");
CREATE INDEX IF NOT EXISTS "ScienceActivityMember_userId_claimStatus_idx"
  ON "ScienceActivityMember"("userId", "claimStatus");

DO $$ BEGIN
  ALTER TABLE "ScienceActivityMember"
    ADD CONSTRAINT "ScienceActivityMember_activityId_fkey"
    FOREIGN KEY ("activityId") REFERENCES "ScienceActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ScienceActivityMember"
    ADD CONSTRAINT "ScienceActivityMember_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
