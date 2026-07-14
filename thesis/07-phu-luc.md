## PHỤ LỤC A: LƯỢC ĐỒ CƠ SỞ DỮ LIỆU ĐẦY ĐỦ

Phụ lục này bổ trợ cho mục 3.3 của khóa luận, liệt kê đầy đủ lược đồ dữ liệu của hệ thống được trích xuất trực tiếp từ tệp lược đồ Prisma trong mã nguồn, gồm 33 thực thể và 43 quan hệ khóa ngoại. Các trường quan hệ ảo (chỉ tồn tại ở tầng truy vấn, không phải cột dữ liệu) không được liệt kê.

### Phụ lục A – 1: Danh sách thực thể và trường dữ liệu

| Thực thể | Các trường dữ liệu |
|---|---|
| User | id (PK), email (duy nhất), firstName, lastName, password, avatarUrl, googleId (duy nhất), isActive, hasSetPreferences, phone, position, bio, departmentId, createdAt, updatedAt, lastLoginAt, tourCompletedAt |
| UserPreference | id (PK), userId (duy nhất), createdAt, updatedAt |
| Session | id (PK), expiresAt, token (duy nhất), ipAddress, userAgent, userId, createdAt, updatedAt |
| Account | id (PK), accountId, providerId, userId, accessToken, refreshToken, idToken, accessTokenExpiresAt, refreshTokenExpiresAt, scope, password, createdAt, updatedAt |
| Verification | id (PK), identifier, value, expiresAt, createdAt, updatedAt |
| VerificationCode | id (PK), email, code, expiresAt, createdAt |
| Department | id (PK), name, slug (duy nhất), description, email, phone, address, createdAt, updatedAt |
| Template | id (PK), name, slug (duy nhất), description, structure, isActive, createdBy, createdAt, updatedAt, snapshotId (duy nhất) |
| Post | id (PK), title, slug (duy nhất), body, excerpt, categoryId, departmentId, legacyId (duy nhất), coverMediaId, coverUrl, coverAlt, publishedAt, scheduledAt, rejectedAt, rejectReason, createdAt, updatedAt, createdBy, approvedBy, templateId, eventStartAt, eventEndAt, eventLocation, eventSpeakers, registrationUrl, metadata, aiSummary |
| Category | id (PK), slug (duy nhất), name, excerpt, image, legacyId (duy nhất), status, createdAt, updatedAt |
| ContentBlock | id (PK), postId, content, order, createdAt, updatedAt |
| PostTranslation | id (PK), postId, title, excerpt, blocks, aiSummary, isConfirmed, confirmedBy, confirmedAt, createdAt, updatedAt |
| PostReaction | id (PK), postId, userId, createdAt |
| PostComment | id (PK), postId, userId, parentId, content, isEdited, createdAt, updatedAt |
| Widget | id (PK), type (duy nhất), name, description, icon, configSchema, defaultConfig, isActive, createdAt, updatedAt |
| WidgetInstance | id (PK), widgetId, pageLayoutId, config, order, row, colSpan, isVisible, createdAt, updatedAt |
| PageLayout | id (PK), name, slug, description, puckData, publishedPuckData, isPublished, publishedAt, scheduledAt, sourcePostId, departmentId, createdBy, createdAt, updatedAt |
| PageLayoutVersion | id (PK), pageLayoutId, versionNumber, name, slug, description, puckData, publishedAt, publishedBy, createdAt |
| Tag | id (PK), name (duy nhất), slug (duy nhất), createdAt, updatedAt |
| PostTag | postId, tagId, createdAt |
| MediaTag | mediaId, tagId, createdAt |
| Media | id (PK), name, url, mimeType, size, width, height, alt, createdBy, departmentId, createdAt, updatedAt |
| PostMedia | id (PK), postId, mediaId, position, createdAt |
| SEOMetadata | id (PK), postId (duy nhất), pageLayoutId (duy nhất), metaTitle, metaDescription, keywords, canonicalUrl, ogTitle, ogDescription, ogImage, createdAt, updatedAt |
| Notification | id (PK), userId, title, message, link, isRead, readAt, createdAt |
| Subscription | id (PK), email (duy nhất), visitorId, verifiedAt, createdAt, updatedAt |
| VisitorProfile | id (PK), tagWeights, slugWeights, lastSeenAt, createdAt, updatedAt |
| SlugVisit | id (PK), visitorId, slug, createdAt |
| PostRead | id (PK), visitorId, postId, createdAt |
| FAQ | id (PK), question, answer, category, order, isActive, createdBy, updatedBy, createdAt, updatedAt |
| ChatbotTraining | id (PK), faqId, question, answer, context, version, isActive, createdBy, createdAt, updatedAt |
| AuditLog | id (PK), userId, action, entityType, entityId, changes, ipAddress, userAgent, createdAt |
| AIConfig | id (PK), provider, model, purpose, isDefault, isActive, rateLimit, createdAt, updatedAt |

### Phụ lục A – 2: Quan hệ khóa ngoại giữa các thực thể

| Thực thể | Trường khóa ngoại | Tham chiếu đến |
|---|---|---|
| User | departmentId | Department.id |
| UserPreference | userId | User.id |
| Session | userId | User.id |
| Account | userId | User.id |
| Template | createdBy | User.id |
| Template | snapshotId | Media.id |
| Post | createdBy | User.id |
| Post | approvedBy | User.id |
| Post | templateId | Template.id |
| Post | coverMediaId | Media.id |
| Post | categoryId | Category.id |
| Post | departmentId | Department.id |
| ContentBlock | postId | Post.id |
| PostTranslation | postId | Post.id |
| PostTranslation | confirmedBy | User.id |
| PostReaction | postId | Post.id |
| PostReaction | userId | User.id |
| PostComment | postId | Post.id |
| PostComment | userId | User.id |
| PostComment | parentId | PostComment.id |
| WidgetInstance | widgetId | Widget.id |
| WidgetInstance | pageLayoutId | PageLayout.id |
| PageLayout | createdBy | User.id |
| PageLayout | sourcePostId | Post.id |
| PageLayout | departmentId | Department.id |
| PageLayoutVersion | pageLayoutId | PageLayout.id |
| PageLayoutVersion | publishedBy | User.id |
| PostTag | postId | Post.id |
| PostTag | tagId | Tag.id |
| MediaTag | mediaId | Media.id |
| MediaTag | tagId | Tag.id |
| Media | createdBy | User.id |
| Media | departmentId | Department.id |
| PostMedia | postId | Post.id |
| PostMedia | mediaId | Media.id |
| SEOMetadata | postId | Post.id |
| SEOMetadata | pageLayoutId | PageLayout.id |
| Notification | userId | User.id |
| FAQ | createdBy | User.id |
| FAQ | updatedBy | User.id |
| ChatbotTraining | createdBy | User.id |
| ChatbotTraining | faqId | FAQ.id |
| AuditLog | userId | User.id |

## PHỤ LỤC B: MỘT SỐ MÀN HÌNH CỦA HỆ THỐNG

Phụ lục này trình bày bổ sung một số màn hình của hệ thống ngoài các giao diện đã giới thiệu tại mục 3.6, được chụp trên bản triển khai thử nghiệm.

### Phụ lục B – 1: Màn hình quản lý bài viết trong trang quản trị

【HÌNH B.1 — ảnh danh sách bài viết admin】

### Phụ lục B – 2: Màn hình quản lý tài khoản quản trị theo bộ môn

【HÌNH B.2 — ảnh quản lý tài khoản quản trị】

### Phụ lục B – 3: Một bài viết di trú trên giao diện công khai

【HÌNH B.3 — ảnh bài viết công khai】

### Phụ lục B – 4: Trang chủ phiên bản tiếng Anh

【HÌNH B.4 — ảnh trang chủ EN】

## PHỤ LỤC C: QUY TRÌNH TRIỂN KHAI HỆ THỐNG

Phụ lục này tóm tắt quy trình đưa hệ thống lên một máy chủ mới, bổ trợ cho mục 3.9. Toàn bộ quy trình được tự động hóa trong kịch bản triển khai của kho mã nguồn; người vận hành chỉ thực hiện các bước chuẩn bị và ra lệnh.

| Bước | Nội dung thực hiện | Ghi chú |
|---|---|---|
| 1 | Đồng bộ mã nguồn lên máy chủ (loại trừ thư viện phụ thuộc và kho phương tiện) | qua SSH |
| 2 | Tạo hai tệp biến môi trường từ tệp mẫu đi kèm: cấu hình chung và bí mật ứng dụng | xem Phụ lục C – 1 |
| 3 | Chạy kịch bản triển khai: sửa nguồn cài đặt gói, cài Docker, tạo bộ nhớ hoán đổi, mở tường lửa, đóng gói và khởi động sáu dịch vụ | một lệnh duy nhất |
| 4 | Đồng bộ kho phương tiện di trú (469 MB) vào thư mục tải lên của máy chủ API | sao chép một lần |
| 5 | Kiểm tra ba cổng dịch vụ và đăng nhập quản trị bằng tài khoản khởi tạo | xác nhận vận hành |

### Phụ lục C – 1: Các nhóm biến cấu hình bắt buộc

| Nhóm biến | Vai trò |
|---|---|
| Kết nối dữ liệu | Chuỗi kết nối PostgreSQL và Redis |
| Bí mật xác thực | Khóa ký access token, refresh token và phiên đăng nhập |
| Tài khoản khởi tạo | Email, mật khẩu của quản trị viên cấp cao được nạp lần đầu |
| Liên kết chéo | Danh sách origin được phép (CORS) và mã bí mật cho tín hiệu làm mới giữa máy chủ API với trang công khai |
| Tích hợp tùy chọn | Dịch vụ gửi email cho OTP, đăng nhập Google, giám sát lỗi — thiếu nhóm này hệ thống vẫn vận hành |
