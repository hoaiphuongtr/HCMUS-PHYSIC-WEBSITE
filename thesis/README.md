# Bản thảo KLTN — trạng thái & hướng dẫn ghép vào Word

Bản nháp đầy đủ theo email góp ý của GVHD (07/2026): đúng phân bổ trang, Chương 3 gồm
thiết kế + hiện thực, Chương 4 có mục kiểm thử chức năng, Mở đầu không trùng ý Chương 1.

## Thứ tự ghép vào `KLTN_BANCHINHTHUC.docx`

| Tệp | Thay cho phần nào trong docx | Dung lượng gợi ý của cô |
|---|---|---|
| `00-loi-mo-dau.md` | LỜI MỞ ĐẦU (đang là văn bản mẫu) | 1–2 trang |
| `01-chuong-1-tong-quan.md` | CHƯƠNG 1 | 4–5 trang |
| `02-chuong-2-co-so-ly-thuyet.md` | CHƯƠNG 2 | 8–10 trang |
| `03-chuong-3-thiet-ke-va-hien-thuc.md` | CHƯƠNG 3 — **đổi tên chương thành "THIẾT KẾ VÀ HIỆN THỰC HỆ THỐNG"** (cập nhật cả MỤC LỤC) | 22–28 trang |
| `04-chuong-4-danh-gia-ket-qua.md` | CHƯƠNG 4 — mục lục cần thêm 4.2 Kiểm thử chức năng, đánh số lại 4.3–4.7 | 10–14 trang |
| `05-ket-luan-va-kien-nghi.md` | KẾT LUẬN VÀ KIẾN NGHỊ | 2–3 trang |
| `06-tai-lieu-tham-khao.md` | DANH MỤC TÀI LIỆU THAM KHẢO | — |

Định dạng theo quy định trong docx mẫu: Times New Roman 13, giãn dòng 1,5; chú thích bảng đặt TRÊN bảng, chú thích hình đặt DƯỚI hình.

## Hình cần tạo/chụp (11 hình — đều có chỉ dẫn tại chỗ trong bản thảo)

- H3.1 Kiến trúc ba tầng, H3.2 module NestJS, H3.3 ERD rút gọn, H3.6 luồng post→publish:
  xuất PNG từ các sơ đồ Mermaid trong `docs/architecture.md` (mermaid.live → PNG).
- H3.4 luồng đăng nhập JWT, H3.5 máy trạng thái bài viết, H3.10 quy trình di trú,
  H3.11 sơ đồ triển khai Docker: vẽ mới (draw.io/Canva) theo mô tả trong bài.
- H3.7 / H3.8 / H3.9: ảnh chụp màn hình đăng nhập, Visual Builder, trang công khai
  (chạy `pnpm dev`, chụp :3000 và :3002).

## Bảng đã có sẵn trong văn bản (8 bảng)

3.1 yêu cầu · 3.2 bảng dữ liệu chính · 3.3 ma trận phân quyền · 3.4 ánh xạ di trú ·
3.5 tầng đệm · 4.1 công cụ đo · 4.2–4.5 kịch bản kiểm thử (CRUD/quyền/xuất bản/di trú) ·
4.6 so sánh cũ–mới · 4.7 đối chiếu mục tiêu.

## Placeholder còn treo 【CHƯA ĐO】 — tất cả chờ MỘT điều kiện: tên miền công khai

| Vị trí | Chỉ số | Cách đo khi có domain |
|---|---|---|
| 4.3 | LCP / INP(TBT) / CLS / FCP / TTFB | Lighthouse mobile trên 4 trang đại diện |
| 4.4 | 4 điểm Lighthouse × 4 trang | Lighthouse / PageSpeed Insights |
| 4.5.1 | MDN HTTP Observatory | cần HTTPS |
| 4.5.2 | SSL Labs | cần chứng chỉ TLS |
| 4.6.2 | Schema.org / Rich Results Test | cần URL truy cập từ Internet |
| 4.7.1 | Lighthouse site cũ vs mới | đo cùng thời điểm, cùng cấu hình |

Số liệu ĐÃ đo thật (không được sửa nếu không đo lại): 40/40 unit test (Vitest 4.1.5,
09/07/2026); `pnpm audit` 51 lỗ hổng = 3 critical + 21 high + 21 moderate + 6 low
(09/07/2026); toàn bộ số liệu di trú ở Bảng 4.5 (từ nhật ký script, progress.md).

## Việc còn lại trước khi gửi cô

1. Chèn 11 hình theo chỉ dẫn 【HÌNH …】.
2. Ghép vào docx, cập nhật MỤC LỤC (tên Chương 3 mới + mục 4.2 mới), danh mục hình/bảng.
3. Điền bảng chữ viết tắt (SSR, ISR, CMS, SEO, GEO, JWT, RBAC, ERD, LCP, INP, CLS, API, ORM).
4. Khi có domain: đo nốt các placeholder rồi thay 【CHƯA ĐO】bằng bảng số liệu kèm ngày đo.
5. Gửi cô CẢ CHƯƠNG hoàn chỉnh (không gửi đoạn rời) — theo đúng email hướng dẫn.
