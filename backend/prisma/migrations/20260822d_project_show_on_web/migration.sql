-- Cờ hiển thị đề tài trên trang nhân sự, cùng ý nghĩa với PublicationAuthor.showOnWeb.
--
-- Vì sao là tệp riêng chứ không nối vào 20260822c: 20260822c ĐÃ CHẠY trên box rồi.
-- Sửa một migration đã chạy thì phần thêm vào không bao giờ được áp dụng — Prisma
-- ghi nhận nó "đã xong" theo tên, nên chỉ bỏ qua; còn nếu có đối chiếu checksum thì
-- lần chạy sau lại báo lỗi "migration đã bị sửa sau khi áp dụng". Đúng như đã xảy
-- ra 2026-08-22: màn Đề tài đổ lỗi `column ProjectMember.showOnWeb does not exist`
-- dù tệp trong kho mã có dòng ALTER đó.
--
-- Cộng thêm và chạy lại được nhiều lần, như mọi migration khác của phần này.
ALTER TABLE "ProjectMember"
  ADD COLUMN IF NOT EXISTS "showOnWeb" BOOLEAN NOT NULL DEFAULT true;
