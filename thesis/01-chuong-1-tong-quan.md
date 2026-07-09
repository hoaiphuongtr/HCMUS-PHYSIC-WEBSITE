# CHƯƠNG 1. TỔNG QUAN

## 1.1 Động lực nghiên cứu

Website hiện hành của Khoa Vật lý – Vật lý Kỹ thuật vận hành trên một hệ quản trị nội dung viết bằng PHP với cơ sở dữ liệu MariaDB 10.6, được phát triển theo đơn đặt hàng từ nhiều năm trước. Qua khảo sát trực tiếp mã nguồn cơ sở dữ liệu (bản sao lưu 70 MB, 46 bảng), chúng tôi ghi nhận hệ thống đang lưu trữ khoảng 1.651 bài viết, 273 trang nội dung tĩnh, 415 môn học, 126 hồ sơ cán bộ cùng nhiều dữ liệu song ngữ Việt – Anh khác. Đây là khối tài sản thông tin lớn, nhưng nền tảng bên dưới lại tồn tại những hạn chế căn bản, có thể chia thành bốn nhóm.

**Thứ nhất, về vận hành nội dung.** Trình soạn thảo của hệ thống cũ (TinyMCE) sinh ra các khối HTML với định dạng nội tuyến tùy tiện; người biên tập không có công cụ dàn trang, không xem trước được kết quả trên bố cục thật, và không có quy trình duyệt – lên lịch xuất bản. Mỗi khi cần thêm một chuyên mục hoặc thay đổi bố cục trang, Khoa phải phụ thuộc vào đơn vị phát triển bên ngoài.

**Thứ hai, về kiến trúc phần mềm.** Mã nguồn PHP tự phát triển không còn được bảo trì, gắn chặt phần hiển thị với phần dữ liệu nên không thể tái sử dụng nội dung cho các kênh khác, khó kiểm thử tự động và tiềm ẩn rủi ro bảo mật do không được cập nhật.

**Thứ ba, về hiệu năng và khả năng được tìm thấy.** Trang được kết xuất hoàn toàn phía máy chủ PHP không có tầng bộ nhớ đệm, tốc độ tải chậm; các thẻ metadata, sitemap và dữ liệu có cấu trúc không được sinh tự động, làm giảm thứ hạng trên công cụ tìm kiếm — kênh tiếp cận chính của sinh viên tương lai khi tìm hiểu về ngành học.

**Thứ tư, về mô hình tổ chức.** Khoa gồm văn phòng khoa và nhiều bộ môn, mỗi bộ môn có nhu cầu tự quản lý tin tức của mình. Hệ thống cũ tuy có trường `deptid` trên dữ liệu nhưng cơ chế phân quyền không còn đáp ứng: mọi tài khoản quản trị đều thao tác được trên toàn bộ nội dung.

Những hạn chế trên đặt ra nhu cầu xây dựng lại nền tảng web của Khoa theo hướng: tách phần quản trị dữ liệu khỏi phần hiển thị, trao quyền dàn trang cho người biên tập không chuyên về kỹ thuật, bảo toàn toàn bộ dữ liệu cũ, và tối ưu ngay từ thiết kế cho hiệu năng lẫn công cụ tìm kiếm. Đó là động lực trực tiếp của đề tài này.

## 1.2 Mục tiêu nghiên cứu

Mục tiêu tổng quát của đề tài là xây dựng hoàn chỉnh hệ thống quản lý web mới cho Khoa Vật lý – Vật lý Kỹ thuật trên nền Next.js, NestJS và PostgreSQL, sẵn sàng thay thế website hiện hành. Mục tiêu tổng quát này được cụ thể hóa thành sáu mục tiêu thành phần, đồng thời là sáu tiêu chí để đối chiếu kết quả ở Chương 4.

Mục tiêu thứ nhất là thiết kế kiến trúc hệ thống theo mô hình Headless CMS ba tầng, trong đó máy chủ API NestJS làm nguồn chân lý duy nhất về dữ liệu, còn trang quản trị và trang công khai là hai ứng dụng Next.js độc lập. Mục tiêu thứ hai là xây dựng trang quản trị với trình xây dựng giao diện trực quan (Visual Builder) cho phép kéo – thả khối nội dung, cùng các phân hệ quản lý bài viết song ngữ, thư viện phương tiện, quy trình xuất bản có lên lịch và lịch sử phiên bản bố cục. Mục tiêu thứ ba là hiện thực cơ chế xác thực và phân quyền hai vai trò (quản trị viên cấp cao và quản trị viên) kết hợp phân quyền theo bộ môn, sao cho quản trị viên bộ môn chỉ thao tác được trên nội dung của bộ môn mình. Mục tiêu thứ tư là di trú toàn bộ dữ liệu từ hệ thống cũ — bài viết, trang nội dung, chuyên mục, đơn vị và tư liệu hình ảnh — sang lược đồ mới một cách tự động, có thể chạy lặp lại, kèm chuyển hướng các URL cũ. Mục tiêu thứ năm là tối ưu hiệu năng và SEO cho trang công khai thông qua kết xuất phía máy chủ, bộ nhớ đệm nhiều tầng, metadata động, sitemap, dữ liệu có cấu trúc và mức sẵn sàng cho công cụ tìm kiếm dùng trí tuệ nhân tạo. Mục tiêu cuối cùng là đóng gói và triển khai hệ thống bằng Docker trên máy chủ do Khoa cấp, kèm quy trình khởi tạo dữ liệu tự động để hệ thống có thể dựng lại hoàn toàn từ mã nguồn.

## 1.3 Đối tượng và phạm vi nghiên cứu

**Đối tượng nghiên cứu** của đề tài gồm: (i) mô hình hệ quản trị nội dung phi giao diện và trình xây dựng giao diện trực quan cho website đơn vị đào tạo; (ii) các kỹ thuật kết xuất, bộ nhớ đệm và tối ưu hóa công cụ tìm kiếm trên nền Next.js; (iii) bài toán di trú dữ liệu song ngữ từ hệ quản trị nội dung PHP/MariaDB thế hệ cũ sang lược đồ quan hệ mới trên PostgreSQL; (iv) mô hình phân quyền theo vai trò kết hợp phạm vi bộ môn cho tổ chức nhiều đơn vị.

**Phạm vi nghiên cứu** được giới hạn trên bốn phương diện. Về nghiệp vụ, hệ thống phục vụ hai nhóm người dùng là người quản trị nội dung (văn phòng khoa và các bộ môn) và khách truy cập công khai; các nghiệp vụ trong phạm vi gồm quản lý bài viết, trang bố cục, phương tiện, chuyên mục, đơn vị, tài khoản quản trị, đăng ký nhận tin và thống kê truy cập, trong khi các nghiệp vụ đào tạo chuyên sâu như thời khóa biểu hay quản lý sinh viên không thuộc phạm vi đề tài. Về dữ liệu di trú, đề tài ưu tiên các bảng nội dung có giá trị sử dụng lâu dài — bài viết, trang, chuyên mục, đơn vị, menu điều hướng và tư liệu phương tiện đi kèm; tài khoản người dùng cũ không được di trú do khác biệt định dạng mã hóa mật khẩu, còn nhật ký truy cập và các bảng cấu hình giao diện cũ được loại bỏ có chủ đích. Về ngôn ngữ, hệ thống hỗ trợ song ngữ tiếng Việt và tiếng Anh, trong đó tiếng Việt là ngôn ngữ mặc định. Về triển khai, hệ thống được triển khai thử nghiệm trên một máy chủ CentOS 7.9 (4 vCPU, 4 GB RAM) do Khoa cấp, chưa gắn tên miền chính thức; do đó các phép đo yêu cầu tên miền công khai và HTTPS được ghi nhận là hạng mục chờ điều kiện hạ tầng.

## 1.4 Nội dung thực hiện

Để đạt các mục tiêu trên, đề tài được triển khai qua bốn giai đoạn công việc nối tiếp nhau.

Giai đoạn thứ nhất là khảo sát và thiết kế. Chúng tôi phục hồi bản sao lưu cơ sở dữ liệu MariaDB của hệ thống cũ vào môi trường Docker cục bộ, phân tích 46 bảng để xác định mẫu tổ chức dữ liệu song ngữ `<entity>`/`<entity>lang`, thống kê khối lượng và phân loại bảng cần di trú hay loại bỏ. Trên kết quả khảo sát, lược đồ dữ liệu mới được thiết kế trên PostgreSQL bằng Prisma, mô hình hóa người dùng, đơn vị, bài viết, chuyên mục, trang bố cục, phiên bản bố cục, phương tiện, thẻ, đăng ký nhận tin và hồ sơ khách truy cập; các trường văn bản hiển thị được lưu dạng JSON song ngữ `{vi, en}`.

Giai đoạn thứ hai là xây dựng ba thành phần của hệ thống. Máy chủ API NestJS gồm các module nghiệp vụ (bài viết, trang bố cục, phương tiện, widget, đăng ký nhận tin, thống kê, quản trị viên), bộ nhớ đệm Redis với cơ chế xóa đệm khi ghi, cron xuất bản theo lịch, xác thực JWT và các guard phân quyền. Trang quản trị Next.js tích hợp Visual Builder trên thư viện Puck, trình soạn bài viết song ngữ, thư viện phương tiện, quản lý phiên bản bố cục có khôi phục, quản lý quản trị viên, cùng hướng dẫn sử dụng tương tác và trung tâm trợ giúp. Trang công khai Next.js kết xuất các bố cục đã xuất bản với định tuyến song ngữ, tối ưu SEO qua metadata động, sitemap, robots, dữ liệu có cấu trúc và chuyển hướng URL cũ.

Giai đoạn thứ ba là di trú dữ liệu: viết bộ script di trú đơn vị, chuyên mục, bài viết, trang nội dung và menu điều hướng; tải toàn bộ tư liệu hình ảnh về máy chủ mới; làm sạch và ánh xạ lại nội dung HTML; gắn nhãn bộ môn cho nội dung; tái tạo URL và sinh bảng chuyển hướng.

Giai đoạn cuối cùng là kiểm thử, đánh giá và triển khai: kiểm thử đơn vị phía máy chủ, kiểm thử chức năng các luồng nghiệp vụ chính (CRUD, phân quyền, xuất bản, di trú), đo hiệu năng và SEO bằng các công cụ chuẩn, so sánh với website cũ; đồng thời đóng gói Dockerfile cho từng thành phần, tệp docker-compose sản xuất kèm dịch vụ khởi tạo cơ sở dữ liệu và kịch bản triển khai tự động cho môi trường CentOS 7.9.
