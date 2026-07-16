# CHƯƠNG 3. THIẾT KẾ VÀ HIỆN THỰC HỆ THỐNG

Chương này trình bày toàn bộ quá trình thiết kế và hiện thực hệ thống, theo trình tự: kiến trúc tổng thể (3.2), cơ sở dữ liệu (3.3), xác thực – phân quyền (3.4), quy trình xuất bản nội dung (3.5), giao diện người dùng (3.6), di trú dữ liệu từ hệ thống cũ (3.7), thiết kế SEO – hiệu năng (3.8) và cuối cùng là tổ chức mã nguồn, đóng gói, triển khai (3.9).

## 3.1 Giới thiệu tổng quan

Hệ thống được đặt tên nội bộ là HCMUS Physics CMS, tổ chức dưới dạng một kho mã nguồn hợp nhất (monorepo) gồm ba thành phần chạy độc lập. Thành phần thứ nhất là máy chủ API xây dựng trên NestJS 11, lắng nghe cổng 3001, làm việc với PostgreSQL qua Prisma và dùng Redis làm bộ nhớ đệm đọc. Thành phần thứ hai là trang quản trị trên Next.js 16, cổng 3000, dành cho văn phòng khoa và các bộ môn soạn thảo, dàn trang và xuất bản nội dung. Thành phần thứ ba là trang công khai, cũng trên Next.js 16, cổng 3002, kết xuất các trang đã xuất bản cho khách truy cập. Cả ba thành phần viết bằng TypeScript, chia sẻ định nghĩa kiểu dữ liệu, được kiểm tra bằng cùng một bộ cổng chất lượng (lint, kiểm tra kiểu, kiểm thử đơn vị, build) và đóng gói bằng Docker khi triển khai.

## 3.2 Kiến trúc tổng thể

### 3.2.1 Phân tích yêu cầu hệ thống

Từ khảo sát hiện trạng ở mục 1.1 và trao đổi với đơn vị sử dụng, các yêu cầu của hệ thống được tổng hợp trong Bảng 3.1.

*Bảng 3.1. Yêu cầu chức năng và phi chức năng của hệ thống*

| Nhóm | Yêu cầu |
|---|---|
| Quản trị nội dung | CRUD bài viết song ngữ (tiêu đề, thân bài, tóm tắt, ảnh bìa, chuyên mục, thẻ, thông tin sự kiện); CRUD trang bố cục bằng Visual Builder; thư viện phương tiện có gắn thẻ |
| Quy trình xuất bản | Trạng thái nháp → chờ duyệt → xuất bản; lên lịch xuất bản tự động; lịch sử phiên bản bố cục và khôi phục |
| Phân quyền | Hai vai trò (quản trị viên cấp cao, quản trị viên); quản trị viên bộ môn chỉ thao tác trên nội dung bộ môn trực thuộc; văn phòng khoa quản lý nội dung toàn khoa |
| Trang công khai | Kết xuất bố cục đã xuất bản; định tuyến song ngữ vi/en; trang riêng từng bộ môn; thông báo trong ứng dụng theo thẻ nội dung; thống kê truy cập |
| Di trú | Bảo toàn toàn bộ bài viết, trang, chuyên mục, đơn vị và tư liệu phương tiện của website cũ; chuyển hướng URL cũ |
| Phi chức năng | HTML đầy đủ cho máy thu thập (SEO); bộ nhớ đệm giảm tải cơ sở dữ liệu; backend không trạng thái; dựng lại được toàn bộ hệ thống từ mã nguồn; chạy được trên máy chủ 4 GB RAM |

### 3.2.2 Kiến trúc ba tầng

Hệ thống tổ chức theo kiến trúc ba tầng: tầng trình bày (hai ứng dụng Next.js), tầng nghiệp vụ (API NestJS) và tầng dữ liệu (PostgreSQL, Redis, kho tệp phương tiện). Kiến trúc được minh họa trong Hình 3.1.

【HÌNH 3.1 — Kiến trúc tổng thể ba tầng: xuất PNG từ sơ đồ Mermaid "Topology tổng thể" trong `docs/architecture.md`】

*Hình 3.1. Kiến trúc tổng thể của hệ thống*

Ba nguyên tắc chi phối kiến trúc này. Một API duy nhất: cả trang quản trị lẫn trang công khai đều gọi chung máy chủ NestJS; không thành phần nào truy cập trực tiếp cơ sở dữ liệu. Backend không trạng thái: mọi trạng thái nằm ở PostgreSQL hoặc Redis; bản thân tiến trình NestJS không giữ phiên làm việc, nhờ đó có thể khởi động lại hoặc nhân bản mà không mất dữ liệu. Đệm đọc, xóa khi ghi: Redis chỉ đệm kết quả đọc; mỗi thao tác ghi trong service chủ động xóa các khóa đệm liên quan (mục 2.3.4). Tác vụ định kỳ (xuất bản theo lịch) chạy bằng cron mỗi phút ngay trong tiến trình NestJS, không cần dịch vụ hàng đợi riêng — phù hợp quy mô một khoa.

Bên trong NestJS, mã nguồn chia thành một phân hệ dùng chung — gồm lớp truy cập cơ sở dữ liệu, trình quản lý bộ nhớ đệm kết nối Redis, các chốt xác thực và phân quyền, bộ lọc ngoại lệ HTTP cùng các hàm tiện ích — và mười phân hệ nghiệp vụ: người dùng – xác thực, bố cục trang, bài viết, widget, phương tiện, đăng ký nhận tin, thống kê truy cập, đơn vị, chuyên mục và quản trị viên. Các phân hệ nghiệp vụ không gọi nhau qua HTTP mà tiêm dịch vụ trực tiếp qua cơ chế tiêm phụ thuộc. Quan hệ giữa các module được minh họa trong Hình 3.2.

【HÌNH 3.2 — Sơ đồ module NestJS: xuất PNG từ sơ đồ Mermaid "Bên trong NestJS" trong `docs/architecture.md`】

*Hình 3.2. Các module bên trong máy chủ NestJS và quan hệ phụ thuộc*

### 3.2.3 Mẫu thiết kế Single Source of Truth

Một vấn đề kinh điển của website nhiều trang là đồng bộ các thành phần dùng chung: thanh điều hướng và chân trang xuất hiện trên mọi trang, nhưng nếu mỗi bố cục lưu một bản sao riêng thì việc thêm một mục menu buộc phải sửa hàng nghìn bản ghi. Hệ thống giải quyết bằng mẫu nguồn chân lý duy nhất (Single Source of Truth): chỉ bố cục trang chủ lưu cấu hình thanh điều hướng và chân trang thật; mọi trang khác dùng hai khối bao dùng chung cho đầu trang và chân trang, khi kết xuất sẽ tự nạp cấu hình từ bố cục trang chủ. Nhờ đó, một lần cập nhật menu trên trang chủ lập tức lan tỏa đến toàn bộ hơn 1.600 trang của hệ thống. Để tránh mỗi lượt kết xuất phát sinh hai truy vấn trùng lặp, kết quả nạp cấu hình được đệm dùng chung với thời gian sống 30 giây.

## 3.3 Thiết kế cơ sở dữ liệu

### 3.3.1 Phân tích yêu cầu dữ liệu

Lược đồ dữ liệu phải đồng thời thỏa mãn: (i) quan hệ nghiệp vụ chặt chẽ giữa người dùng – đơn vị – bài viết – chuyên mục – trang bố cục; (ii) văn bản hiển thị song ngữ trên hầu hết thực thể; (iii) bố cục trang là cây JSON tự do của Visual Builder; (iv) dấu vết nguồn gốc cho dữ liệu di trú để chạy lặp lại an toàn; (v) phạm vi bộ môn trên nội dung phục vụ phân quyền. Yêu cầu (i) dẫn đến mô hình quan hệ chuẩn hóa với khóa ngoại; các yêu cầu (ii) và (iii) dẫn đến việc dùng cột JSONB; yêu cầu (iv) dẫn đến cột khóa gốc duy nhất (`legacyId`) trên các thực thể di trú; yêu cầu (v) dẫn đến cột nhãn bộ môn (`departmentId`) trên ba thực thể nội dung là bài viết, bố cục và phương tiện.

### 3.3.2 Sơ đồ thực thể – liên kết (ERD)

Lược đồ đầy đủ được khai báo tập trung trong tệp lược đồ Prisma, gồm hơn 30 thực thể; Hình 3.3 trình bày rút gọn các thực thể trung tâm và quan hệ giữa chúng. Lược đồ dữ liệu đầy đủ với 33 thực thể và 43 quan hệ khóa ngoại được trình bày tại Phụ lục A.

【HÌNH 3.3 — ERD rút gọn: xuất từ sơ đồ Mermaid erDiagram trong `docs/architecture.md`, bổ sung Department, Category, PageLayoutVersion】

*Hình 3.3. Sơ đồ thực thể – liên kết rút gọn của hệ thống*

### 3.3.3 Các bảng dữ liệu chính

Bảng 3.2 tóm tắt các bảng trung tâm cùng vai trò của chúng.

*Bảng 3.2. Các bảng dữ liệu chính*

| Bảng | Vai trò | Trường đáng chú ý |
|---|---|---|
| `User` | Tài khoản quản trị | `role` (SUPER_ADMIN/ADMIN), `departmentId`, `lastLoginAt`, `tourCompletedAt` |
| `Department` | Văn phòng khoa và các bộ môn | `slug` duy nhất, dùng làm tiền tố URL công khai |
| `Post` | Bài viết có cấu trúc | `title/body/excerpt` JSONB song ngữ; `status`; `legacyId`; `departmentId`; các trường sự kiện |
| `Category` | Chuyên mục bài viết | `name` JSONB song ngữ, `legacyId` |
| `Tag` | Thẻ nội dung, dùng chung cho bài viết và phương tiện | quan hệ n–n qua `PostTag`, `MediaTag` |
| `PageLayout` | Trang bố cục Visual Builder | `puckData` (bản nháp), `publishedPuckData` (ảnh chụp đã xuất bản), `scheduledAt`, `sourcePostId`, `departmentId` |
| `PageLayoutVersion` | Lịch sử phiên bản bố cục | `versionNumber`, `status` (CURRENT/ARCHIVED), ảnh chụp `puckData` |
| `Media` | Tư liệu phương tiện | `type`, kích thước, `departmentId`, người tải lên |
| `Widget`, `WidgetInstance` | Danh mục khối giao diện và thể hiện trên từng bố cục | `configSchema` JSONB |
| `Subscription` | Đăng ký nhận tin theo thẻ | `email` duy nhất, `tagSlugs[]` |
| `VisitorProfile`, `SlugVisit`, `PostRead` | Thống kê và cá nhân hóa khách truy cập | trọng số thẻ/trang dạng JSONB |
| `SEOMetadata` | Siêu dữ liệu SEO tùy chỉnh cho bài viết hoặc bố cục | `metaTitle`, `canonicalUrl`, Open Graph |
| `AuditLog` | Nhật ký thao tác quản trị | hành động, thực thể, thay đổi JSONB |

Điểm đáng chú ý là cặp trường `puckData` / `publishedPuckData` trên `PageLayout`: bản nháp và bản công khai tách rời, cho phép biên tập viên tiếp tục chỉnh sửa mà không ảnh hưởng trang đang phục vụ người đọc; thao tác xuất bản chỉ đơn giản sao chép ảnh chụp từ nháp sang cột công khai (mục 3.5).

### 3.3.4 Lưu trữ song ngữ và Visual Builder

Dữ liệu song ngữ được lưu theo quy ước JSON `{ "vi": "…", "en": "…" }` trong cột JSONB, thay vì bảng dịch riêng cho từng thực thể như hệ thống cũ (`posts` + `postslang`). Lựa chọn này dựa trên đặc điểm sử dụng: hệ thống chỉ có đúng hai ngôn ngữ cố định, mọi lượt đọc đều cần cả bản ghi, nên việc gộp hai ngôn ngữ vào một cột loại bỏ hoàn toàn phép kết nối bảng dịch trên mỗi truy vấn; đổi lại không thể đánh chỉ mục toàn văn theo từng ngôn ngữ — chấp nhận được vì tìm kiếm toàn văn không thuộc phạm vi. Phía giao diện, một hàm trợ giúp dùng chung chọn chuỗi theo ngôn ngữ hiện hành và tự lùi về tiếng Việt khi bản dịch tiếng Anh trống. Cây bố cục của Puck được lưu nguyên dạng trong cột `puckData`: mỗi nút ghi tên loại khối đã đăng ký cùng bộ thuộc tính của khối, và có thể chứa các vùng thả lồng nhau — cấu trúc này là đầu vào của thuật toán chèn dữ liệu bài viết ở mục 3.5.2.

## 3.4 Thiết kế xác thực và phân quyền

### 3.4.1 Mô hình hai vai trò

Hệ thống định nghĩa hai vai trò: quản trị viên cấp cao (SUPER_ADMIN — quản lý tài khoản, xem và thao tác được mọi nội dung) và quản trị viên nội dung (ADMIN). Khảo sát hệ thống cũ cho thấy bộ bốn bảng phân quyền chi tiết của nguồn (role, permission, permissiongroup, permissionrole) trên thực tế không được sử dụng đúng thiết kế; mô hình hai vai trò phẳng, bổ sung chiều phạm vi bộ môn (3.4.4), phản ánh đúng cách tổ chức thực của Khoa mà vẫn đơn giản để vận hành.

### 3.4.2 Quy trình đăng nhập

Hệ thống xác thực bằng cặp mã thông báo JSON Web Token (JWT) [16]: access token thời gian sống ngắn gửi kèm mỗi yêu cầu API, và refresh token thời gian sống dài dùng để cấp lại access token khi hết hạn. Tải trọng (payload) của mã thông báo gồm ba thông tin — định danh người dùng, vai trò và bộ môn trực thuộc — đủ để mọi quyết định phân quyền diễn ra ngay tại tầng API mà không cần truy vấn thêm hồ sơ người dùng. Quy trình đăng nhập được minh họa trong Hình 3.4. Ngoài đăng nhập bằng mật khẩu (băm bcrypt), hệ thống hỗ trợ đăng nhập Google OAuth cho tài khoản đã liên kết và luồng quên mật khẩu bằng mã OTP gửi qua email. Mỗi lần đăng nhập, hệ thống ghi nhận thời điểm truy cập gần nhất phục vụ thống kê "đang hoạt động" trên trang quản lý quản trị viên.

Bên cạnh xác thực và phân quyền, một số biện pháp phòng vệ nền tảng được áp dụng ở tầng API. Mã thông báo được gửi qua tiêu đề Authorization theo lược đồ Bearer thay vì cookie phiên, nhờ đó lớp tấn công giả mạo yêu cầu liên trang (CSRF) cổ điển — vốn dựa trên việc trình duyệt tự động đính kèm cookie — không có bề mặt khai thác. Máy chủ API bật bộ tiêu đề bảo vệ của thư viện helmet, trong đó có Content-Security-Policy mặc định, và chỉ chấp nhận yêu cầu từ danh sách origin khai báo tường minh qua CORS. Nội dung HTML di trú được làm sạch trước khi kết xuất để chặn mã kịch bản chèn từ dữ liệu cũ. Hai biện pháp chưa hiện thực — giới hạn tần suất yêu cầu và xoay vòng, thu hồi refresh token phía máy chủ — được ghi nhận tại mục 5.3 như việc cần bổ sung trước khi mở rộng quy mô sử dụng.

【HÌNH 3.4 — Sơ đồ tuần tự đăng nhập: đăng nhập → cấp access/refresh token → gọi API kèm Bearer → AuthGuard giải mã → refresh khi 401】

*Hình 3.4. Quy trình đăng nhập và làm mới mã thông báo*

### 3.4.3 Kiểm soát truy cập theo vai trò (RBAC)

Phân quyền theo vai trò hiện thực bằng cặp lớp chốt chặn (guard) của NestJS: chốt xác thực giải mã JWT và gắn danh tính vào ngữ cảnh yêu cầu; chốt vai trò đối chiếu vai trò của người gọi với khai báo quyền gắn trên từng nhóm điểm cuối API. Ví dụ toàn bộ phân hệ quản lý quản trị viên khai báo quyền quản trị viên cấp cao ở mức toàn phân hệ — mọi điểm cuối bên trong tự động từ chối vai trò quản trị viên thường. Các thông tin danh tính cần cho nghiệp vụ (như bộ môn trực thuộc) được trích sẵn và truyền tường minh vào tầng dịch vụ, giúp từng hàm nghiệp vụ dễ kiểm thử độc lập.

### 3.4.4 Phân quyền theo bộ môn (multi-tenant)

Chiều phân quyền thứ hai — phạm vi bộ môn — biến hệ thống thành mô hình nhiều đơn vị thuê chung (multi-tenant) mềm: cả ba loại nội dung (bài viết, bố cục, phương tiện) đều mang nhãn bộ môn, và quản trị viên thuộc một bộ môn chỉ thao tác trong phạm vi bộ môn trực thuộc. Toàn bộ quy tắc được cài đặt tập trung trong ba hàm thuần túy thuộc phân hệ dùng chung của máy chủ API. Hàm thứ nhất sinh điều kiện lọc cho các truy vấn đọc và liệt kê: quản trị viên cấp cao không bị giới hạn; quản trị viên văn phòng khoa hoặc chưa gán bộ môn xem được nội dung toàn khoa cùng nội dung chưa gắn nhãn; quản trị viên bộ môn chỉ xem được nội dung của bộ môn trực thuộc. Hàm thứ hai là biến thể dành cho thư viện phương tiện: quản trị viên bộ môn được đọc thêm tư liệu dùng chung của khoa để chèn vào bài viết, nhưng chỉ sửa hoặc xóa được tư liệu của chính bộ môn đó. Hàm thứ ba là cổng kiểm tra cho mọi thao tác ghi; yêu cầu vi phạm nhận phản hồi 404 thay vì 403 nhằm không tiết lộ sự tồn tại của tài nguyên khác bộ môn. Ma trận quyền tổng hợp trong Bảng 3.3.

*Bảng 3.3. Ma trận phân quyền theo vai trò và phạm vi bộ môn*

| Người dùng | Nội dung toàn khoa / chưa gắn nhãn | Nội dung bộ môn trực thuộc | Nội dung bộ môn khác | Quản lý tài khoản |
|---|---|---|---|---|
| SUPER_ADMIN | đọc + ghi | đọc + ghi | đọc + ghi | có |
| ADMIN văn phòng khoa | đọc + ghi | — (chính là toàn khoa) | không | không |
| ADMIN bộ môn | đọc (media dùng chung); không ghi | đọc + ghi | không (404) | không |

Việc dồn quy tắc vào các hàm thuần túy (không phụ thuộc cơ sở dữ liệu) cho phép kiểm thử đơn vị trực tiếp từng nhánh logic; bộ kiểm thử phân quyền là một phần trong 40 ca kiểm thử phía máy chủ được trình bày ở Chương 4. Ở tầng URL công khai, nội dung bộ môn mang tiền tố tên bộ môn trên đường dẫn (chẳng hạn /vat-ly-ung-dung/tin-tuc/…), nội dung toàn khoa giữ đường dẫn phẳng (/tin-tuc/…); mỗi bộ môn có trang riêng tại địa chỉ mang tên bộ môn do chính bộ môn đó biên tập.

## 3.5 Thiết kế quy trình xuất bản nội dung

### 3.5.1 Trạng thái bài viết

Bài viết tuân theo máy trạng thái gồm năm trạng thái: nháp (DRAFT) → chờ duyệt (PENDING) → đã xuất bản (PUBLISHED), với hai nhánh đã lên lịch (SCHEDULED — tự chuyển sang đã xuất bản khi đến hạn) và bị từ chối (REJECTED — kèm lý do). Sơ đồ chuyển trạng thái được minh họa trong Hình 3.5.

【HÌNH 3.5 — Sơ đồ trạng thái bài viết: DRAFT → PENDING → PUBLISHED/REJECTED; DRAFT → SCHEDULED → PUBLISHED (cron)】

*Hình 3.5. Máy trạng thái của bài viết*

### 3.5.2 Sao chép mẫu giao diện và chèn dữ liệu bài viết

Điểm đặc thù nhất của quy trình xuất bản là cách một *bài viết dạng dữ liệu* trở thành một *trang hoàn chỉnh*. Bài viết trong hệ thống là dữ liệu có cấu trúc (tiêu đề, thân bài, ảnh bìa, thẻ…), không phải HTML; để hiển thị, nó được "rót" vào một bố cục mẫu. Khi biên tập viên chọn xuất bản bài viết theo mẫu, một điểm cuối API chuyên trách thực hiện bốn bước: đọc bố cục mẫu chứa các khối giữ chỗ; sao chép sâu cây bố cục của mẫu; duyệt đệ quy toàn bộ cây — kể cả các vùng thả lồng nhau — và thay thuộc tính của sáu loại khối giữ chỗ (tiêu đề, thân bài, ảnh bìa, danh sách thẻ, thông tin sự kiện và đầu trang bài viết) bằng dữ liệu thật của bài viết; cuối cùng lưu kết quả thành một bố cục nháp mới kèm liên kết trỏ về bài viết gốc. Thuật toán duyệt – chèn được hiện thực dưới dạng một hàm thuần túy, và mỗi khối sau khi chèn được đánh dấu để lần đồng bộ sau nhận diện. Toàn bộ luồng được minh họa trong Hình 3.6.

【HÌNH 3.6 — Sơ đồ tuần tự post → layout → publish: xuất PNG từ sơ đồ Mermaid "Luồng tạo bài đăng" trong `docs/architecture.md`】

*Hình 3.6. Luồng tạo và xuất bản bài viết qua bố cục mẫu*

Cách tiếp cận này tách bạch hai vai trò: người thiết kế mẫu quyết định *bố cục* một lần; người viết bài chỉ lo *nội dung*, và mọi bài viết cùng mẫu tự động đồng nhất về hình thức.

### 3.5.3 Cơ chế đồng bộ giữa bài viết và bố cục giao diện

Vì bài viết và bố cục là hai bản ghi tách rời, hệ thống phải xử lý tình huống bài viết được sửa *sau khi* đã rót vào bố cục. Cơ chế đồng bộ trong phân hệ bài viết giải quyết việc này: mỗi lần bài viết được cập nhật, hệ thống tìm mọi bố cục có liên kết nguồn trỏ về bài viết đó và chạy lại phép chèn trên từng bố cục, làm mới các khối đã đánh dấu chèn. Chiều ngược lại, khi xuất bản một bố cục, thao tác chụp bản nháp sang bản công khai bảo đảm trang công khai chỉ thay đổi tại thời điểm xuất bản — biên tập dở dang không bao giờ lộ ra ngoài. Đồng thời, mỗi lần xuất bản ghi thêm một bản ghi vào lịch sử phiên bản: phiên bản mới mang trạng thái hiện hành, phiên bản trước tự chuyển sang lưu trữ. Biên tập viên xem lại lịch sử, so sánh hai phiên bản song song và khôi phục theo hai chế độ — về bản nháp để sửa tiếp, hoặc xuất bản lại ngay; thao tác khôi phục kiểm tra xung đột đường dẫn trước khi ghi.

### 3.5.4 Lên lịch xuất bản

Bài viết và bố cục đều có thể hẹn thời điểm công bố. Một tác vụ định kỳ chạy mỗi phút trong tiến trình máy chủ quét các bản ghi đã lên lịch đến hạn và thực hiện đúng thủ tục xuất bản đầy đủ — chụp bản công khai, ghi bản ghi phiên bản, xóa khóa đệm Redis và phát tín hiệu làm mới trang công khai — bảo đảm xuất bản theo lịch không đi tắt bất kỳ bước nào so với xuất bản thủ công.

## 3.6 Thiết kế giao diện người dùng

### 3.6.1 Giao diện đăng nhập

Trang đăng nhập gộp ba luồng: đăng nhập mật khẩu, đăng nhập Google và quên mật khẩu qua OTP email. Giao diện được minh họa trong Hình 3.7.

【HÌNH 3.7 — Ảnh chụp màn hình trang đăng nhập admin (localhost:3000)】

*Hình 3.7. Giao diện đăng nhập trang quản trị*

### 3.6.2 Giao diện quản trị

Trang quản trị tổ chức quanh thanh điều hướng dọc (tự thu gọn, mở rộng khi trỏ chuột) dẫn đến các phân hệ: bảng điều khiển, bài viết, trang bố cục, thư viện phương tiện, quản trị viên (chỉ SUPER_ADMIN) và cài đặt cá nhân. Trong đó, ba màn hình thể hiện rõ nhất triết lý thiết kế của hệ thống.

Màn hình thứ nhất là trình soạn bài viết: các trường song ngữ trình bày theo hai thẻ VI/EN, chuyên mục và thẻ chọn từ dữ liệu động, ảnh bìa chọn từ thư viện phương tiện, bài loại sự kiện có thêm khối thông tin thời gian – địa điểm – diễn giả, và nút lưu tách thành ba hành động lưu nháp, lên lịch hoặc gửi xuất bản. Màn hình thứ hai là Visual Builder (thư viện Puck) toàn màn hình với danh mục khối bên trái (khối nội dung, khối tự động như tin mới nhất hay sự kiện sắp tới, khối điều hướng), khung xem trước ở giữa và bảng thuộc tính bên phải; lịch sử phiên bản bố cục truy cập được từ chính trình soạn thảo. Màn hình thứ ba là lớp hướng dẫn tương tác: ở lần đăng nhập đầu, hệ thống tự chạy tour giới thiệu từng phân hệ (xây dựng trên thư viện driver.js), trạng thái hoàn thành được lưu trên hồ sơ người dùng; sau đó nút Trợ giúp nổi mở bảng hai thẻ — thẻ hướng dẫn tương tác chứa các chỉ dẫn từng bước làm nổi bật nút thật trên giao diện (tạo bố cục, xuất bản, viết bài, tải phương tiện), thẻ tài liệu chứa bộ câu hỏi thường gặp tìm kiếm được. Toàn bộ lớp hướng dẫn là song ngữ, mặc định tiếng Việt.

【HÌNH 3.8 — Ảnh chụp màn hình Visual Builder đang mở bố cục trang chủ】

*Hình 3.8. Trình xây dựng giao diện trực quan trong trang quản trị*

### 3.6.3 Giao diện công khai

Trang công khai kết xuất từ ảnh chụp bố cục đã xuất bản với bộ thành phần hiển thị tương ứng. Trang chủ gồm khối hero, các khối tin tức – sự kiện tự cập nhật, khối giới thiệu và chân trang. Hệ thống định tuyến song ngữ đặt tiền tố ngôn ngữ (vi hoặc en) trên mọi URL; thanh điều hướng tái tạo đúng cấu trúc menu chín mục của website cũ (mục 3.7.5). Mỗi bộ môn có trang riêng tại địa chỉ mang tên bộ môn, và các bài viết của bộ môn nằm dưới chuyên mục tin tức của địa chỉ đó. Trang học bổng minh họa khả năng lắp ghép của bộ thành phần: đầu trang và chân trang đồng bộ tự động từ trang chủ, phần thân là khối danh sách học bổng có ô tìm kiếm và phân trang lấy dữ liệu trực tiếp từ chuyên mục tương ứng. Thay cho việc thu thập email, hệ thống dùng cơ chế thông báo trong ứng dụng: trên thanh điều hướng có biểu tượng chuông cho phép khách theo dõi từng chủ đề (tuyển dụng, học bổng, sự kiện và các chuyên mục khác). Khi có bài mới thuộc chủ đề đã theo dõi, lần truy cập kế tiếp chuông hiển thị số lượng thông báo và tự mở danh sách bài mới; khách bấm vào để đọc hoặc đánh dấu đã xem. Toàn bộ trạng thái theo dõi được lưu ở phía trình duyệt nên không cần đăng nhập hay cung cấp email, và hệ thống không lưu thông tin cá nhân của người xem.

【HÌNH 3.9 — Ảnh chụp màn hình trang chủ công khai /vi và một trang bài viết】

*Hình 3.9. Giao diện trang công khai*

## 3.7 Di trú dữ liệu từ hệ thống cũ

### 3.7.1 Khảo sát hệ thống nguồn

Hệ thống nguồn là CMS PHP với MariaDB 10.6, khảo sát qua bản sao lưu SQL 70 MB gồm 46 bảng. Ba đặc điểm cấu trúc chi phối chiến lược di trú: thứ nhất, mọi thực thể tách đôi thành bảng dữ liệu và bảng dịch đi kèm, khóa theo mã ngôn ngữ (1 là tiếng Việt, 2 là tiếng Anh); thứ hai, hệ thống dùng cơ chế xóa mềm bằng cột đánh dấu — chỉ những bản ghi chưa bị đánh dấu xóa mới được di trú; thứ ba, hầu hết bảng mang mã bộ môn gắn nội dung với đơn vị sở hữu. Khối lượng chính: 1.651 bài viết (3.302 bản ghi dịch), 273 trang nội dung, 49 chuyên mục, 383 mục menu, 10 đơn vị.

### 3.7.2 Chiến lược ánh xạ dữ liệu

Bảng 3.4 tóm tắt quyết định ánh xạ cho từng nhóm bảng nguồn.

*Bảng 3.4. Ánh xạ dữ liệu hệ thống cũ sang lược đồ mới*

| Bảng nguồn | Đích | Ghi chú |
|---|---|---|
| `depts` + `deptslang` | `Department` | hợp nhất bản ghi trùng; slug chuẩn hóa |
| `categories` + `categorieslang` | `Category` | `name` JSONB song ngữ |
| `posts` + `postslang` | `Post` | gộp hai bản ghi dịch thành `{vi, en}`; trạng thái 1→PUBLISHED, 0/2→DRAFT |
| `pages` + `pageslang` | `PageLayout` | tái tạo thành trang Visual Builder (3.7.5) |
| `menus` + `menuslang` | Navbar trên bố cục `trang-chu` | tái tạo dạng dữ liệu Puck, không di trú bảng |
| `users` | *không di trú* | băm mật khẩu PHP `$2y$` không tương thích; tạo lại tài khoản trên hệ mới |
| bảng phân quyền (4 bảng), `slogs`, `online`, `homes`… | *loại bỏ* | thay bằng cơ chế mới hoặc không còn giá trị |

Hai nguyên tắc xuyên suốt: bảo toàn khóa gốc — mọi bản ghi di trú giữ `legacyId` duy nhất, giúp script chạy lặp lại theo kiểu upsert (chạy lại không tạo bản sao) và truy vết đối chiếu về nguồn; gộp bản dịch — mỗi cặp bản ghi vi/en gộp thành một JSON `{vi, en}`, bản dịch tiếng Anh khuyết được để trống và giao diện tự lùi về tiếng Việt.

### 3.7.3 Xử lý nội dung HTML và phương tiện

Thân bài nguồn là HTML tự do từ trình soạn thảo TinyMCE, kèm định dạng nội tuyến dày đặc. Chuyển đổi sang khối Visual Builder có cấu trúc là bất khả thi ở quy mô 1.600 bài mà không mất mát; hệ thống chọn chiến lược giữ nguyên HTML có kiểm soát: giải mã các thực thể HTML, loại bỏ mã kịch bản và các thuộc tính bắt sự kiện tiềm ẩn rủi ro, viết lại đường dẫn phương tiện về kho tệp dành riêng cho dữ liệu cũ. Phía hiển thị, một khối kết xuất chuyên dụng trình bày trung thực phần HTML này — giữ màu chữ, bảng biểu, danh sách của bản gốc — chỉ can thiệp ba việc: phân giải địa chỉ phương tiện về đúng máy chủ tệp, ép ảnh co giãn theo khung, và khôi phục đường kẻ bảng cùng dấu đầu dòng vốn bị bộ khung giao diện đặt lại.

Tư liệu phương tiện được tải tự động từ máy chủ cũ: hệ thống quét ảnh bìa và mọi thẻ ảnh trong thân bài hai ngôn ngữ, tải song song sáu luồng về kho tệp mới. Kết quả thực đo: 1.909 đường dẫn duy nhất — 1.870 tải thành công, 36 hỏng ngay trên máy chủ nguồn, 3 đã có sẵn; tổng dung lượng 3,9 GB. Riêng tư liệu của các trang nội dung: 180/187 tệp (7 tệp hỏng phía nguồn).

Sau di trú, kho ảnh được chuẩn hóa cho môi trường web: các ảnh vượt 1.600 điểm ảnh chiều rộng được thu về đúng mức và nén lại theo định dạng gốc, đưa tổng dung lượng kho từ 4,0 GB xuống 469 MB (nén 1.273 tệp, không tệp nào lỗi) mà không đổi đường dẫn. Đồng thời, toàn bộ thẻ ảnh trong thân bài di trú được bổ sung thuộc tính kích thước đọc từ tệp thật (5.877 thẻ trong 402 bài viết và 410 bố cục), giúp trình duyệt giữ chỗ bố cục trước khi ảnh tải xong và loại trừ dịch chuyển bố cục.

### 3.7.4 Quy trình di trú

Quy trình tổng thể (Hình 3.10) gồm bốn giai đoạn, toàn bộ là các script tự động chạy lặp lại an toàn nhờ ghi đè theo khóa gốc. Giai đoạn thứ nhất phục hồi nguồn: script khởi động tự dựng một MariaDB 10.6 tạm thời trong Docker, nạp bản sao lưu, rồi đọc bảng ngôn ngữ của nguồn để xác nhận ánh xạ mã ngôn ngữ. Giai đoạn thứ hai di trú các thực thể theo thứ tự an toàn khóa ngoại — đơn vị, người dùng cũ (chỉ hồ sơ, không mật khẩu), chuyên mục, rồi bài viết; kết quả thực đo gồm 10 đơn vị, 45 chuyên mục di trú (cộng 5 chuyên mục mặc định của hệ mới) và 1.637 bài viết (nâng tổng số lên 1.704 bài cùng 67 bài có sẵn). Giai đoạn thứ ba tải và ánh xạ phương tiện: sau khi tải kho tệp về (mục 3.7.3), bước ánh xạ cập nhật 1.636 bài viết và 7 chuyên mục trỏ về kho tệp mới. Giai đoạn cuối gắn nhãn bộ môn: đọc mã bộ môn gốc của từng bài qua khóa gốc rồi gắn nhãn cho 1.587 bài viết cùng 1.540 bố cục phát sinh, tạo nền dữ liệu cho cơ chế phân quyền bộ môn (mục 3.4.4).

【HÌNH 3.10 — Sơ đồ khối 4 giai đoạn di trú: dump → MariaDB Docker → upsert Postgres → tải media → backfill bộ môn】

*Hình 3.10. Quy trình di trú dữ liệu bốn giai đoạn*

Vì các script ghi thẳng vào cơ sở dữ liệu (không qua tầng dịch vụ), chúng chủ động xóa vùng đệm Redis và phát tín hiệu làm mới trang công khai sau khi chạy — tái lập đúng bất biến "ghi thì xóa đệm" của kiến trúc.

### 3.7.5 Tái tạo trang và chuyển hướng URL

Ngoài bài viết, hệ thống tái tạo *cấu trúc điều hướng* và *trang nội dung* của website cũ. Menu chín mục với 36 liên kết con (song ngữ) được phục dựng từ hai bảng menu của nguồn và ghi vào thanh điều hướng của bố cục trang chủ — nhờ cơ chế nguồn chân lý duy nhất, toàn bộ website lập tức có thanh điều hướng giống hệ thống cũ. 29 trang nội dung (giới thiệu, quy chế học tập, đào tạo…) được dựng lại thành trang bố cục hoàn chỉnh: khung trang gồm banner tiêu đề, thân bài hai cột kèm thanh bên "Danh mục" và "Tin mới nhất", đúng khung hình của website cũ.

Về URL, bài viết bộ môn được chuyển sang đường dẫn mang tiền tố tên bộ môn: hệ thống đổi đường dẫn của 388 bố cục từ dạng phẳng sang dạng có tiền tố (1.152 bài toàn khoa giữ đường dẫn phẳng) và sinh bảng ánh xạ 397 chuyển hướng; tầng trung gian của trang công khai trả về chuyển hướng vĩnh viễn 308 từ URL cũ sang URL mới, bảo toàn liên kết đã lan truyền và giá trị SEO tích lũy. Chín trang bộ môn được khởi tạo từ bố cục trang chủ và gắn nhãn bộ môn để chính bộ môn đó tự biên tập.

### 3.7.6 Đối chiếu và kiểm tra

Kết quả di trú được đối chiếu ở ba mức: (i) số lượng — so khớp số bản ghi nguồn (sau lọc xóa mềm) với số bản ghi đích qua `legacyId`; (ii) hiển thị — kiểm tra tự động bằng Playwright: chụp và so màn hình trang mới với trang cũ trên các trang đại diện (bảng biểu giữ đường kẻ, tiêu đề màu, danh sách có dấu đầu dòng, lưới ảnh giảng viên), xác nhận cả 30 liên kết nội bộ trên thanh điều hướng phân giải về trang đã xuất bản, chuyển ngôn ngữ EN đổi đúng nhãn; (iii) chức năng — mở bài viết di trú trong trình soạn thảo quản trị, xác nhận hai thẻ VI/EN hiển thị đúng nội dung, ảnh bìa nạp từ kho tệp mới. Các trường hợp lỗi phía nguồn (36 + 7 tệp phương tiện hỏng) được ghi nhận trong nhật ký chạy script thay vì làm dừng quy trình. Bảng số liệu di trú tổng hợp được trình bày tại mục 4.2 (kiểm thử di trú).

## 3.8 Thiết kế tối ưu hóa công cụ tìm kiếm (SEO) và hiệu năng

### 3.8.1 Chiến lược kết xuất trang (SSR/ISR)

Toàn bộ trang công khai kết xuất phía máy chủ thành HTML đầy đủ — yêu cầu nền tảng của SEO (mục 2.2.2). Trên đó, các trang nội dung áp dụng ISR: bản HTML được đệm và phục vụ tĩnh, làm mới theo chu kỳ một giờ *hoặc* ngay lập tức khi máy chủ API phát tín hiệu làm mới theo thẻ — khi nội dung được xuất bản, máy chủ API gọi sang trang công khai kèm mã bí mật, vô hiệu đúng các thẻ đệm bị ảnh hưởng (thẻ của trang vừa thay đổi và thẻ sitemap). Kết quả là trang vừa có tốc độ phản hồi của tệp tĩnh vừa phản ánh nội dung mới trong vài giây.

### 3.8.2 Metadata động và dữ liệu có cấu trúc

Mỗi trang sinh siêu dữ liệu từ chính nội dung: thẻ tiêu đề, mô tả (từ tóm tắt bài viết), canonical và bộ thẻ Open Graph kèm ảnh bìa. Bài viết nhúng khối dữ liệu có cấu trúc JSON-LD loại NewsArticle (tiêu đề, thời điểm đăng, tác giả tổ chức, ảnh); biên tập viên có thể ghi đè qua bảng siêu dữ liệu SEO khi cần tinh chỉnh thủ công. Hai phiên bản ngôn ngữ được phân tách bằng tiền tố URL (/vi, /en) và được khai báo tường minh bằng bộ thẻ hreflang (vi, en và x-default) trên từng trang, giúp công cụ tìm kiếm chọn đúng phiên bản ngôn ngữ cho người dùng.

### 3.8.3 Sitemap, robots và lập chỉ mục

Tệp `sitemap.xml` sinh động từ danh sách bố cục đã xuất bản qua một điểm cuối công khai chuyên dụng (tách khỏi nhóm điểm cuối quản trị có xác thực), kèm thời điểm cập nhật từng URL; `robots.txt` mở cho máy thu thập và trỏ về sitemap. Cơ chế chuyển hướng 308 (mục 3.7.5) bảo đảm URL cũ trên các công cụ tìm kiếm dẫn người dùng và máy thu thập về địa chỉ mới thay vì lỗi 404.

### 3.8.4 Tối ưu tài nguyên — ảnh

Ảnh giao diện dùng thành phần ảnh tối ưu của Next.js: tự sinh nhiều kích cỡ, nạp trễ khi nằm ngoài khung nhìn, và giữ chỗ kích thước để tránh dịch chuyển bố cục (CLS). Ảnh có nhiều khả năng là phần tử LCP (ảnh hero, ảnh bìa đầu trang) được ưu tiên nạp trước. Ảnh trong thân bài di trú — vốn là HTML thô — được phân giải về đúng máy chủ phương tiện, định tuyến qua bộ tối ưu ảnh của Next.js để phục vụ ở kích thước hiển thị và định dạng WebP thay vì tệp gốc, và ép co giãn theo khung hiển thị.

### 3.8.5 Bộ nhớ đệm nhiều tầng

Hiệu năng đọc được bảo đảm bởi ba tầng đệm nối tiếp, mỗi tầng có cơ chế vô hiệu riêng:

*Bảng 3.5. Các tầng bộ nhớ đệm của hệ thống*

| Tầng | Vị trí | Phạm vi | Vô hiệu |
|---|---|---|---|
| ISR | Trang công khai (Next.js) | HTML từng trang | revalidate theo thẻ khi xuất bản; chu kỳ 1 giờ |
| Redis | API NestJS | kết quả truy vấn đọc | service xóa khóa khi ghi; script di trú xóa vùng tên |
| Đệm module | Thành phần dùng chung | cấu hình header/footer (30 s), tin mới nhất (60 s) | hết hạn theo thời gian sống |

Ba tầng cộng hưởng: phần lớn lượt truy cập dừng ở HTML tĩnh ISR; khi cần kết xuất lại, dữ liệu lấy từ Redis thay vì PostgreSQL; các thành phần lặp trên mọi trang (header, thanh tin mới) không phát sinh truy vấn trùng trong cùng chu kỳ ngắn.

### 3.8.6 Tối ưu cho công cụ tìm kiếm dùng AI (GEO)

Trên nền hạ tầng SEO kỹ thuật (HTML đầy đủ không phụ thuộc JavaScript, JSON-LD, metadata nhất quán), hệ thống bổ sung các tín hiệu hướng GEO: `robots.txt` không chặn máy thu thập của các hệ thống AI phổ biến; nội dung bài viết giữ cấu trúc tiêu đề phân cấp rõ ràng giúp trích xuất theo đoạn; tóm tắt bài viết (excerpt) cung cấp câu trả lời tự chứa ngữ cảnh ngay đầu trang. Mức sẵn sàng GEO được đánh giá tại mục 4.6.3.

## 3.9 Hiện thực và triển khai

### 3.9.1 Tổ chức mã nguồn

Kho mã nguồn hợp nhất với ba thành phần (mục 3.1) cho phép cài đặt thư viện phụ thuộc một lần, chia sẻ cấu hình, và chạy hợp nhất từ gốc kho các thao tác phát triển, kiểm tra mã, kiểm tra kiểu, kiểm thử và đóng gói. Quy ước xuyên suốt của dự án là mọi thay đổi phải vượt qua đủ bốn cổng chất lượng (kiểm tra mã, kiểm tra kiểu, kiểm thử đơn vị, đóng gói) trước khi hợp nhất; một kịch bản khởi động chuẩn ở gốc kho kiểm tra môi trường lành mạnh, bảo đảm phiên làm việc kế tiếp luôn khởi động lại được. Trang quản trị tích hợp Sentry theo dõi lỗi thời gian thực và Playwright cho kiểm thử đầu-cuối.

### 3.9.2 Container hóa

Mỗi thành phần có tệp mô tả ảnh Docker riêng; tệp mô tả Docker Compose cho môi trường triển khai định nghĩa toàn bộ ngăn xếp gồm sáu dịch vụ: cơ sở dữ liệu PostgreSQL 16 với volume lưu trữ bền vững, Redis, một dịch vụ khởi tạo chạy một lần (đẩy lược đồ và nạp dữ liệu ban đầu), máy chủ API và hai ứng dụng web trên ba cổng 3000–3002. Ngăn xếp tự chứa — không phụ thuộc dịch vụ bên ngoài — nên dựng được nguyên trạng trên bất kỳ máy chủ nào có Docker. Một điểm phụ thuộc chéo đáng chú ý: trang công khai dùng chung một số thành phần giao diện với trang quản trị, nên ảnh Docker của nó phải đóng gói từ gốc kho với đầy đủ cả ba thành phần.

【HÌNH 3.11 — Sơ đồ triển khai: 6 container trên máy chủ CentOS 7.9, cổng 3000–3002 công bố ra ngoài】

*Hình 3.11. Sơ đồ triển khai bằng Docker Compose*

### 3.9.3 Ràng buộc môi trường máy chủ

Máy chủ được cấp chạy CentOS 7.9 với glibc 2.17, trong khi Node.js 24 yêu cầu glibc ≥ 2.28 — Node không thể chạy trực tiếp trên máy. Ràng buộc này là lý do quyết định chọn triển khai toàn bộ bằng Docker: ứng dụng chạy trong ảnh chứa glibc mới, tách khỏi hệ điều hành chủ. Hai ràng buộc thực tế khác: CentOS 7 đã hết vòng đời nên kịch bản triển khai phải chuyển nguồn cài đặt gói về kho lưu trữ dài hạn của CentOS trước khi cài Docker; máy chỉ có 4 GB RAM nên phải bật bộ nhớ hoán đổi trước khi đóng gói ảnh (quá trình đóng gói Next.js có thể vượt RAM vật lý) và đóng gói tuần tự từng ảnh khi cần.

### 3.9.4 Cấu hình và biến môi trường

Cấu hình tách hoàn toàn khỏi mã nguồn theo biến môi trường: chuỗi kết nối PostgreSQL/Redis, các khóa bí mật JWT, tài khoản quản trị khởi tạo, danh sách origin được phép (CORS), mã bí mật cho tín hiệu làm mới giữa máy chủ API và trang công khai, cùng các tích hợp tùy chọn (dịch vụ gửi email cho OTP, Google OAuth, Sentry) — thiếu tích hợp tùy chọn hệ thống vẫn vận hành, chỉ tắt tính năng tương ứng. Một tệp mẫu đi kèm liệt kê đầy đủ các biến bắt buộc.

### 3.9.5 Khởi tạo và nạp dữ liệu

Dịch vụ khởi tạo bảo đảm cơ sở dữ liệu sẵn sàng ngay lần dựng đầu: đẩy lược đồ dữ liệu rồi nạp tuần tự dữ liệu ban đầu — tài khoản quản trị cấp cao, danh mục widget, chuyên mục mặc định và bố cục trang chủ. Đáng chú ý, bước nạp trang chủ tái sử dụng đúng cấu trúc menu chín mục đã phục dựng từ hệ thống cũ, nên một hệ thống dựng mới từ đầu vẫn có thanh điều hướng chuẩn. Dữ liệu di trú (mục 3.7) nạp bằng bộ script riêng sau khi ngăn xếp chạy; kho phương tiện 3,9 GB đồng bộ bằng công cụ truyền tệp do vượt khả năng đóng gói trong ảnh.

### 3.9.6 Quy trình triển khai tự động

Một kịch bản triển khai duy nhất gói toàn bộ quy trình trên máy chủ mới: sửa nguồn cài đặt gói, cài Docker, tạo bộ nhớ hoán đổi, mở tường lửa cho ba cổng ứng dụng, rồi đóng gói và khởi động toàn bộ ngăn xếp. Người vận hành chỉ cần đồng bộ mã nguồn, điền hai tệp biến môi trường và chạy một lệnh. Tài liệu triển khai đi kèm ghi lại quy trình, các lỗi đặc thù của CentOS 7 đã gặp cùng cách xử lý (nguồn gói ngừng hoạt động, cơ chế SELinux chặn truy cập, tràn bộ nhớ khi đóng gói) và phương án dự phòng đóng gói ảnh trên máy phát triển rồi chuyển sang máy chủ.
