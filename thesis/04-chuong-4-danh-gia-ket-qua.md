# CHƯƠNG 4. PHÂN TÍCH VÀ ĐÁNH GIÁ KẾT QUẢ

Chương này đánh giá hệ thống trên năm phương diện: tính đúng đắn chức năng (4.2), hiệu năng theo Chỉ số Web cốt lõi và Lighthouse (4.3, 4.4), bảo mật (4.5), SEO – GEO (4.6); sau đó so sánh với website cũ (4.7) và đối chiếu mức độ hoàn thành mục tiêu đề ra ở Chương 1 (4.8).

> **Ghi chú trung thực về số liệu**: mọi con số trong chương này là kết quả đo thật, kèm công cụ và ngày đo. Các phép đo yêu cầu tên miền công khai và HTTPS (CrUX, SSL Labs, MDN HTTP Observatory) chưa thực hiện được do máy chủ thử nghiệm chưa gắn tên miền; các vị trí này được đánh dấu 【CHƯA ĐO】kèm điều kiện cần, và sẽ bổ sung khi hạ tầng cho phép.

## 4.1 Phương pháp đánh giá

### 4.1.1 Công cụ đo lường

*Bảng 4.1. Công cụ đánh giá sử dụng trong chương*

| Phương diện | Công cụ | Ghi chú |
|---|---|---|
| Kiểm thử đơn vị backend | Vitest 4.1.5 | chạy toàn bộ bộ kiểm thử trong kho mã |
| Kiểm thử chức năng đầu-cuối | Playwright + kiểm tra API thủ công (curl) | trên môi trường phát triển |
| Kiểm tra kiểu / lint / build | TypeScript `tsc`, Biome, `next build` / `nest build` | cổng chất lượng bắt buộc |
| Core Web Vitals, Lighthouse | Chrome Lighthouse, PageSpeed Insights | yêu cầu bản triển khai chạy ổn định |
| Bảo mật HTTP / TLS | MDN HTTP Observatory, SSL Labs | yêu cầu tên miền công khai + HTTPS |
| Lỗ hổng phụ thuộc | `pnpm audit` | chạy trên kho mã, không cần triển khai |

### 4.1.2 Môi trường kiểm thử

Kiểm thử chức năng và kiểm thử đơn vị thực hiện trên môi trường phát triển (WSL2, Node.js 24, PostgreSQL và Redis cục bộ qua Docker), với cơ sở dữ liệu chứa **toàn bộ dữ liệu di trú thật** (1.704 bài viết, khoảng 1.649 bố cục, 3,9 GB phương tiện) — nghĩa là các phép kiểm thử chạy trên khối lượng dữ liệu tương đương vận hành thật, không phải dữ liệu mẫu. Môi trường triển khai đích là máy chủ CentOS 7.9 (4 vCPU, 4 GB RAM) qua Docker Compose như mô tả tại mục 3.9.

### 4.1.3 Các trang được kiểm thử

Các phép đo hiệu năng và SEO nhắm vào bốn trang đại diện cho bốn dạng kết xuất: trang chủ (`/vi`), một trang bài viết di trú (nội dung HTML legacy), một trang danh mục tin tức (danh sách động), và một trang bộ môn (`/vi/vat-ly-ung-dung`).

## 4.2 Kiểm thử chức năng

Mục này chứng minh hệ thống vận hành đúng trên bốn nhóm nghiệp vụ trọng yếu: quản lý nội dung (CRUD), phân quyền, xuất bản và di trú dữ liệu.

### 4.2.1 Kiểm thử đơn vị phía máy chủ

Bộ kiểm thử đơn vị backend gồm **40 ca kiểm thử trong 4 tệp**, tập trung vào hai vùng logic rủi ro cao nhất: quy tắc phân quyền (`helpers.spec.ts` — các hàm `departmentScopeWhere`, `mediaScopeWhere`, `canAccessDepartment`) và nghiệp vụ bố cục – phiên bản (`page-layout.service.spec.ts` — thứ tự chụp ảnh phiên bản khi xuất bản, kiểm tra xung đột slug trước khi khôi phục, tự bổ sung phiên bản đầu cho bố cục cũ, chụp phiên bản khi cron xuất bản theo lịch), cùng nghiệp vụ quản lý quản trị viên (`admin.service.spec.ts`). Kết quả chạy ngày 09/07/2026: **40/40 ca đạt** (Vitest 4.1.5, tổng thời gian 1,28 giây). Song song, cả ba workspace đạt cổng chất lượng: `tsc --noEmit` không lỗi, `next build`/`nest build` thành công.

### 4.2.2 Kiểm thử nghiệp vụ quản lý nội dung (CRUD)

*Bảng 4.2. Kịch bản kiểm thử CRUD nội dung*

| Mã | Kịch bản | Kết quả mong đợi | Kết quả |
|---|---|---|---|
| C1 | Tạo bài viết song ngữ: nhập tiêu đề/thân bài hai thẻ VI–EN, chọn chuyên mục, ảnh bìa từ thư viện | Bài lưu trạng thái DRAFT, mở lại hiển thị đúng nội dung cả hai ngôn ngữ | Đạt |
| C2 | Mở một bài viết di trú trong trình soạn thảo | Thẻ VI và EN hiển thị đúng bản dịch tương ứng; ảnh bìa nạp từ `/uploads/legacy/` | Đạt |
| C3 | Cập nhật bài viết đã gắn vào bố cục | `syncAttachedLayouts` cập nhật mọi bố cục có `sourcePostId` tương ứng | Đạt |
| C4 | Tạo/sửa/xóa trang bố cục bằng Visual Builder; kéo – thả khối, đổi thuộc tính | Cây `puckData` lưu đúng; xem trước khớp kết xuất công khai | Đạt |
| C5 | Tải tệp lên thư viện phương tiện, gắn thẻ, chèn vào bài | Bản ghi Media đúng loại/kích thước; ảnh hiển thị trong bài | Đạt |
| C6 | Tạo tài khoản quản trị viên mới kèm bộ môn (chỉ SUPER_ADMIN) | Tài khoản đăng nhập được; xuất hiện trong danh sách kèm trạng thái hoạt động | Đạt |

Các kịch bản trên được thực hiện trực tiếp trên giao diện quản trị trong quá trình phát triển, có nhật ký xác nhận (ảnh chụp Playwright cho C2, C4; kiểm tra API cho C3) lưu trong hồ sơ tiến độ của dự án.

### 4.2.3 Kiểm thử phân quyền

Kịch bản sử dụng ba danh tính: quản trị viên cấp cao, quản trị viên văn phòng khoa, và quản trị viên bộ môn Vật lý Ứng dụng (tài khoản `vlud_admin`, JWT mang `departmentId = dept_legacy_6`). Kết quả kiểm tra trực tiếp trên API ghi trong Bảng 4.3.

*Bảng 4.3. Kịch bản kiểm thử phân quyền theo vai trò và bộ môn*

| Mã | Kịch bản | Kết quả mong đợi | Kết quả |
|---|---|---|---|
| P1 | `vlud_admin` gọi `GET /posts` | Chỉ nhận bài viết bộ môn mình | Đạt — trả về 32 bài, toàn bộ thuộc `dept_legacy_6` |
| P2 | `vlud_admin` đọc chi tiết bài viết của bộ môn mình | HTTP 200 | Đạt |
| P3 | `vlud_admin` đọc bài viết của bộ môn khác (Vật lý Lý thuyết) | HTTP 404 — không tiết lộ tồn tại | Đạt |
| P4 | `vlud_admin` mở thư viện phương tiện | Thấy tư liệu bộ môn mình + tư liệu dùng chung của khoa; không có nút sửa/xóa trên tư liệu dùng chung | Đạt |
| P5 | Tài khoản ADMIN truy cập trang quản lý quản trị viên `/admin/admins` | Bị chuyển hướng; API trả 403 (`@Roles(SuperAdmin)` cấp lớp) | Đạt |
| P6 | 24 ca kiểm thử đơn vị trên ba hàm phạm vi bộ môn (mọi tổ hợp vai trò × bộ môn) | Toàn bộ nhánh logic đúng đặc tả Bảng 3.3 | Đạt (trong 40/40, mục 4.2.1) |

### 4.2.4 Kiểm thử quy trình xuất bản

*Bảng 4.4. Kịch bản kiểm thử quy trình xuất bản*

| Mã | Kịch bản | Kết quả mong đợi | Kết quả |
|---|---|---|---|
| X1 | Xuất bản bài viết theo mẫu (`clone-into-layout`) | Sinh bố cục nháp mới; sáu loại khối giữ chỗ nhận đúng dữ liệu bài | Đạt |
| X2 | Xuất bản bố cục | `publishedPuckData` chụp từ `puckData`; trang công khai phản ánh sau revalidate; sinh bản ghi phiên bản CURRENT, bản trước chuyển ARCHIVED | Đạt |
| X3 | Sửa tiếp bản nháp sau khi xuất bản | Trang công khai giữ nguyên ảnh chụp cũ cho tới lần xuất bản sau | Đạt |
| X4 | Lên lịch xuất bản, chờ cron mỗi phút | Đến hạn tự chuyển PUBLISHED, có chụp phiên bản như xuất bản tay | Đạt (ca kiểm thử đơn vị "cron snapshot") |
| X5 | Khôi phục phiên bản cũ (hai chế độ: về nháp / xuất bản lại) | Nội dung khôi phục đúng ảnh chụp; xung đột slug được kiểm tra trước khi ghi | Đạt |
| X6 | Sau xuất bản, khóa đệm Redis liên quan bị xóa; sitemap cập nhật | Lần đọc kế tiếp trả nội dung mới | Đạt |

### 4.2.5 Kiểm thử di trú dữ liệu

Tính đúng đắn của di trú được đối chiếu bằng số liệu nguồn – đích và kiểm tra hiển thị (phương pháp mô tả tại mục 3.7.6); kết quả tổng hợp trong Bảng 4.5.

*Bảng 4.5. Kết quả đối chiếu di trú dữ liệu (số liệu ghi nhận từ nhật ký chạy script)*

| Hạng mục | Nguồn (sau lọc xóa mềm) | Kết quả di trú | Ghi chú |
|---|---|---|---|
| Đơn vị (bộ môn) | 10 | 10 | hợp nhất bản ghi trùng, slug chuẩn hóa |
| Chuyên mục | 45 | 45 (+5 mặc định của hệ mới) | |
| Bài viết | 1.637 | 1.637 (tổng 1.704 cùng 67 bài sẵn có) | upsert theo `legacyId`, chạy lặp không tạo bản sao |
| Tư liệu phương tiện bài viết | 1.909 đường dẫn | 1.870 tải thành công | 36 tệp hỏng ngay trên máy chủ nguồn; 3 đã có sẵn |
| Tư liệu trang nội dung | 187 | 180 | 7 tệp hỏng phía nguồn |
| Trang nội dung tái tạo | 29 trang mục tiêu | 29 | đủ khung banner + thân bài + thanh bên |
| Menu điều hướng | 9 mục, 36 liên kết con | 9 mục, 36 liên kết con | 30/30 liên kết nội bộ phân giải về trang đã xuất bản |
| Gắn nhãn bộ môn | — | 1.587 bài viết + 1.540 bố cục | từ `posts.deptid` gốc |
| Chuyển hướng URL cũ | — | 397 quy tắc | kiểm tra mẫu: `/vi/tin-tuc/<x>` → 308 → `/vi/vat-ly-ung-dung/tin-tuc/<x>`, URL mới trả 200 |

Kiểm tra hiển thị bằng Playwright trên các trang đại diện xác nhận nội dung di trú giữ nguyên định dạng gốc: bảng biểu giữ đường kẻ, tiêu đề màu và danh sách dấu đầu dòng hiển thị đúng, lưới ảnh giảng viên khớp trang cũ, chuyển ngôn ngữ EN đổi đúng nhãn menu và nội dung.

## 4.3 Đánh giá Core Web Vitals

Bộ ba chỉ số LCP, INP, CLS (ngưỡng tốt lần lượt ≤ 2,5 s; ≤ 200 ms; ≤ 0,1 — mục 2.2.1) cần đo trên bản triển khai chạy ổn định. Dữ liệu trường (CrUX) đòi hỏi tên miền công khai có lưu lượng thật nên chưa khả dụng; dữ liệu phòng thí nghiệm đo bằng Lighthouse trên bản triển khai máy chủ thử nghiệm:

- **LCP**: 【CHƯA ĐO: LCP bốn trang đại diện — chạy Lighthouse trên bản triển khai Docker, mạng Fast 3G/Slow 4G mô phỏng】
- **INP** (xấp xỉ bằng TBT trong môi trường phòng thí nghiệm): 【CHƯA ĐO】
- **CLS**: 【CHƯA ĐO】
- Chỉ số hỗ trợ (FCP, TTFB, Speed Index): 【CHƯA ĐO】

Về mặt thiết kế, các biện pháp tại mục 3.8 (ISR phục vụ HTML tĩnh, ưu tiên nạp ảnh LCP, giữ chỗ kích thước ảnh chống CLS, đệm ba tầng giảm TTFB) nhắm trực tiếp vào từng chỉ số; số đo thực tế sẽ kiểm chứng hiệu quả của chúng.

## 4.4 Đánh giá bằng Lighthouse

Bốn điểm tổng hợp Lighthouse (Performance, Accessibility, Best Practices, SEO; thang 0–100) [14] trên bốn trang đại diện: 【CHƯA ĐO: bảng 4 trang × 4 điểm — chạy Lighthouse (Chrome DevTools hoặc PageSpeed Insights nếu có tên miền) trên bản triển khai】. Khi đo, chú thích bảng sẽ ghi rõ phiên bản Chrome/Lighthouse, chế độ thiết bị (mobile), ngày đo và môi trường mạng mô phỏng.

## 4.5 Đánh giá bảo mật

### 4.5.1 MDN HTTP Observatory

【CHƯA ĐO: điểm Observatory và bảng HTTP security headers — cần tên miền công khai HTTPS】[15]. Hạng mục cần rà khi đo: Content-Security-Policy, Strict-Transport-Security, X-Content-Type-Options, cấu hình cookie.

### 4.5.2 SSL Labs

【CHƯA ĐO: xếp hạng SSL Labs — cần tên miền + chứng chỉ TLS; máy chủ thử nghiệm hiện phục vụ HTTP qua địa chỉ IP】. Đây là hạn chế hạ tầng đã nêu tại mục 1.3.

### 4.5.3 Lỗ hổng trong các thư viện phụ thuộc

Quét bằng `pnpm audit` trên toàn monorepo (ngày 09/07/2026) ghi nhận **51 cảnh báo lỗ hổng** trong cây phụ thuộc: 3 mức nghiêm trọng (critical), 21 cao, 21 trung bình, 6 thấp. Chúng tôi trình bày số liệu này trung thực như một hạng mục bảo trì đang mở: phần lớn cảnh báo nằm ở phụ thuộc gián tiếp của các công cụ phát triển và một số thư viện có bản vá ở phiên bản mới hơn (ví dụ `better-auth` cần nâng lên ≥ 1.6.11 theo khuyến cáo GHSA-2vg6-77g8-24mp). Kế hoạch xử lý: nâng cấp các gói có bản vá, đánh giá khả năng khai thác thực tế của từng cảnh báo mức cao trở lên trong ngữ cảnh triển khai (nhiều lỗ hổng chỉ khai thác được ở cấu hình không sử dụng), và đưa `pnpm audit` vào cổng chất lượng định kỳ. Ở tầng ứng dụng, các biện pháp chủ động đã hiện thực gồm: băm mật khẩu bcrypt, JWT tách access/refresh, phân quyền hai lớp kiểm thử đầy đủ (4.2.3), làm sạch HTML di trú (loại `script`, thuộc tính `on*`), và trả 404 thay vì 403 cho tài nguyên khác bộ môn để tránh dò tài nguyên.

## 4.6 Đánh giá SEO và GEO

### 4.6.1 SEO kỹ thuật

Rà soát trên môi trường phát triển xác nhận các hạng mục thiết kế tại mục 3.8 hoạt động: mỗi trang trả về HTML đầy đủ nội dung ngay trong phản hồi đầu tiên (xem 4.6.3); thẻ tiêu đề, mô tả, canonical và cặp `hreflang` vi/en sinh đúng theo từng trang; `sitemap.xml` liệt kê các bố cục đã xuất bản kèm thời điểm cập nhật; `robots.txt` trỏ về sitemap; 397 URL cũ chuyển hướng 308 về địa chỉ mới (kiểm chứng tại Bảng 4.5). Điểm SEO on-page định lượng: 【CHƯA ĐO: điểm SEO Lighthouse — gộp vào phép đo mục 4.4】.

### 4.6.2 Kiểm định dữ liệu có cấu trúc

Khối JSON-LD `NewsArticle` trên trang bài viết cần kiểm định bằng công cụ chính thức: 【CHƯA ĐO: kết quả Schema.org Validator / Google Rich Results Test trên 2–3 trang bài viết — chạy được ngay khi bản triển khai truy cập từ Internet】.

### 4.6.3 Khả năng thu thập và kết xuất

Kiểm tra bằng cách tải trang với JavaScript tắt (curl) trên môi trường phát triển: HTML phản hồi chứa đầy đủ tiêu đề, thân bài và liên kết điều hướng — máy thu thập không cần thực thi JavaScript vẫn đọc trọn nội dung. Đây là hệ quả trực tiếp của kiến trúc SSR/ISR (mục 3.8.1) và là khác biệt nền tảng so với các ứng dụng kết xuất phía trình duyệt.

### 4.6.4 GEO — mức sẵn sàng cho tìm kiếm AI

Đối chiếu với các tiêu chí GEO (mục 2.2.3): hệ thống đáp ứng nhóm tiêu chí hạ tầng — HTML tự chứa, dữ liệu có cấu trúc, metadata nhất quán, `robots.txt` không chặn máy thu thập AI, tóm tắt tự chứa ngữ cảnh ở đầu bài viết. Nhóm tiêu chí nội dung (mật độ dữ kiện, trích dẫn nguồn trong bài) phụ thuộc người biên tập, nằm ngoài phạm vi kiểm soát của hệ thống. Đánh giá định lượng mức độ được trích dẫn chỉ khả thi sau khi website vận hành trên tên miền chính thức một thời gian đủ dài.

## 4.7 So sánh và đối chiếu

### 4.7.1 So sánh với website cũ của Khoa

*Bảng 4.6. Đối chiếu năng lực hệ thống mới và website cũ*

| Tiêu chí | Website cũ (PHP/MariaDB) | Hệ thống mới |
|---|---|---|
| Kiến trúc | Nguyên khối, hiển thị gắn dữ liệu | Headless ba tầng, API duy nhất, backend không trạng thái |
| Dàn trang | Không — bố cục cố định trong mã | Visual Builder kéo – thả, mẫu tái sử dụng |
| Quy trình xuất bản | Đăng trực tiếp | Nháp → duyệt → xuất bản; lên lịch; lịch sử phiên bản + khôi phục |
| Song ngữ | Bảng dịch riêng, JOIN mỗi truy vấn | JSON `{vi, en}`, giao diện hai thẻ, tự lùi về tiếng Việt |
| Phân quyền | Mọi tài khoản thao tác toàn bộ nội dung | 2 vai trò × phạm vi bộ môn, kiểm thử 40 ca |
| Bộ nhớ đệm | Không | 3 tầng (ISR, Redis, đệm module) |
| SEO | Không sitemap/metadata tự động | SSR/ISR, metadata động, JSON-LD, sitemap, hreflang, chuyển hướng 308 |
| Kiểm thử tự động | Không | Vitest + Playwright + cổng lint/type/build |
| Triển khai | Cài tay trên máy chủ | Docker Compose tự chứa, kịch bản một lệnh |
| Hướng dẫn người dùng | Không | Tour tương tác + trung tâm trợ giúp song ngữ |

So sánh hiệu năng định lượng cũ – mới: 【CHƯA ĐO: cặp số Lighthouse của phys.hcmus.edu.vn và bản triển khai mới đo cùng thời điểm, cùng cấu hình — thực hiện khi bản mới có địa chỉ truy cập công khai】.

### 4.7.2 Mức độ hoàn thành mục tiêu khóa luận

*Bảng 4.7. Đối chiếu mục tiêu (mục 1.2) và kết quả đạt được*

| Mục tiêu | Kết quả | Mức độ |
|---|---|---|
| 1. Kiến trúc Headless ba tầng | Hoàn thành như thiết kế Chương 3; ba thành phần chạy độc lập, build sạch | Hoàn thành |
| 2. Trang quản trị + Visual Builder | Đầy đủ: soạn bài song ngữ, Puck, thư viện phương tiện, phiên bản + khôi phục, tour hướng dẫn | Hoàn thành |
| 3. Xác thực + phân quyền bộ môn | JWT 2 vai trò + phạm vi bộ môn; kiểm chứng API + 40 ca kiểm thử | Hoàn thành |
| 4. Di trú toàn bộ dữ liệu | 1.637 bài, 29 trang, 10 đơn vị, 45 chuyên mục, ~3,9 GB phương tiện; 397 chuyển hướng; đối chiếu Bảng 4.5 | Hoàn thành (36+7 tệp hỏng phía nguồn ghi nhận) |
| 5. Tối ưu hiệu năng + SEO | Thiết kế và hiện thực đủ (3.8); kiểm chứng định tính 4.6; số đo định lượng chờ điều kiện hạ tầng | Hoàn thành phần hiện thực; phép đo còn treo |
| 6. Đóng gói triển khai Docker | Compose 6 dịch vụ + deploy.sh + tài liệu; ràng buộc CentOS 7.9 đã xử lý | Hoàn thành |

### 4.7.3 Tổng kết kết quả nghiên cứu

Hệ thống đạt trọn vẹn các mục tiêu chức năng: nền tảng quản trị nội dung hiện đại vận hành trên đúng khối dữ liệu thật của Khoa, quy trình biên tập – xuất bản hoàn chỉnh, phân quyền phản ánh đúng tổ chức, và toàn bộ tài sản nội dung cũ được bảo toàn kèm chuyển hướng URL. Tính đúng đắn được chứng minh bằng kiểm thử tự động (40/40) và kiểm thử chức năng có đối chứng trên cả bốn nhóm nghiệp vụ. Hạng mục còn mở tập trung ở nhóm *đo lường sau triển khai* — Core Web Vitals, Lighthouse, bảo mật HTTP/TLS, kiểm định dữ liệu có cấu trúc — tất cả chỉ chờ điều kiện duy nhất là tên miền công khai; phương pháp và công cụ đo đã chuẩn bị sẵn tại mục 4.1.
