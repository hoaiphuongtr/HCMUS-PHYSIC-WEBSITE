# KẾT LUẬN VÀ KIẾN NGHỊ

## Kết luận

Khóa luận đã hoàn thành mục tiêu đặt ra: xây dựng trọn vẹn hệ thống quản lý web mới cho Khoa Vật lý – Vật lý Kỹ thuật trên nền Next.js, NestJS và PostgreSQL, sẵn sàng thay thế website hiện hành. Đối chiếu với sáu mục tiêu thành phần tại mục 1.2, các kết quả chính gồm:

**Về kiến trúc**, hệ thống hiện thực mô hình Headless CMS ba tầng với một API duy nhất, backend không trạng thái và bộ nhớ đệm ba tầng; mẫu nguồn chân lý duy nhất cho phép một lần cập nhật menu lan tỏa đến hơn 1.600 trang. Kiến trúc này tách rời tiến hóa của tầng hiển thị khỏi tầng dữ liệu — giải quyết tận gốc hạn chế cấu trúc của website cũ.

**Về nghiệp vụ quản trị**, trang quản trị trao cho người biên tập không chuyên về kỹ thuật năng lực trước đây đòi hỏi lập trình viên: dàn trang kéo – thả bằng Visual Builder, soạn bài song ngữ, quy trình nháp – duyệt – xuất bản có lên lịch, lịch sử phiên bản có khôi phục, cùng hướng dẫn tương tác cho người dùng mới. Cơ chế phân quyền hai vai trò kết hợp phạm vi bộ môn phản ánh đúng tổ chức của Khoa và được kiểm chứng bằng kiểm thử.

**Về bảo toàn dữ liệu**, toàn bộ tài sản nội dung của website cũ — 1.637 bài viết song ngữ, 29 trang nội dung, 10 đơn vị, 45 chuyên mục và khoảng 3,9 GB tư liệu phương tiện — được di trú tự động bằng bộ script chạy lặp lại an toàn, đối chiếu số lượng và hiển thị so với nguồn; 397 quy tắc chuyển hướng vĩnh viễn giữ nguyên giá trị các liên kết đã lan truyền.

**Về chất lượng**, tính đúng đắn được chứng minh bằng 40/40 ca kiểm thử đơn vị cùng các kịch bản kiểm thử chức năng có đối chứng trên bốn nhóm nghiệp vụ (CRUD, phân quyền, xuất bản, di trú); hệ thống được đóng gói Docker tự chứa, dựng lại được từ mã nguồn bằng một kịch bản triển khai trên chính hạ tầng ràng buộc của Khoa.

## Hạn chế

Khóa luận nhìn nhận các hạn chế sau, phần lớn gắn với điều kiện hạ tầng tại thời điểm thực hiện:

1. Máy chủ thử nghiệm chưa gắn tên miền và HTTPS, nên nhóm phép đo sau triển khai (Core Web Vitals, Lighthouse, MDN Observatory, SSL Labs, kiểm định dữ liệu có cấu trúc) chưa có số liệu — các vị trí này được đánh dấu rõ trong Chương 4 kèm phương pháp đo chuẩn bị sẵn.
2. Quét `pnpm audit` còn 51 cảnh báo lỗ hổng trong cây phụ thuộc (3 nghiêm trọng) cần chu trình nâng cấp và đánh giá khả năng khai thác thực tế.
3. Một số dữ liệu nguồn hỏng không thể phục hồi (43 tệp phương tiện lỗi ngay trên máy chủ cũ); ba trang nội dung dạng ảnh/PDF nhúng hiển thị phụ thuộc proxy `/uploads` ở môi trường sản xuất.
4. Các nghiệp vụ đào tạo chuyên sâu của hệ thống cũ (thời khóa biểu, môn học, hồ sơ cán bộ chi tiết) mới dừng ở mức bảo toàn dữ liệu trong kế hoạch di trú mở rộng, chưa có giao diện quản trị riêng.

## Kiến nghị và hướng phát triển

Từ kết quả và hạn chế trên, chúng tôi kiến nghị lộ trình tiếp theo:

1. **Gắn tên miền chính thức và HTTPS** cho bản triển khai, hoàn tất nhóm phép đo Chương 4 còn treo và thiết lập theo dõi Core Web Vitals định kỳ qua Search Console; đây là bước điều kiện cho mọi đánh giá định lượng tiếp theo.
2. **Chu trình bảo trì phụ thuộc**: nâng các gói có bản vá, đưa `pnpm audit` vào cổng chất lượng, bổ sung Content-Security-Policy và các HTTP security header theo khuyến nghị Observatory.
3. **Mở rộng di trú** sang các thực thể đào tạo (môn học, ngành, hồ sơ cán bộ, đối tác) theo lược đồ đã thiết kế sẵn trong kế hoạch di trú, kèm các khối Visual Builder tương ứng (danh sách giảng viên, chương trình đào tạo).
4. **Nâng cấp trải nghiệm biên tập**: dịch máy có kiểm duyệt cho bản tiếng Anh còn khuyết, tìm kiếm toàn văn cho kho bài viết, và thống kê truy cập trực quan trên bảng điều khiển.
5. **Vận hành lâu dài**: sao lưu tự động cơ sở dữ liệu và kho phương tiện, giám sát lỗi hợp nhất (đã có Sentry ở trang quản trị) và quy trình cập nhật ảnh Docker định kỳ.

Hệ thống đã ở trạng thái sẵn sàng chuyển giao: mã nguồn, dữ liệu di trú, kịch bản triển khai và tài liệu vận hành đầy đủ để Khoa đưa vào sử dụng chính thức ngay khi hạ tầng tên miền hoàn tất.
