# CONTEXT — Bàn giao đầy đủ (đọc file này đầu mỗi session mới)

> Mục đích: một tài liệu duy nhất để một session Claude Code mới nắm **100%** trạng
> thái dự án mà không phụ thuộc vào việc nén ngữ cảnh. Cập nhật lần cuối: 16/07/2026.
> Chi tiết lịch sử từng phiên xem thêm `progress.md`; quy ước làm việc xem `CLAUDE.md`.

---

## 0. Dự án là gì

**hcmus-physic-website** — CMS cho Khoa Vật lý – Vật lý kỹ thuật, ĐH KHTN (ĐHQG-HCM).
Đây là đề tài khóa luận tốt nghiệp (KLTN) của **Trần Hoài Phương** (SVTH), GVHD **ThS.
Nguyễn Vương Thùy Ngân** ("Cô"); người liên hệ demo/hội đồng là **thầy Tuấn**.

pnpm monorepo, 3 workspace (Node 20/24, TypeScript):
- `backend/` — NestJS API, cổng **3001**. Prisma 7 + PostgreSQL 16 + Redis 7 (cache).
- `frontend/` — Next.js 16 **admin** console, cổng **3000**. Chứa Puck visual builder + toàn bộ
  widget dùng chung (public import lại qua alias `@admin`).
- `frontend-public/` — Next.js 16 **trang công khai**, cổng **3002**.

React 19.2, Next 16.2.6, NestJS 11, Prisma 7.8, Puck 0.21. Đọc `docs/architecture.md`.

**Nhánh hiện tại:** `wip/feat-013-legacy-migration` (KHÔNG phải main). Toàn bộ công việc
gần đây nằm ở đây. Merge lên `main` là việc của Phương (và sẽ kích hoạt CD — xem §6).

---

## 1. Sandbox demo (đang chạy, quan trọng nhất)

- **Máy chủ:** CentOS 7.9, IP **103.88.121.212**, SSH **port 63379**, user **vlkt**.
  Xác thực bằng **mật khẩu** (dùng paramiko trong script; mật khẩu dạng `<user>@<năm>` —
  có trong transcript, KHÔNG in ra chat). 4 vCPU / 4GB RAM / ~18GB đĩa trống.
- **URL:** gõ trần `http://103.88.121.212` → admin (map 80→3000). Public `:3002`, admin `:3000`,
  API `:3001`. **Chưa có HTTPS/tên miền** → phải gõ `http://`.
- **5 container** (docker compose, `~/hcmus-cms/`): db (postgres:16-alpine), redis (7-alpine),
  backend, admin, public. DB tên `hcmus_physics`, user Postgres **`physics`** (KHÔNG phải postgres).
- **Kho media:** bind-mount `~/hcmus-cms/backend/uploads:/app/uploads` (~522MB gốc + 408MB
  `legacy-mirror/`). Tồn tại qua mỗi lần deploy. **KHÔNG chạy `docker compose down -v`.**
- **Tài khoản demo/e2e** (đã verify đăng nhập + phân quyền):
  - SUPER_ADMIN: `demo.superadmin@hcmus.edu.vn` / `Demo@Ab9trMxtjwno`
  - ADMIN bộ môn VLUD (e2e, demo phân quyền): `vlud_admin@hcmus.edu.vn` / `E2e@Ad8OJT6BmLSx`
  - Lần đăng nhập ĐẦU của acc mới sẽ bật tour onboarding (feature). Token refresh 7 ngày.
- **Backup DB trên box:** `~/backup-pre-mirror-20260715.sql.gz`,
  `~/backup-pagelayout-pre-hocbong-20260716.sql.gz`. Rollback:
  `gunzip -c <file> | docker exec -i hcmus-cms-db-1 psql -U physics -d hcmus_physics`.

### Cách build & ship lên box (làm TAY, chưa dùng CD)
Box **không build được image tại chỗ** (storage driver `vfs` + đĩa nhỏ → build public cạn đĩa).
Luôn build ở máy local rồi chuyển image:
1. Backend local cho bước prerender sitemap của public build (cổng 3000–3003/17001 của Phương
   đang bận → chạy `PORT=3101 node dist/src/main.js` trong `backend/`, và build public với
   `--build-arg INTERNAL_API_URL=http://localhost:3101`).
2. `docker build --network=host` từng image với build-args:
   - admin: `NEXT_PUBLIC_API_URL=http://103.88.121.212:3001`, `NEXT_PUBLIC_IMAGE_FETCH_ORIGIN=http://backend:3001`, `NEXT_PUBLIC_SITE_URL=http://103.88.121.212:3002`, context `./frontend`.
   - public: 4 args trên + `INTERNAL_API_URL=http://localhost:3101`, context `.` (repo root), file `frontend-public/Dockerfile`.
   - backend: context `./backend` (Dockerfile đã cap heap 3GB cho nest build).
3. `docker save … | gzip -1 > x.tar.gz` → paramiko SFTP lên box → `gunzip -c | docker load` →
   `docker compose -f docker-compose.sandbox.yml up -d --no-deps --no-build --force-recreate <svc>` →
   `docker exec hcmus-cms-redis-1 redis-cli FLUSHALL`.
- Sau khi sửa **DỮ LIỆU** (layout, post) qua script: luôn FLUSHALL Redis + đôi khi force-recreate
  public (ISR cache).
- Verify bằng Playwright: `cd frontend && node -e "..."` (executablePath
  `~/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome`). Nếu chạy `node` ngoài `frontend/`
  bị "Cannot find module @playwright/test" → chạy trong `frontend/` hoặc set NODE_PATH.

### Script thao tác dữ liệu đã đặt trên box (một lần, KHÔNG thuộc deploy)
Ở `~/` trên box + `/tmp` trong container backend: `backfill-covers.js` (cover từ ảnh body),
`prune-dead-nav.js` (gỡ menu chết), `ship-hoc-bong-v2.js` (dựng layout học bổng), map lại
`/bo-mon/*`→slug thật, localize ảnh phys.hcmus.edu.vn→`/uploads/legacy-mirror/`. Chạy qua
`docker exec -e NODE_PATH=/app/node_modules hcmus-cms-backend-1 node /tmp/<script>.js`.

---

## 2. Ràng buộc/gotcha bắt buộc nhớ

- **Box không build được** → luôn build ngoài + ship image (xem §1). CD dùng GHCR (§6).
- **Font đã self-host** (`frontend*/public/fonts/` + `frontend/src/app/fonts.css`, đã bỏ
  `next/font/google`) — vì mạng tới Google hay đứt làm build fail. `proxy.ts` matcher phải
  loại trừ `/fonts`.
- **sitemap.ts** có timeout 8s cho fetch → build không treo khi không có backend (đây là
  enabler để build ở CI runner).
- **Image optimizer + host NAT:** container public không "hairpin" tới IP công khai của chính
  nó → SSR/optimizer fetch media qua `INTERNAL_API_URL=http://backend:3001` và
  `NEXT_PUBLIC_IMAGE_FETCH_ORIGIN=http://backend:3001`; `dangerouslyAllowLocalIP` bật khi có
  origin nội bộ. Next 16 mặc định `images.qualities=[75]` → phải khai `qualities:[65,70,75]`.
- **seccomp:** compose chạy `seccomp:unconfined` (libseccomp cũ của CentOS 7 chặn syscall của
  postgres16/node24). Đừng bỏ.
- **DB migration = `prisma db push`** (KHÔNG có migration files; convention của dự án). db push
  **có thể drop cột** nếu đổi schema phá vỡ → rà kỹ trước khi đổi schema/merge main.
- **Media URL trong DB = tương đối `/uploads/...`** → chỉ cần file có trên box + `NEXT_PUBLIC_API_URL`
  đúng. Không hardcode host trong DB (trừ ảnh seed phys.hcmus.edu.vn đã được localize).
- **Font size heading KLTN:** u1=16pt, u2=14pt, u3=13pt (script pin sẵn) — Phương không muốn chỉnh.

---

## 3. Tính năng đã làm gần đây (đều đã ship lên sandbox)

- **Sửa font toàn site** (trước đó rơi về Times New Roman): `shared.css` `--font-sans` trỏ
  `--font-geist-sans`, `font-sans` đặt ở `<body>`.
- **Chuông thông báo in-app** (thuần trình duyệt, KHÔNG email/đăng nhập/push trả phí):
  - Module chung `frontend/src/views/admin/widgets-layout/components/notif-subs.ts`:
    `NOTIF_TOPICS` (4 chuyên mục thật + "Học bổng"=keyword), `readSubs/writeSubs` localStorage
    `notif:subs`, phát event `notif:subs-changed` để đồng bộ trong tab.
  - `notification-bell.tsx`: chuông trên header (desktop lg+ và mobile bar), chip chủ đề đa chọn,
    badge số bài mới hơn mốc đăng ký, tự bung 1 lần/phiên (`notif:autoPopped`), panel
    `max-h-[70vh] overflow-y-auto` (scroll dọc), sticky header, "Đánh dấu đã đọc".
  - `scholarship.tsx` (widget `ScholarshipList`): lọc theo **keyword "học bổng"** (~83 bài; category
    hoc-bong/scholarship rỗng do di trú gán rải), **infinite scroll** (IntersectionObserver, không
    phân trang), **chuông góc trên phải** cạnh ô tìm kiếm → toast "Đã cài đặt nhận thông báo của
    "Học bổng"…". Cả hai chuông dùng chung `notif:subs` nên đồng bộ hai chiều.
  - Bài di trú trùng timestamp → khi theo dõi hiện thẳng top-3 mới nhất (để demo được ngay), mốc =
    ngày bài mới nhất; bài đăng SAU đó vẫn báo bình thường.
- **View live** trong builder đọc `NEXT_PUBLIC_SITE_URL` (đã thêm ARG/ENV vào frontend/Dockerfile +
  build-arg admin trong compose). Nút Back mũi tên trái tiêu đề composer.
- **Editor ảnh**: `markdown-editor.tsx` absolutize `/uploads` khi nạp / relativize khi lưu (DB
  giữ đường dẫn tương đối).
- **Locale giữ khi điều hướng**: `withLocale()` prefix mọi href menu + hero/content CTA.
- **Favicon** (huy hiệu Khoa) `frontend-public/src/app/icon.png` + title/og localize theo locale.
- **Search overlay** header: gọi `/posts/public/list?search=` (debounce), kết quả có locale.
- **Sidebar "Danh mục"** legacy lấy từ `/categories` (khớp dropdown).
- **Copy link** fallback `execCommand` (HTTP không secure), **FB share** mở tab sharer.
- **Bài body rỗng** ẩn khỏi list/search (`Prisma.DbNull`), vào thẳng thì hiện "Nội dung đang cập nhật".
- **Overflow bảng legacy**: `<main className="min-w-0 overflow-x-auto">` (legacy-page.tsx) → bảng
  chỉ tiêu tuyển sinh không đè sidebar.
- Trang **học bổng** live: content = Header, HeroFullScreen, ScholarshipList, Footer (đồng bộ
  header/footer trang chủ; bỏ SubscribeBanner email + TagNotificationBar faded).

---

## 4. VẤN ĐỀ ĐANG MỞ — tối ưu latency (CHƯA LÀM, ưu tiên tiếp theo)

Phương phản ánh: sau đăng nhập, mỗi trang admin load vài giây. Đã **chẩn đoán** (16/07):
- **`/page-layouts` (list admin) trả ~28,7 MB / ~111 giây** — thủ phạm chính. `page-layout.repo.ts`
  các hàm list (`findAll`, `findAllScoped`, `findOwnedOrPublished`, `findAllPublished`) gọi
  `findMany({ include:{_count} })` **KHÔNG có `select`** → trả cả `puckData` + `publishedPuckData`
  (cây JSON lớn) của ~1.600 bố cục.
- **`/posts` list** không projection → kèm cả `body`; tab "Bài của tôi" nạp `pageSize=100` = 2,2MB/15s.
- Phụ: ~1s RTT/request tới box NAT; các trang nạp client-side sau mount (React Query).
- **Cách sửa đề xuất** (Phương chưa duyệt thực thi): thêm Prisma `select` cho list (chỉ metadata:
  id/name/slug/isPublished/updatedAt/_count; posts bỏ `body`), chỉ lấy puckData/body ở endpoint chi
  tiết; giảm pageSize tab "Bài của tôi". Kỳ vọng 28MB→vài chục KB, 111s→<1s. Là thay đổi **backend**
  → cần build+ship lại (hoặc push main nếu CD đã bật).

---

## 5. KLTN (khóa luận) — trạng thái

- File Word Phương đang dùng: **`C:\Users\Hoai Phuong\Downloads\KLTN_TRANHOAIPHUONG.docx`**
  (bản mới nhất; nếu bị Word khóa lúc ghi thì fallback `_v2`). Nguồn markdown: `thesis/*.md`.
  Generator: `thesis/merge_kltn.py` (TPL = `thesis/KLTN_TRANHOAIPHUONG_patched.docx`).
- **Quy tắc VÁ DOCX:** Phương liên tục chỉnh tay trong docx → khi sửa thêm phải **patch trực tiếp
  file Downloads bằng zipfile/regex (giữ nguyên style)**, đồng thời mirror vào `thesis/*.md`. KHÔNG
  regen toàn bộ từ md (sẽ mất chỉnh tay). Xem [[kltn-style-rules]] trong memory.
- **Văn phong:** vô nhân xưng (không tôi/em/mình), không gạch đầu dòng trong thân, hạn chế mã,
  heading 16/14/13pt. Kết luận = CHƯƠNG 5 (5.1/5.2/5.3).
- **TLTK** (`thesis/06-tai-lieu-tham-khao.md`): **1 danh sách duy nhất** [1]–[17] theo thứ tự xuất
  hiện (KHÔNG chia nhóm), trích dẫn trong bài dạng `[n]` + tab, căn trái. Theo góp ý Cô (16/07):
  mỗi **doc phải có phiên bản** + **deep-link đúng mục** đã trích (không URL gốc); **trang web có
  tác giả + ngày truy cập**; **bài báo có tên hội nghị/tạp chí**. Đã kiểm author từng trang bằng
  WebFetch — [7] Web Vitals = **P. Walton** (không phải Google), [6]=D. An, [10]=Meta. Nếu Cô còn
  chỉ mục sai tác giả → WebFetch trang đó đối chiếu.
- Số liệu C4 (đã đo, đừng bịa): home Perf 87/LCP 3,74/CLS 0; bài viết di trú (đo lại 15/07, trung vị
  6 lượt) **68/LCP 4,21/TBT 215/CLS 0,270/0,9MB** (V6 cũ 58/6,05 là artifact do optimizer 400); bộ
  môn 87/3,86; giới thiệu 89/3,39; pnpm audit 51→4 (dev-only); test 40/40. Hình 3.9 (giao diện công
  khai) đã thay ảnh trang chủ mới có chuông. Xem [[kltn-measurement-status]].
- Phụ lục A (33 thực thể + 43 FK), B (4 screenshot), C (triển khai) — đã có trong docx.

---

## 6. CI/CD (đã dựng, CHƯA kích hoạt)

- CI cũ `.github/workflows/ci.yml`: lint/test/build 3 workspace khi push/PR main.
- **CD mới `.github/workflows/deploy.yml`** (push main + workflow_dispatch): build 3 image ở runner
  → push **ghcr.io/hoaiphuongtr/hcmus-physic-website/{backend,admin,public}** → SSH box
  `docker compose -f docker-compose.deploy.yml pull && up -d` + `prisma db push` + FLUSHALL + smoke
  test `/vi`. `docker-compose.deploy.yml` (đã đặt trên box) kéo ảnh GHCR, db-setup **chỉ db push,
  không re-seed** (tránh ghi đè nội dung live).
- **Chưa active** — cần Phương làm (xem `deploy/CD.md`): đặt GitHub Variables `PUBLIC_API_URL`,
  `PUBLIC_SITE_URL`; Secrets `SANDBOX_HOST/PORT/USER/SSH_KEY`, `GHCR_PULL_TOKEN`; tạo deploy SSH key
  + GHCR pull token; rồi merge lên main.

---

## 7. Email nháp cho thầy Tuấn (chưa gửi)
Phương nhờ soạn email xin nộp quyển trễ (Cô còn yêu cầu sửa) + nhờ liên hệ thư ký khoa sắp xếp demo
+ dùng thử web, đề xuất sáng mai. Bản nháp tiếng Việt đã đưa trong chat; chưa gửi tự động (email tới
thầy — chờ Phương gửi tay hoặc cung cấp địa chỉ để soạn nháp Gmail).

---

## 8. Artifact bắt buộc cập nhật cuối mỗi phiên
`progress.md` (nhật ký), `feature_list.json`, file này (`context.md`). Memory ở
`~/.claude/projects/-home-hoai-final-project/memory/` (MEMORY.md + các file: sandbox-demo-state,
kltn-*). `./init.sh` để verify môi trường local.
