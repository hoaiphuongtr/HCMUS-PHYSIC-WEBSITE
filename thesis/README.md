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

## Placeholder còn treo 【CHƯA ĐO】 — chỉ còn nhóm cần tên miền công khai

| Vị trí | Chỉ số | Điều kiện |
|---|---|---|
| 4.3 (cuối) | CrUX field data | domain + lưu lượng thật |
| 4.5.1 | MDN HTTP Observatory | HTTPS |
| 4.5.2 | SSL Labs | chứng chỉ TLS |
| 4.6.2 | Schema.org / Rich Results Test | URL truy cập từ Internet |

Số liệu ĐÃ đo thật (không sửa nếu không đo lại):
- 40/40 unit test (Vitest 4.1.5, 09/07/2026); `pnpm audit` 51 vulns (09/07/2026); di trú Bảng 4.5.
- **Lighthouse 13.4.0, 12/07/2026** (mobile, Slow 4G mô phỏng; site mới = production build
  localhost + DB thật 1.654 bài, backend cục bộ trỏ Postgres :5432/hcmus-physic):
  cũ 13/88/96/85, 21,2MB, 137 req, LCP 86,5s, CLS 0,243; mới /vi 74/80/96/92, 0,82MB,
  27 req, LCP 5,51s, CLS 0; bài di trú 61/88/96/100 (TBT 1963ms, ~221MB ảnh legacy);
  bộ môn 85/80/96/100; giới thiệu 75/91/88/100. Sitemap cũ = HTML (không hợp lệ).
  Trang mới CHƯA phát hreflang (đã ghi trung thực ở 4.6.1).
- Báo cáo JSON gốc: scratchpad `lh-*.json` (tạm thời — copy về nơi bền nếu cần giữ).

## Việc còn lại trước khi gửi cô

1. Chèn 11 hình theo chỉ dẫn 【HÌNH …】.
2. Ghép vào docx, cập nhật MỤC LỤC (tên Chương 3 mới + mục 4.2 mới), danh mục hình/bảng.
3. Điền bảng chữ viết tắt (SSR, ISR, CMS, SEO, GEO, JWT, RBAC, ERD, LCP, INP, CLS, API, ORM).
4. Khi có domain: đo nốt các placeholder rồi thay 【CHƯA ĐO】bằng bảng số liệu kèm ngày đo.
5. Gửi cô CẢ CHƯƠNG hoàn chỉnh (không gửi đoạn rời) — theo đúng email hướng dẫn.
