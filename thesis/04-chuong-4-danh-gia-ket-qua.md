# CHƯƠNG 4. PHÂN TÍCH VÀ ĐÁNH GIÁ KẾT QUẢ

Chương này đánh giá hệ thống trên năm phương diện: tính đúng đắn chức năng (4.2), hiệu năng theo Chỉ số Web cốt lõi và Lighthouse (4.3, 4.4), bảo mật (4.5), SEO – GEO (4.6); sau đó so sánh với website cũ và đối chiếu mức độ hoàn thành mục tiêu đề ra ở Chương 1 (4.7).

Mọi số liệu trong chương là kết quả đo thật, kèm công cụ và ngày đo; các chỉ số hiệu năng là số đo phòng thí nghiệm bằng Lighthouse thực hiện ngày 12/07/2026 theo cấu hình mô tả tại mục 4.1.2.

## 4.1 Phương pháp đánh giá

### 4.1.1 Công cụ đo lường

*Bảng 4.1. Công cụ đánh giá sử dụng trong chương*

| Phương diện | Công cụ | Ghi chú |
|---|---|---|
| Kiểm thử đơn vị backend | Vitest 4.1.5 | chạy toàn bộ bộ kiểm thử trong kho mã |
| Kiểm thử chức năng đầu-cuối | Playwright + kiểm tra API thủ công (curl) | trên môi trường phát triển |
| Kiểm tra kiểu / lint / đóng gói | Trình kiểm tra kiểu TypeScript, Biome, đóng gói production | cổng chất lượng bắt buộc |
| Core Web Vitals, Lighthouse | Chrome Lighthouse 13.4.0 | đo trên bản build production |
| Lỗ hổng phụ thuộc | `pnpm audit` | chạy trên kho mã, không cần triển khai |

### 4.1.2 Môi trường kiểm thử

Kiểm thử chức năng và kiểm thử đơn vị thực hiện trên môi trường phát triển (WSL2, Node.js 24, PostgreSQL và Redis cục bộ qua Docker), với cơ sở dữ liệu chứa **toàn bộ dữ liệu di trú thật** (hơn 1.650 bài viết và 1.650 bố cục, 3,9 GB phương tiện) — nghĩa là các phép kiểm thử chạy trên khối lượng dữ liệu tương đương vận hành thật, không phải dữ liệu mẫu. Môi trường triển khai đích là máy chủ CentOS 7.9 (4 vCPU, 4 GB RAM) qua Docker Compose như mô tả tại mục 3.9.

Các phép đo hiệu năng dùng Lighthouse 13.4.0 (Chromium headless) với cấu hình mặc định: giả lập thiết bị di động, tiết lưu mô phỏng mạng Slow 4G và CPU chậm 4 lần, thực hiện ngày 12/07/2026. Website mới được đo trên **bản build production** phục vụ tại máy đo, kết nối máy chủ API và toàn bộ dữ liệu di trú thật; website cũ được đo qua Internet tại cùng thời điểm, cùng phiên bản công cụ. Cách bố trí này giữ cho hai phép đo cùng điều kiện tiết lưu; điểm bất đối xứng duy nhất là thời gian phản hồi máy chủ (TTFB) của bản mới không chứa độ trễ mạng thật — hạn chế này được ghi chú tại các bảng liên quan và sẽ được loại bỏ khi đo lại trên bản triển khai có tên miền.

### 4.1.3 Các trang được kiểm thử

Các phép đo hiệu năng và SEO nhắm vào bốn trang đại diện cho bốn dạng kết xuất của trang công khai: trang chủ (bố cục Visual Builder đầy đủ), một bài viết di trú với nội dung HTML và ảnh gốc từ hệ thống cũ, trang riêng của một bộ môn (Vật lý Ứng dụng), và một trang nội dung tĩnh tái tạo từ hệ thống cũ (trang giới thiệu). Trang chủ website cũ (phys.hcmus.edu.vn) được đo làm mốc so sánh (mục 4.7.1).

## 4.2 Kiểm thử chức năng

Mục này chứng minh hệ thống vận hành đúng trên bốn nhóm nghiệp vụ trọng yếu: quản lý nội dung (CRUD), phân quyền, xuất bản và di trú dữ liệu.

### 4.2.1 Kiểm thử đơn vị phía máy chủ

Bộ kiểm thử đơn vị phía máy chủ gồm **40 ca kiểm thử trong 4 nhóm**, tập trung vào hai vùng logic rủi ro cao nhất. Nhóm thứ nhất bao phủ ba hàm quy tắc phân quyền theo bộ môn với mọi tổ hợp vai trò và đơn vị. Nhóm thứ hai bao phủ nghiệp vụ bố cục – phiên bản: thứ tự chụp ảnh phiên bản khi xuất bản, kiểm tra xung đột đường dẫn trước khi khôi phục, tự bổ sung phiên bản đầu cho bố cục cũ, và chụp phiên bản khi xuất bản theo lịch. Hai nhóm còn lại kiểm thử nghiệp vụ quản lý quản trị viên và điểm cuối cơ sở của ứng dụng. Kết quả chạy ngày 09/07/2026: **40/40 ca đạt** (Vitest 4.1.5, tổng thời gian 1,28 giây). Song song, cả ba thành phần đạt cổng chất lượng: kiểm tra kiểu không lỗi, đóng gói production thành công.

### 4.2.2 Kiểm thử nghiệp vụ quản lý nội dung (CRUD)

*Bảng 4.2. Kịch bản kiểm thử CRUD nội dung*

| Mã | Kịch bản | Kết quả mong đợi | Kết quả |
|---|---|---|---|
| C1 | Tạo bài viết song ngữ: nhập tiêu đề/thân bài hai thẻ VI–EN, chọn chuyên mục, ảnh bìa từ thư viện | Bài lưu trạng thái DRAFT, mở lại hiển thị đúng nội dung cả hai ngôn ngữ | Đạt |
| C2 | Mở một bài viết di trú trong trình soạn thảo | Thẻ VI và EN hiển thị đúng bản dịch tương ứng; ảnh bìa nạp từ kho tệp di trú | Đạt |
| C3 | Cập nhật bài viết đã gắn vào bố cục | Mọi bố cục gắn với bài viết được đồng bộ nội dung mới | Đạt |
| C4 | Tạo/sửa/xóa trang bố cục bằng Visual Builder; kéo – thả khối, đổi thuộc tính | Cây bố cục lưu đúng; xem trước khớp kết xuất công khai | Đạt |
| C5 | Tải tệp lên thư viện phương tiện, gắn thẻ, chèn vào bài | Bản ghi Media đúng loại/kích thước; ảnh hiển thị trong bài | Đạt |
| C6 | Tạo tài khoản quản trị viên mới kèm bộ môn (chỉ SUPER_ADMIN) | Tài khoản đăng nhập được; xuất hiện trong danh sách kèm trạng thái hoạt động | Đạt |

Các kịch bản trên được thực hiện trực tiếp trên giao diện quản trị trong quá trình phát triển, có nhật ký xác nhận (ảnh chụp Playwright cho C2, C4; kiểm tra API cho C3) lưu trong hồ sơ tiến độ của dự án.

### 4.2.3 Kiểm thử phân quyền

Kịch bản sử dụng ba danh tính: quản trị viên cấp cao, quản trị viên văn phòng khoa, và một quản trị viên thuộc bộ môn Vật lý Ứng dụng (mã thông báo đăng nhập mang đúng nhãn bộ môn này). Kết quả kiểm tra trực tiếp trên API ghi trong Bảng 4.3.

*Bảng 4.3. Kịch bản kiểm thử phân quyền theo vai trò và bộ môn*

| Mã | Kịch bản | Kết quả mong đợi | Kết quả |
|---|---|---|---|
| P1 | Quản trị viên bộ môn liệt kê danh sách bài viết | Chỉ nhận bài viết của bộ môn trực thuộc | Đạt — trả về 32 bài, toàn bộ thuộc đúng bộ môn |
| P2 | Quản trị viên bộ môn đọc chi tiết bài viết của bộ môn trực thuộc | HTTP 200 | Đạt |
| P3 | Quản trị viên bộ môn đọc bài viết của bộ môn khác (Vật lý Lý thuyết) | HTTP 404 — không tiết lộ tồn tại | Đạt |
| P4 | Quản trị viên bộ môn mở thư viện phương tiện | Thấy tư liệu của bộ môn trực thuộc + tư liệu dùng chung của khoa; không có nút sửa/xóa trên tư liệu dùng chung | Đạt |
| P5 | Quản trị viên thường truy cập trang quản lý quản trị viên | Bị chuyển hướng; API trả 403 (khai báo quyền ở mức toàn phân hệ) | Đạt |
| P6 | 24 ca kiểm thử đơn vị trên ba hàm phạm vi bộ môn (mọi tổ hợp vai trò × bộ môn) | Toàn bộ nhánh logic đúng đặc tả Bảng 3.3 | Đạt (trong 40/40, mục 4.2.1) |

### 4.2.4 Kiểm thử quy trình xuất bản

*Bảng 4.4. Kịch bản kiểm thử quy trình xuất bản*

| Mã | Kịch bản | Kết quả mong đợi | Kết quả |
|---|---|---|---|
| X1 | Xuất bản bài viết theo mẫu | Sinh bố cục nháp mới; sáu loại khối giữ chỗ nhận đúng dữ liệu bài | Đạt |
| X2 | Xuất bản bố cục | Bản công khai chụp từ bản nháp; trang công khai phản ánh sau tín hiệu làm mới; sinh bản ghi phiên bản hiện hành, bản trước chuyển lưu trữ | Đạt |
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
| Bài viết | 1.637 | 1.637 (tổng 1.704 cùng 67 bài sẵn có) | ghi đè theo khóa gốc, chạy lặp không tạo bản sao |
| Tư liệu phương tiện bài viết | 1.909 đường dẫn | 1.870 tải thành công | 36 tệp hỏng ngay trên máy chủ nguồn; 3 đã có sẵn |
| Tư liệu trang nội dung | 187 | 180 | 7 tệp hỏng phía nguồn |
| Trang nội dung tái tạo | 29 trang mục tiêu | 29 | đủ khung banner + thân bài + thanh bên |
| Menu điều hướng | 9 mục, 36 liên kết con | 9 mục, 36 liên kết con | 30/30 liên kết nội bộ phân giải về trang đã xuất bản |
| Gắn nhãn bộ môn | — | 1.587 bài viết + 1.540 bố cục | từ mã bộ môn gốc của nguồn |
| Chuyển hướng URL cũ | — | 397 quy tắc | kiểm tra mẫu: URL phẳng cũ trả 308 về URL mang tiền tố bộ môn, URL mới trả 200 |

Kiểm tra hiển thị bằng Playwright trên các trang đại diện xác nhận nội dung di trú giữ nguyên định dạng gốc: bảng biểu giữ đường kẻ, tiêu đề màu và danh sách dấu đầu dòng hiển thị đúng, lưới ảnh giảng viên khớp trang cũ, chuyển ngôn ngữ EN đổi đúng nhãn menu và nội dung.

## 4.3 Đánh giá Core Web Vitals

Bộ ba chỉ số LCP, INP, CLS (ngưỡng tốt lần lượt ≤ 2,5 s; ≤ 200 ms; ≤ 0,1 — mục 2.2.1) được đo ở chế độ phòng thí nghiệm theo cấu hình mô tả tại mục 4.1.2; trong môi trường mô phỏng không có thao tác người dùng thật, INP được thay bằng chỉ số gần đúng TBT (Total Blocking Time, ngưỡng tốt ≤ 200 ms). Kết quả trên bốn trang đại diện trình bày trong Bảng 4.6.

*Bảng 4.6. Chỉ số Web cốt lõi (lab) của bốn trang đại diện — Lighthouse 13.4.0, mobile, mạng Slow 4G mô phỏng, bản build production tại máy đo, 12/07/2026*

| Trang | LCP (s) | TBT (ms) | CLS | FCP (s) | Speed Index (s) |
|---|---|---|---|---|---|
| Trang chủ | 5,51 | 268 | 0,000 | 1,25 | 2,29 |
| Bài viết di trú | 2,58 | 1.963 | 0,179 | 1,22 | 2,87 |
| Trang bộ môn | 4,15 | 104 | 0,000 | 1,37 | 1,65 |
| Trang giới thiệu | 6,16 | 186 | 0,000 | 1,07 | 1,07 |
| *Ngưỡng tốt* | *≤ 2,5* | *≤ 200* | *≤ 0,1* | *≤ 1,8* | — |

Kết quả cho thấy các biện pháp thiết kế tại mục 3.8 phát huy tác dụng rõ ở hai nhóm chỉ số. Độ ổn định bố cục gần như tuyệt đối trên các trang do hệ thống kiểm soát toàn bộ (CLS = 0,000, so với 0,243 của trang chủ website cũ) — kết quả trực tiếp của việc giữ chỗ kích thước ảnh của thành phần ảnh tối ưu. Thời gian hiển thị nội dung đầu tiên đều dưới 1,4 giây và Speed Index từ 1,1 đến 2,9 giây, phản ánh hiệu quả của kết xuất HTML sẵn phía máy chủ.

Ở chiều ngược lại, số liệu cũng chỉ ra hai điểm cần cải thiện, được ghi nhận trung thực tại đây. Thứ nhất, LCP của ba trang bố cục (4,2–6,2 giây) chưa đạt ngưỡng tốt: phần tử LCP là ảnh nền hero khổ lớn, hiện chưa được nén đủ mạnh cho điều kiện Slow 4G — hướng xử lý là chuyển ảnh hero sang định dạng AVIF/WebP kích thước theo khung nhìn. Thứ hai, trang bài viết di trú tuy có LCP tốt nhất (2,58 giây) nhưng TBT lên tới 1.963 ms và CLS 0,179: thân bài HTML giữ nguyên từ hệ thống cũ chứa ảnh gốc độ phân giải đầy đủ không khai báo kích thước, nằm ngoài đường tối ưu ảnh của hệ thống (hạn chế đã nêu tại mục 3.7.3). Đây là cái giá của quyết định giữ nguyên vẹn nội dung di trú; biện pháp khắc phục (nén lại kho ảnh legacy, bổ sung thuộc tính kích thước khi làm sạch HTML) được đưa vào kiến nghị.

## 4.4 Đánh giá bằng Lighthouse

Bốn điểm tổng hợp Lighthouse (Performance, Accessibility, Best Practices, SEO; thang 0–100) [14] của bốn trang đại diện được trình bày trong Bảng 4.7.

*Bảng 4.7. Điểm Lighthouse của bốn trang đại diện — Lighthouse 13.4.0, mobile, mạng Slow 4G mô phỏng, bản build production tại máy đo, 12/07/2026*

| Trang | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| Trang chủ | 74 | 80 | 96 | 92 |
| Bài viết di trú | 61 | 88 | 96 | 100 |
| Trang bộ môn | 85 | 80 | 96 | 100 |
| Trang giới thiệu | 75 | 91 | 88 | 100 |

Điểm SEO đạt 92–100 trên cả bốn trang, phản ánh các hạng mục kỹ thuật đã hiện thực ở mục 3.8 (HTML đầy đủ, metadata, canonical, robots hợp lệ); điểm Tuân thủ thông lệ tốt ổn định ở mức 88–96. Điểm Performance dao động 61–85 theo đặc điểm từng dạng trang, với hai nguyên nhân kéo điểm đã phân tích tại mục 4.3 (ảnh hero khổ lớn và kho ảnh legacy chưa tối ưu của bài viết di trú).

Điểm Accessibility ở mức 80–91 là hạng mục cần cải thiện nhất: các cảnh báo tập trung vào độ tương phản màu chữ trên nền và nhãn ARIA của một số nút điều khiển trong các khối giao diện dựng sẵn. Đáng lưu ý, điểm Accessibility trang chủ mới (80) thấp hơn trang chủ website cũ (88, mục 4.7.1) — một kết quả ngược kỳ vọng cần được báo cáo trung thực: giao diện cũ đơn giản về cấu trúc nên ít vi phạm hơn, trong khi giao diện mới nhiều thành phần tương tác hơn thì mỗi thành phần là một điểm có thể vi phạm. Việc rà lại độ tương phản của hệ màu và bổ sung nhãn ARIA được đưa vào danh mục việc cần làm trước khi vận hành chính thức.

## 4.5 Đánh giá bảo mật

Ở tầng ứng dụng, các biện pháp bảo mật chủ động đã hiện thực gồm: băm mật khẩu bằng bcrypt, tách cặp mã thông báo access/refresh, phân quyền hai lớp được kiểm thử đầy đủ (mục 4.2.3), làm sạch HTML di trú (loại mã kịch bản và thuộc tính bắt sự kiện), và trả 404 thay vì 403 cho tài nguyên khác bộ môn để tránh dò tài nguyên.

Ở tầng thư viện phụ thuộc, kết quả quét bằng `pnpm audit` trên toàn kho mã (ngày 09/07/2026) ghi nhận **51 cảnh báo lỗ hổng** trong cây phụ thuộc: 3 mức nghiêm trọng (critical), 21 cao, 21 trung bình, 6 thấp. Phần lớn cảnh báo nằm ở phụ thuộc gián tiếp của các công cụ phát triển, và một số thư viện đã có bản vá ở phiên bản mới hơn. Kế hoạch xử lý gồm: nâng cấp các gói có bản vá, đánh giá khả năng khai thác thực tế của từng cảnh báo mức cao trở lên trong ngữ cảnh triển khai (nhiều lỗ hổng chỉ khai thác được ở cấu hình không sử dụng), và đưa việc quét lỗ hổng vào cổng chất lượng định kỳ.

## 4.6 Đánh giá SEO và GEO

### 4.6.1 SEO kỹ thuật

Kiểm tra trực tiếp mã HTML trả về (12/07/2026) xác nhận phần lớn hạng mục thiết kế tại mục 3.8 hoạt động đúng: mỗi trang có thẻ tiêu đề, mô tả và canonical riêng; trang chủ phát 6 khối dữ liệu có cấu trúc JSON-LD và trang bài viết phát 8 khối; bộ thẻ Open Graph đầy đủ (9 thẻ); 44/45 ảnh trên trang chủ được nạp trễ; `robots.txt` hợp lệ và `sitemap.xml` liệt kê các trang đã xuất bản kèm thời điểm cập nhật `lastmod` — trong khi địa chỉ `sitemap.xml` của website cũ trả về một trang HTML, tức không có sitemap thực. 397 URL cũ chuyển hướng 308 về địa chỉ mới (kiểm chứng tại Bảng 4.5); điểm SEO on-page định lượng đạt 92–100 (Bảng 4.7).

Một hạng mục thiết kế chưa được hiện thực tại thời điểm đo và được báo cáo trung thực: các trang hiện **chưa phát cặp thẻ `hreflang`** khai báo quan hệ giữa hai phiên bản ngôn ngữ vi/en — hai phiên bản mới chỉ phân tách bằng tiền tố URL. Thiếu sót này không ngăn việc lập chỉ mục nhưng có thể khiến công cụ tìm kiếm chọn sai phiên bản ngôn ngữ cho người dùng quốc tế; việc khai báo phiên bản ngôn ngữ thay thế trong cấu hình metadata của Next.js là thay đổi nhỏ, được xếp vào danh mục việc cần làm trước vận hành chính thức.

### 4.6.2 Khả năng thu thập và kết xuất

Kiểm tra bằng cách tải trang với JavaScript tắt (curl) trên môi trường phát triển: HTML phản hồi chứa đầy đủ tiêu đề, thân bài và liên kết điều hướng — máy thu thập không cần thực thi JavaScript vẫn đọc trọn nội dung. Đây là hệ quả trực tiếp của kiến trúc SSR/ISR (mục 3.8.1) và là khác biệt nền tảng so với các ứng dụng kết xuất phía trình duyệt.

### 4.6.3 GEO — mức sẵn sàng cho tìm kiếm AI

Đối chiếu với các tiêu chí GEO (mục 2.2.3): hệ thống đáp ứng nhóm tiêu chí hạ tầng — HTML tự chứa, dữ liệu có cấu trúc, metadata nhất quán, `robots.txt` không chặn máy thu thập AI, tóm tắt tự chứa ngữ cảnh ở đầu bài viết. Nhóm tiêu chí nội dung (mật độ dữ kiện, trích dẫn nguồn trong bài) phụ thuộc người biên tập, nằm ngoài phạm vi kiểm soát của hệ thống. Đánh giá định lượng mức độ được trích dẫn chỉ khả thi sau khi website vận hành trên tên miền chính thức một thời gian đủ dài.

## 4.7 So sánh và đối chiếu

### 4.7.1 So sánh với website cũ của Khoa

Việc so sánh được thực hiện trên hai bình diện: năng lực chức năng (Bảng 4.8) và chỉ số đo định lượng trên trang chủ của hai hệ thống (Bảng 4.9).

*Bảng 4.8. Đối chiếu năng lực hệ thống mới và website cũ*

| Tiêu chí | Website cũ (PHP/MariaDB) | Hệ thống mới |
|---|---|---|
| Kiến trúc | Nguyên khối, hiển thị gắn dữ liệu | Headless ba tầng, API duy nhất, backend không trạng thái |
| Dàn trang | Không — bố cục cố định trong mã | Visual Builder kéo – thả, mẫu tái sử dụng |
| Quy trình xuất bản | Đăng trực tiếp | Nháp → duyệt → xuất bản; lên lịch; lịch sử phiên bản + khôi phục |
| Song ngữ | Bảng dịch riêng, phải kết nối bảng mỗi truy vấn | JSON song ngữ, giao diện hai thẻ, tự lùi về tiếng Việt |
| Phân quyền | Mọi tài khoản thao tác toàn bộ nội dung | 2 vai trò × phạm vi bộ môn, kiểm thử 40 ca |
| Bộ nhớ đệm | Không | 3 tầng (ISR, Redis, đệm module) |
| SEO | Không sitemap/metadata tự động | SSR/ISR, metadata động, JSON-LD, sitemap, hreflang, chuyển hướng 308 |
| Kiểm thử tự động | Không | Vitest + Playwright + cổng lint/type/build |
| Triển khai | Cài tay trên máy chủ | Docker Compose tự chứa, kịch bản một lệnh |
| Hướng dẫn người dùng | Không | Tour tương tác + trung tâm trợ giúp song ngữ |

Hai trang chủ được đo cùng ngày, cùng phiên bản công cụ và cùng cấu hình tiết lưu (mục 4.1.2). Kết quả trình bày trong Bảng 4.9.

*Bảng 4.9. So sánh chỉ số trang chủ website cũ và mới — Lighthouse 13.4.0, mobile, mạng Slow 4G mô phỏng, 12/07/2026; website cũ đo qua Internet, website mới đo trên bản build production tại máy đo*

| Chỉ số | Website cũ (phys.hcmus.edu.vn) | Website mới | Thay đổi |
|---|---|---|---|
| Điểm Performance | 13 | 74 | +61 điểm |
| Điểm SEO | 85 | 92 | +7 điểm |
| Điểm Best Practices | 96 | 96 | ngang bằng |
| Điểm Accessibility | 88 | 80 | −8 điểm |
| Trọng lượng trang | 21,2 MB | 0,82 MB | giảm 96% |
| Số yêu cầu HTTP | 137 | 27 | giảm 80% |
| FCP | 5,50 s | 1,25 s | nhanh 4,4 lần |
| LCP | 86,5 s | 5,51 s | nhanh 15,7 lần |
| TBT | 4.467 ms | 268 ms | giảm 94% |
| CLS | 0,243 | 0,000 | về mức lý tưởng |
| Speed Index | 30,8 s | 2,29 s | nhanh 13,5 lần |
| Dữ liệu có cấu trúc (JSON-LD) | 0 khối | 6 khối | bổ sung mới |
| Ảnh nạp trễ | 0/38 | 44/45 | bổ sung mới |
| Sitemap | trả về trang HTML (không hợp lệ) | XML hợp lệ, kèm `lastmod` | bổ sung mới |

Kết quả cho thấy khoảng cách lớn nhất nằm ở nhóm hiệu năng tải trang. Trang chủ cũ tải về 21,2 MB qua 137 yêu cầu HTTP mà không nạp trễ bất kỳ ảnh nào, khiến trong điều kiện mạng di động mô phỏng, chỉ số LCP lên tới 86,5 giây và Speed Index 30,8 giây — nói cách khác, người dùng điện thoại ở điều kiện mạng trung bình gần như không đợi được đến lúc trang hiển thị xong. Trang chủ mới, với cùng lượng nội dung hiển thị tương đương, chỉ tải 0,82 MB qua 27 yêu cầu: mức giảm 96% trọng lượng này là kết quả cộng hưởng của kết xuất HTML sẵn phía máy chủ, nạp trễ 44/45 ảnh và tối ưu kích thước ảnh tự động, đưa toàn bộ các chỉ số tốc độ về vùng chấp nhận được (FCP 1,25 giây; TBT giảm 94%) và độ ổn định bố cục về mức lý tưởng (CLS 0,243 → 0,000). Cần lưu ý một cách trung thực rằng phép đo trang mới không chứa độ trễ mạng thật ở thành phần phản hồi máy chủ; tuy nhiên các chỉ số chênh lệch nhiều lần ở trên chủ yếu phản ánh khối lượng tài nguyên và cấu trúc trang — các yếu tố không đổi khi triển khai — nên xu hướng so sánh vẫn giữ nguyên khi đo lại trên tên miền chính thức.

Ở nhóm khả năng được tìm thấy, điểm SEO tăng từ 85 lên 92 chưa phản ánh hết khác biệt về chất: website cũ tuy có thẻ mô tả và canonical nhưng hoàn toàn không có dữ liệu có cấu trúc và không có sitemap thực (địa chỉ `sitemap.xml` trả về một trang HTML), nghĩa là hơn 1.600 bài viết không có bản đồ nội dung nào cho máy tìm kiếm; hệ thống mới bổ sung 6 khối JSON-LD trên trang chủ, sitemap XML hợp lệ kèm thời điểm cập nhật và 397 chuyển hướng vĩnh viễn bảo toàn giá trị các URL cũ. Ngược lại, điểm Accessibility của trang mới thấp hơn trang cũ 8 điểm — kết quả ngược kỳ vọng đã được phân tích tại mục 4.4 và đưa vào danh mục việc cần hoàn thiện. Tổng hợp lại, hệ thống mới vượt nền tảng cũ ở đúng những chỉ tiêu mà mục tiêu đề tài nhắm đến (hiệu năng, khả năng được tìm thấy, năng lực quản trị), đồng thời số liệu cũng chỉ ra cụ thể các điểm còn phải cải thiện trước khi vận hành chính thức.

### 4.7.2 Mức độ hoàn thành mục tiêu khóa luận

*Bảng 4.10. Đối chiếu mục tiêu (mục 1.2) và kết quả đạt được*

| Mục tiêu | Kết quả | Mức độ |
|---|---|---|
| 1. Kiến trúc Headless ba tầng | Hoàn thành như thiết kế Chương 3; ba thành phần chạy độc lập, build sạch | Hoàn thành |
| 2. Trang quản trị + Visual Builder | Đầy đủ: soạn bài song ngữ, Puck, thư viện phương tiện, phiên bản + khôi phục, tour hướng dẫn | Hoàn thành |
| 3. Xác thực + phân quyền bộ môn | JWT 2 vai trò + phạm vi bộ môn; kiểm chứng API + 40 ca kiểm thử | Hoàn thành |
| 4. Di trú toàn bộ dữ liệu | 1.637 bài, 29 trang, 10 đơn vị, 45 chuyên mục, ~3,9 GB phương tiện; 397 chuyển hướng; đối chiếu Bảng 4.5 | Hoàn thành (36+7 tệp hỏng phía nguồn ghi nhận) |
| 5. Tối ưu hiệu năng + SEO | Đo lab 12/07/2026: Performance 13 → 74, trọng lượng giảm 96%, LCP nhanh 15,7 lần, CLS 0,000, SEO 92–100, sitemap + JSON-LD + 397 redirect (Bảng 4.9) | Hoàn thành |
| 6. Đóng gói triển khai Docker | Compose 6 dịch vụ + deploy.sh + tài liệu; ràng buộc CentOS 7.9 đã xử lý | Hoàn thành |

### 4.7.3 Tổng kết kết quả nghiên cứu

Hệ thống đạt trọn vẹn các mục tiêu chức năng: nền tảng quản trị nội dung hiện đại vận hành trên đúng khối dữ liệu thật của Khoa, quy trình biên tập – xuất bản hoàn chỉnh, phân quyền phản ánh đúng tổ chức, và toàn bộ tài sản nội dung cũ được bảo toàn kèm chuyển hướng URL. Tính đúng đắn được chứng minh bằng kiểm thử tự động (40/40) và kiểm thử chức năng có đối chứng trên cả bốn nhóm nghiệp vụ; hiệu quả được lượng hóa bằng phép đo cùng điều kiện với website cũ, cho thấy cải thiện nhiều lần ở đúng các chỉ tiêu đặt ra tại mục 1.2. Số liệu đo cũng chỉ ra ba hạng mục cần hoàn thiện trước vận hành chính thức — độ tương phản và nhãn ARIA (Accessibility 80–91), tối ưu ảnh hero và kho ảnh legacy, bổ sung thẻ `hreflang`.
