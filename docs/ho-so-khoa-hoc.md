# Hồ sơ khoa học — kế hoạch

> Trạng thái: bản thiết kế, chưa cài đặt. Cập nhật 2026-08-21.
> Ứng dụng mới cho giảng viên khai công bố khoa học, chạy ở
> `profile.phys.hcmus.edu.vn`. Dữ liệu do web Khoa quản lý và trả ra qua API bảo mật;
> app là source riêng, stack tự chọn.

## 1. Vị trí trong hệ thống

**Toàn bộ dữ liệu do web Khoa quản lý.** Backend NestJS sẵn có là chủ sở hữu duy nhất
của bảng công bố, và trả ra ngoài qua API có bảo mật. App hồ sơ khoa học và ACADsoom
đều là **khách hàng** của API đó — không hệ nào giữ bản sao riêng.

```
                    ┌─────────────────────────────────────┐
                    │  Web Khoa — backend NestJS :3001    │
                    │  PostgreSQL + Prisma + Redis        │
                    │  CHỦ SỞ HỮU dữ liệu công bố         │
                    └──────┬───────────┬──────────┬───────┘
                           │           │          │
       trang nhân sự ◄─────┘           │          └─────► ACADsoom (MongoDB)
       (cùng CSDL, đọc thẳng)          │            GET /api/integration/publications
                                       │            x-acadsoom-secret
                                       ▼            → quy đổi giờ NV2 + KPI
                       profile.phys.hcmus.edu.vn
                          "Hồ sơ khoa học"
                       app riêng, source riêng, stack tự chọn
                       /api/scholar/*  (đăng nhập giảng viên)
```

Bốn điều rút ra từ sơ đồ này:

**App hồ sơ khoa học không có CSDL riêng.** Nó là giao diện thuần, mọi thao tác đều
đi qua API. Nhờ vậy nó tự do chọn stack, tự do build, tự do deploy — đổi hay viết lại
cũng không đụng gì tới dữ liệu.

**Trang nhân sự không cần đồng bộ gì cả.** Cùng một Postgres, nên khối công bố trên
trang nhân sự đọc thẳng từ bảng `Publication`. Chỉ cần revalidate tag khi dữ liệu đổi.

**App này KHÔNG quy đổi ra giờ.** Nó trả *sự thật*: bài gì, đăng ở đâu, thuộc mã nào
trong Phụ lục 2, ai là tác giả chính, bao nhiêu tác giả thuộc Trường. Việc nhân hệ số
ra giờ NCKH là quy định của Trường/Khoa và đã cài sẵn ở ACADsoom
(`src/lib/nv2Hours.js`).

Đây đúng nguyên tắc ACADsoom tự đặt ra cho PHYsoom, ghi trong `src/lib/physoom.js`:
hệ nguồn chỉ trả dữ kiện nó sở hữu, không tự quy đổi. Giữ nguyên nguyên tắc đó thì
sau này sửa định mức chỉ phải sửa một chỗ.

**ACADsoom vẫn giữ Bảng 2 và Bảng 3.** App này chỉ lo Bảng 1 — thứ có định danh thư
mục (bài báo, báo cáo hội nghị, sách, sở hữu trí tuệ). Đề tài, hội đồng, giải thưởng
không có DOI để tra, vẫn khai trực tiếp bên ACADsoom như hiện nay.

---

## 2. Phân loại Q1–Q4: tác giả tự chọn, không chọn thì không tính

**Quyết định đã chốt.** Hệ thống không tự đoán quartile, không nạp bảng xếp hạng
SCImago/WoS/CORE. Tác giả tự chọn mã Phụ lục 2 cho bài của mình.

Hệ quả cài đặt:

- `Publication.catalogCode` cho phép `null`. `null` = **chưa phân loại**.
- Bài chưa phân loại **không xuất hiện** trong response của API tích hợp → ACADsoom
  không thấy → không vào KPI. Luật "không chỉnh thì không được tính" được thực thi ở
  tầng dữ liệu chứ không phải nhắc nhở trên giao diện.
- Bài chưa phân loại **vẫn hiển thị** trên trang nhân sự nếu tác giả bật hiển thị —
  hiển thị và tính KPI là hai chuyện khác nhau.
  *(Giả định — nếu Khoa muốn ẩn luôn thì đổi một cờ, nói mình biết.)*
- Màn danh sách có bộ lọc **"Chưa phân loại (N)"** đặt nổi, kèm cảnh báo rõ: *"N bài
  chưa chọn danh mục — sẽ không được tính vào NV2 năm nay."*

Việc bỏ bảng xếp hạng làm nhẹ hẳn: không phải nạp CSV mỗi năm, không phải xử lý quy
tắc "lấy hạng cao hơn giữa hai bảng liền kề", không có rủi ro xếp sai rồi phải sửa
hàng loạt.

**Một trợ giúp không tốn gì:** khi đã có người khai tạp chí đó, hiện dòng gợi ý cạnh
ô chọn — *"3 bài trước ở tạp chí này được xếp Q2"*. Chỉ là gợi ý, **không điền sẵn**,
tác giả vẫn phải tự chọn. Điền sẵn là phá đúng cái luật vừa đặt ra.

---

## 3. Mô hình dữ liệu (Prisma — migration cộng thêm)

CSDL là bản phục hồi từ production, nên chỉ thêm bảng và cột, không đổi cái đang có.

### 3.1 `ScholarProfile` — lý lịch khoa học

```prisma
model ScholarProfile {
  id              String   @id @default(cuid())
  userId          String   @unique
  orcid           String?  @unique   // khoá chính để khớp tác giả
  scopusAuthorId  String?
  researcherId    String?            // WoS / Publons
  googleScholarId String?
  researchGateUrl String?            // chỉ để hiển thị, xem mục 4
  nameVariants    Json?              // ["Nguyen V. T. N.", "N.V.T. Ngan"]
  staffPageSlug   String?            // nối sang trang nhân sự đang có
  showOnWeb       Boolean  @default(true)
  lastSyncAt      DateTime?
  user            User     @relation(fields: [userId], references: [id])
}
```

### 3.2 `Publication` — một bài là một dòng

Điểm thiết kế quan trọng nhất: gom theo DOI. Bài có 3 đồng tác giả trong Khoa **vẫn
là một bài** — nếu mỗi người một dòng thì trang nhân sự hiện 3 bản và thống kê Khoa
đếm 3 lần.

```prisma
model Publication {
  id             String   @id @default(cuid())
  doi            String?  @unique
  arxivId        String?
  isbn           String?
  issn           String?
  type           String              // journal-article | proceedings | book-chapter | patent
  title          String
  containerTitle String?             // tên tạp chí / kỷ yếu
  year           Int?
  volume         String?
  issue          String?
  pages          String?
  publisher      String?
  url            String?
  authorsRaw     Json                // danh sách tác giả theo đúng thứ tự gốc
  source         String              // crossref | openalex | arxiv | orcid | manual
  raw            Json?               // JSON gốc, để tra lại khi nghi ngờ

  // ── Phân loại: TÁC GIẢ TỰ CHỌN, null = chưa phân loại ──────────────────
  catalogCode    String?             // mã Phụ lục 2, vd "1.1b"
  quartile       String?             // Q1 | Q2 | Q3 | Q4 | null
  classifiedBy   String?
  classifiedAt   DateTime?

  // ── Hệ số tính chất bài (thuộc về BÀI, không thuộc về người) ───────────
  satellite      Boolean  @default(false)  // ngoài main conference  → ×2/3
  reprint        Boolean  @default(false)  // tái bản / biên dịch    → ×1/3
  fromProject    Boolean  @default(false)  // sản phẩm của đề tài    → ×2/3
  stage          Int      @default(0)      // SHTT: 1 = đơn, 2 = văn bằng

  // ── Dữ kiện tác giả, dùng cho tỷ lệ giờ ────────────────────────────────
  totalAuthors       Int     @default(1)
  schoolAuthors      Int     @default(1)
  mainAuthorAtSchool Boolean @default(false)

  authors        PublicationAuthor[]
  @@index([year])
  @@index([catalogCode])
}
```

### 3.3 `PublicationAuthor` — mỗi giảng viên trong Khoa một dòng

```prisma
model PublicationAuthor {
  id              String  @id @default(cuid())
  publicationId   String
  userId          String
  authorIndex     Int              // vị trí trong authorsRaw
  isFirst         Boolean @default(false)
  isCorresponding Boolean @default(false)
  isLast          Boolean @default(false)
  sharePercent    Int?             // Cách 1: nhóm tự thoả thuận
  publication     Publication @relation(fields: [publicationId], references: [id], onDelete: Cascade)
  @@unique([publicationId, userId])
  @@index([userId])
}
```

### 3.4 Khoảng trống cần lấp: web Khoa **chưa có thực thể "nhân sự"**

Trang nhân sự hiện nay chỉ là `PageLayout` có slug
(`/vi/vat-ly-tin-hoc/nhan-su/ths-nguyen-vuong-thuy-ngan`), danh sách công bố nằm
trong `puckData` do script điền. Không có bảng nào nói "layout này là của người này".

`ScholarProfile.staffPageSlug` là chỗ nối tạm — đủ dùng và không phải cấu trúc lại
trang nhân sự. Nếu sau này Khoa muốn quản lý nhân sự tử tế thì tách `Staff` riêng,
nhưng đó là việc khác, không chặn app này.

---

## 4. Tra cứu tự động (kiểu Zotero)

Dán **một** ô: DOI, link DOI, arXiv ID, ISBN, hoặc URL bài báo.

| Nguồn | Endpoint | Chi phí | Dùng để |
|---|---|---|---|
| **Crossref** | `api.crossref.org/works/{doi}` | Miễn phí, không cần key (gửi kèm `mailto=` để được ưu tiên) | Nguồn chính: tên bài, tạp chí, năm, danh sách tác giả có `sequence: first`, ORCID từng tác giả |
| **OpenAlex** | `api.openalex.org/works/doi:{doi}` | Miễn phí, không cần key | Bổ sung ISSN chuẩn hoá và affiliation — Crossref hay thiếu affiliation |
| **arXiv** | `export.arxiv.org/api/query?id_list=` | Miễn phí | Preprint chưa có DOI |
| **OpenLibrary** | `openlibrary.org/isbn/{isbn}.json` | Miễn phí | Sách, chương sách |
| **ORCID public** | `pub.orcid.org/v3.0/{orcid}/works` | Miễn phí | **Nhập hàng loạt**: kéo toàn bộ công bố một lần |
| **Scopus** | `api.elsevier.com` | **Cần key trả phí** của Elsevier | Nếu Trường có license thì dùng; không thì cho tải CSV export từ Scopus rồi nạp |
| **ResearchGate** | — | **Không có API công khai**, điều khoản cấm cào | Chỉ lưu link để hiển thị. Không hứa đồng bộ tự động. |

Cần nói thẳng với giảng viên: **ResearchGate và Scopus không tự kéo được.** ORCID thì
kéo được, miễn phí, không cần key — mà cả Scopus lẫn WoS đều cho phép đẩy công bố sang
ORCID. Nên hướng mọi người khai ORCID là chính.

**Nhập hàng loạt từ ORCID:** khai ORCID → kéo danh sách works → lọc bỏ bài đã có theo
DOI → hiện bảng chọn → tick bài của năm nay → mỗi bài thành một `Publication` ở trạng
thái *chưa phân loại*, chờ tác giả chọn mã.

---

## 5. Đánh dấu tác giả

Sau khi tra xong, hiện danh sách tác giả theo đúng thứ tự gốc. Giảng viên:

1. Tick **"tôi là người này"** — tự khớp sẵn nếu ORCID trùng, hoặc tên khớp `nameVariants`.
2. Chọn vai trò: First / Corresponding / Last / đồng tác giả.
   Crossref có `sequence: "first"` nên đoán được First; **Corresponding thì không có**
   trong Crossref, bắt buộc tick tay.
3. Tick các đồng tác giả **thuộc Trường ĐH KHTN** — ra `schoolAuthors` và `mainAuthorAtSchool`.

Theo Phụ lục 2 (tr. 2.5): có tác giả chính thuộc Trường → hưởng **100%** định mức;
không có → `định mức × số tác giả thuộc Trường / tổng số tác giả`. Người đứng ra khai
giờ cho nhóm **phải** là First / Corresponding / Last Author — chặn ngay ở tầng nhập
liệu, đừng để người duyệt mới phát hiện.

App này chỉ *ghi nhận* mấy con số đó. Nhân ra giờ là việc của ACADsoom.

---

## 6. API

Backend web Khoa mở **hai nhóm endpoint tách biệt**, hai cơ chế bảo mật khác nhau.

### 6.1 `/api/scholar/*` — cho app hồ sơ khoa học (đăng nhập bằng tài khoản giảng viên)

```
GET    /api/scholar/me                     hồ sơ + ORCID/Scopus/RG
PATCH  /api/scholar/me
POST   /api/scholar/resolve                { input: "10.1103/PhysRevB..." } → metadata
GET    /api/scholar/publications           danh sách của tôi, lọc theo năm / chưa phân loại
POST   /api/scholar/publications           tạo từ kết quả resolve
PATCH  /api/scholar/publications/:id       chọn mã Phụ lục 2, đánh dấu tác giả
DELETE /api/scholar/publications/:id
POST   /api/scholar/orcid/import           kéo hàng loạt từ ORCID
GET    /api/scholar/stats                  thống kê (quản lý mới thấy toàn Khoa)
```

**Resolver chạy ở server, không chạy ở trình duyệt.** Ba lý do: gọi Crossref từ server
mới gửi kèm được một `mailto` thống nhất để được ưu tiên; kết quả cache thẳng vào Redis
sẵn có nên cùng một DOI chỉ gọi ra ngoài một lần; và trình duyệt gọi thẳng sẽ vướng
CORS lẫn giới hạn tần suất theo IP người dùng.

Phân quyền: giảng viên chỉ đọc/sửa được công bố mà họ là tác giả. Thống kê toàn Khoa
chỉ mở cho vai trò quản lý.

### 6.2 `/api/integration/*` — cho ACADsoom (khoá bí mật)

```
GET /api/integration/publications?email=...&from=...&to=...
     header: x-acadsoom-secret

→ { items: [ {
      doi, title, venue, year, url,
      catalogCode, quartile,                       // luôn khác null
      satellite, reprint, fromProject, stage,
      totalAuthors, schoolAuthors, mainAuthorAtSchool,
      isMainAuthor, sharePercent
    } ] }
```

- **Chỉ trả bài đã phân loại** (`catalogCode != null`). Bài chưa phân loại không tồn
  tại đối với ACADsoom.
- **Không trả giờ.** Các trường trên khớp đúng tham số đầu vào của
  `computeResearchHours` bên ACADsoom.
- Phía ACADsoom viết một adapter `src/lib/profile.js` sao y `physoom.js`: gọi endpoint,
  hỏng thì trả rỗng, không làm sập màn khai báo.

Mẫu khoá bí mật + gọi fail-soft đã có sẵn ở
[public-revalidate.service.ts](backend/src/shared/services/public-revalidate.service.ts) —
làm theo đúng kiểu đó.

---

## 7. Hiển thị trên trang nhân sự

Cùng CSDL nên **không có bước đồng bộ nào**. Thêm holder Puck `StaffPublications`,
đúng khuôn mẫu `PostGallery` / `PostVideo` đã có:

- Dữ liệu được **bơm** lúc dựng trang, y hệt cách `injectPostIntoPuckData` bơm nội dung bài.
- Trống thì ẩn hẳn ngoài trang công khai, hiện khung gạch đứt khi đang dựng layout.
- Giảng viên chưa nối hồ sơ → rơi về danh sách gõ tay trong `puckData` như hiện nay.
  Không có bước chuyển đổi gãy.
- Khi công bố đổi: **xoá Redis trước, rồi mới revalidate Next** — đúng thứ tự đã chốt;
  làm ngược lại thì trang vẫn cũ.

---

## 8. Chỗ đặt mã nguồn

**Backend — trong monorepo web Khoa.** Module `scholar` trong NestJS sẵn có
(`backend/src/scholar/`), dùng chung Prisma, guard, Redis. Không dựng backend riêng:
dữ liệu do web Khoa quản lý thì logic ghi dữ liệu cũng phải ở đó.

**App hồ sơ khoa học — source riêng, hoàn toàn tự do.** Repo riêng, stack tự chọn,
vòng đời phát hành riêng. Nó chỉ cần biết hai thứ: URL của API và cách đăng nhập.

Đây là cái lợi lớn nhất của việc để web Khoa giữ dữ liệu: app không phải nằm trong
pnpm workspace, nên **không phải mirror `lib/api` + `lib/i18n`** — đúng cái bẫy đã vấp
khi làm `frontend-public`. Viết lại app hay đổi framework cũng không đụng tới một dòng
dữ liệu nào.

Vẫn còn một cái giá: nếu deploy lên cùng box thì thêm một image Docker phải build,
mà ổ đĩa ở đó vốn đã chật.

### 8.1 Đăng nhập

Hai app cùng nằm dưới `phys.hcmus.edu.vn`, nên **cookie phiên đặt scope
`.phys.hcmus.edu.vn`** là gọn nhất — đăng nhập một lần dùng cho cả hai, không phải
dựng SSO riêng. Nếu sau này app chuyển sang tên miền khác thì đổi sang token do web
Khoa cấp; API không phải sửa.

Cần bổ sung: `Role` hiện chỉ có `SUPER_ADMIN` và `ADMIN` — phải thêm **`LECTURER`**.
Thêm giá trị vào enum là migration cộng thêm, an toàn với CSDL phục hồi từ production.

**Rủi ro phải kiểm tra khi làm:** rà lại các guard đang so `role === 'ADMIN'` hoặc chỉ
kiểm tra "đã đăng nhập". Một tài khoản `LECTURER` **không được** lọt vào admin console.
Đây là chỗ dễ hở nhất của cả thiết kế này — làm xong phải thử đăng nhập bằng tài khoản
giảng viên rồi gõ tay URL `/admin` để chắc chắn bị chặn.

---

## 9. Tên miền phụ

`profile.phys.hcmus.edu.vn` khả thi. Cần:

1. **IT tạo bản ghi DNS A** trỏ về `103.88.121.212` — chỉ IT làm được.
2. Thêm khối vào Caddyfile:

```
profile.phys.hcmus.edu.vn {
  handle_path /be/* { reverse_proxy backend:3001 }
  handle       { reverse_proxy profile:3003 }
}
```

`profile:3003` là tên container và cổng của app — đổi theo stack app chọn. Khối
`/be/*` cho app gọi API cùng gốc (same-origin), nên cookie phiên gửi kèm được mà
không phải mở CORS.

3. **Tuyệt đối không tạo lại volume `caddy_data`** — chứng chỉ Let's Encrypt nằm trong
   đó; xoá đi là bị rate-limit và cả site mất HTTPS.

Caddy tự xin chứng chỉ cho tên miền mới ngay khi DNS đã trỏ đúng.

---

## 10. Thứ tự làm

**Backend web Khoa** — làm trước, vì app không có gì để gọi nếu chưa có API:

| # | Việc | Trạng thái |
|---|---|---|
| 1 | Migration: `ScholarProfile`, `ScholarNameVariant`, `Publication`, `PublicationAuthor`, role `LECTURER` | ✅ viết xong, **chưa chạy trên box** |
| 2 | Module `scholar`: CRUD hồ sơ + công bố, phân quyền theo tác giả | ✅ |
| 3 | `POST /scholar/resolve` — Crossref + OpenAlex + DataCite + arXiv + OpenLibrary, cache Redis | ✅ |
| 3b | `POST /scholar/import/file` — đọc .bib / .ris / CSL-JSON | ✅ |
| 4 | `POST /scholar/import/orcid` — kéo hàng loạt | ✅ |
| 5 | `GET /integration/publications` + khoá bí mật | ✅ |
| 6 | `GET /scholar/stats/me` và `/stats/faculty` | ✅ |
| 7 | Holder Puck `StaffPublications` trên trang nhân sự | ⬜ |
| 8 | Rà guard: `LECTURER` không lọt vào admin console | ✅ đã vá + 12 test |

### Biến môi trường cần đặt trước khi bật

| Biến | Bắt buộc | Dùng để |
|---|---|---|
| `ACADSOOM_SYNC_SECRET` | có, nếu bật kênh tích hợp | Khoá chung với ACADsoom. **Chưa đặt thì `/integration/*` từ chối phục vụ** chứ không mở toang. |
| `CROSSREF_MAILTO` | nên có | Email liên hệ gửi kèm khi gọi Crossref để vào hàng đợi ưu tiên ("polite pool"). |

**App hồ sơ khoa học** (repo riêng) — chạy song song được từ sau bước 2:

| # | Việc | Phụ thuộc |
|---|---|---|
| A | Đăng nhập + màn khai ORCID/Scopus/ResearchGate | BE 2 |
| B | Màn "dán DOI" → xem trước metadata → lưu | BE 3 |
| C | Màn chọn mã Phụ lục 2 + đánh dấu tác giả; bộ lọc **"Chưa phân loại (N)"** | BE 2 |
| D | Nhập hàng loạt từ ORCID | BE 4 |
| E | Màn thống kê | BE 6 |

**ACADsoom** — chỉ một việc, làm sau cùng:

| # | Việc | Phụ thuộc |
|---|---|---|
| I | Adapter `src/lib/profile.js` sao y `physoom.js`, nối vào `computeResearchHours` | BE 5 |

Xong BE 1–3 + A–C là đã dùng thật được: khai nhanh hơn gõ tay, số liệu đủ sạch để
thống kê. Bước I là lúc ACADsoom thôi phải nhập tay công bố.
