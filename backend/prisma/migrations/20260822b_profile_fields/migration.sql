-- Quan hệ công tác + đang học sau đại học — bổ sung cho ScholarProfile.
--
-- Nhiều giảng viên vừa dạy vừa làm nghiên cứu sinh. Thông tin này cần cho trang
-- nhân sự, và `gradStudyFullTime` là dữ kiện ảnh hưởng tới định mức nhiệm vụ nên
-- tách hẳn ra cột riêng thay vì nhét vào ghi chú.
--
-- Cộng thêm hoàn toàn + chạy lại nhiều lần vẫn an toàn.
--
-- Chạy:
--   docker compose -f docker-compose.sandbox.yml exec -T db \
--     sh -c 'psql -U "$POSTGRES_USER" "$POSTGRES_DB"' \
--     < backend/prisma/migrations/20260822b_grad_study/migration.sql

DO $$ BEGIN
  CREATE TYPE "GradStudyLevel" AS ENUM ('MASTER', 'PHD', 'POSTDOC');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Cơ hữu / kiêm nhiệm / thỉnh giảng. KHÔNG đặt mặc định: để trống nghĩa là chưa
-- khai, còn hơn đoán bừa rồi tính nhầm người thỉnh giảng vào định mức của Khoa.
DO $$ BEGIN
  CREATE TYPE "AffiliationType" AS ENUM ('FULL_TIME', 'JOINT', 'VISITING');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "ScholarProfile"
  ADD COLUMN IF NOT EXISTS "affiliationType"      "AffiliationType",
  ADD COLUMN IF NOT EXISTS "homeInstitution"      TEXT,
  ADD COLUMN IF NOT EXISTS "gradStudyLevel"       "GradStudyLevel",
  ADD COLUMN IF NOT EXISTS "gradStudyField"       TEXT,
  ADD COLUMN IF NOT EXISTS "gradStudyInstitution" TEXT,
  ADD COLUMN IF NOT EXISTS "gradStudyCountry"     TEXT,
  ADD COLUMN IF NOT EXISTS "gradStudyStartYear"   INTEGER,
  ADD COLUMN IF NOT EXISTS "gradStudyEndYear"     INTEGER,
  ADD COLUMN IF NOT EXISTS "gradStudyFullTime"    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "gradStudyNote"        TEXT;
