-- Số quyết định phê duyệt đề tài.
--
-- Bảng 2 của Phụ lục 2 chỉ tính giờ cho đề tài "đang triển khai (trong thời gian
-- ĐƯỢC PHÊ DUYỆT)" — tr. 2.6. Quyết định phê duyệt là căn cứ của mốc thời gian,
-- mà mốc thời gian lại là mẫu số chia giờ theo năm học, nên nó là dữ kiện chứ
-- không phải giấy tờ trang trí.
--
-- Cộng thêm, chạy lại được nhiều lần.
ALTER TABLE "ResearchProject"
  ADD COLUMN IF NOT EXISTS "decisionNo" TEXT;
