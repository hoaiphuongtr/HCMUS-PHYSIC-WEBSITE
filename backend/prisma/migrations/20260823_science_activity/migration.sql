-- Hoạt động KHCN khác — Bảng 3 của Phụ lục 2 (65/106 mã).
--
-- CỘNG THÊM và chạy lại được nhiều lần, như mọi migration của phần hồ sơ khoa
-- học: cơ sở dữ liệu này là bản phục hồi từ production, không được phép có bước
-- nào phá dữ liệu sẵn có.

CREATE TABLE IF NOT EXISTS "ScienceActivity" (
  "id"          TEXT PRIMARY KEY,
  "userId"      TEXT NOT NULL,

  "catalogCode" TEXT NOT NULL,
  "title"       TEXT NOT NULL,
  "level"       TEXT,
  "role"        TEXT,
  "organizer"   TEXT,
  "decisionNo"  TEXT,

  "year"        INTEGER,
  "month"       INTEGER,

  "note"        TEXT,
  "url"         TEXT,

  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt"   TIMESTAMP(3),

  CONSTRAINT "ScienceActivity_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "ScienceActivity_userId_idx"       ON "ScienceActivity" ("userId");
CREATE INDEX IF NOT EXISTS "ScienceActivity_catalogCode_idx"  ON "ScienceActivity" ("catalogCode");
CREATE INDEX IF NOT EXISTS "ScienceActivity_deletedAt_idx"    ON "ScienceActivity" ("deletedAt");
CREATE INDEX IF NOT EXISTS "ScienceActivity_userId_year_idx"  ON "ScienceActivity" ("userId", "year");
