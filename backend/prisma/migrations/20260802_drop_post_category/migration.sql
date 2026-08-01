-- Danh mục chuyển từ BÀI sang LAYOUT.
--
-- Trang công khai lấy danh mục của layout mà bài được rót vào, nên một bài rót
-- vào nhiều layout sẽ hiện dưới nhiều danh mục (vd vừa "Câu lạc bộ" vừa "Tin
-- khoa học"), và breadcrumb của mỗi trang hiện đúng danh mục của trang đó.
-- Post.categoryId không còn chỗ dùng.
--
-- Trước khi chạy: chép danh mục của bài sang layout nào chưa có, để không mất
-- phân loại của dữ liệu cũ (đã chạy sẵn trên sandbox, ở đây để chạy lại được
-- trên môi trường khác).
UPDATE "PageLayout" l
SET "categoryId" = p."categoryId"
FROM "Post" p
WHERE l."sourcePostId" = p.id
  AND l."categoryId" IS NULL
  AND p."categoryId" IS NOT NULL;

ALTER TABLE "Post" DROP CONSTRAINT IF EXISTS "Post_categoryId_fkey";
DROP INDEX IF EXISTS "Post_categoryId_idx";
ALTER TABLE "Post" DROP COLUMN IF EXISTS "categoryId";
