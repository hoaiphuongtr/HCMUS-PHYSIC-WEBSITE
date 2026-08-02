-- Một trang tin nằm dưới NHIỀU danh mục mà vẫn chỉ có MỘT URL.
--
-- Trước đây muốn bài xuất hiện ở 2 danh mục thì phải tạo 2 layout, mà 2 layout
-- không thể trùng slug (publish sẽ từ chối) nên cái thứ hai bị thêm hậu tố "-2"
-- → cùng một nội dung nằm ở 2 URL. Bảng nối này gỡ ràng buộc đó.
--
-- PageLayout.categoryId giữ nguyên vai trò danh mục CHÍNH (breadcrumb).
CREATE TABLE IF NOT EXISTS "PageLayoutCategoryLink" (
  "pageLayoutId" TEXT NOT NULL,
  "categoryId"   TEXT NOT NULL,
  CONSTRAINT "PageLayoutCategoryLink_pkey" PRIMARY KEY ("pageLayoutId","categoryId")
);

CREATE INDEX IF NOT EXISTS "PageLayoutCategoryLink_categoryId_idx"
  ON "PageLayoutCategoryLink"("categoryId");

DO $$ BEGIN
  ALTER TABLE "PageLayoutCategoryLink"
    ADD CONSTRAINT "PageLayoutCategoryLink_pageLayoutId_fkey"
    FOREIGN KEY ("pageLayoutId") REFERENCES "PageLayout"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "PageLayoutCategoryLink"
    ADD CONSTRAINT "PageLayoutCategoryLink_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Chép danh mục hiện có sang bảng nối để không layout nào mất phân loại.
INSERT INTO "PageLayoutCategoryLink" ("pageLayoutId","categoryId")
SELECT id, "categoryId" FROM "PageLayout" WHERE "categoryId" IS NOT NULL
ON CONFLICT DO NOTHING;
