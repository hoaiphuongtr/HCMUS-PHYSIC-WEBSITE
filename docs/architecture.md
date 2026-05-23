# Kiến trúc hệ thống — Khoa Vật Lý CMS

Tài liệu này gồm 3 sơ đồ:

1. **Topology tổng thể** — ai gọi ai (admin/public/backend/store).
2. **Bên trong NestJS** — các module backend và quan hệ phụ thuộc.
3. **Luồng tạo & xuất bản bài đăng** — pipeline từ form admin → public site.

Mỗi sơ đồ viết bằng cú pháp **Mermaid**, render được trực tiếp trên GitHub / Notion / VS Code (extension "Markdown Preview Mermaid"). Nếu cần export PNG để dán vào Canva, vào `https://mermaid.live` → dán block → tải SVG/PNG.

---

## 1. Topology tổng thể

```mermaid
flowchart TB
    Admin["Admin Console<br/>Next.js · :3000"]
    Public["Public Site<br/>Next.js · :3002"]
    API["NestJS API<br/>:3001"]
    PG[("PostgreSQL")]
    Redis[("Redis<br/>cache")]
    MediaStore[("Media Storage")]

    Admin --> API
    Public --> API
    API --> PG
    API --> Redis
    API --> MediaStore

    classDef app fill:#dbeafe,stroke:#1e40af,stroke-width:2px,color:#1e3a8a
    classDef server fill:#dcfce7,stroke:#15803d,stroke-width:2px,color:#14532d
    classDef store fill:#fef3c7,stroke:#b45309,stroke-width:2px,color:#78350f
    class Admin,Public app
    class API server
    class PG,Redis,MediaStore store
```

**Cách đọc:**
- 2 ứng dụng Next.js (admin + public) đều gọi chung **một backend** NestJS.
- Backend là **stateless** — mọi trạng thái lưu ở PostgreSQL hoặc Redis.
- Redis chỉ là **read cache**. Khi có write, NestJS service tự clear cache.
- Cron chạy mỗi phút bên trong process NestJS, không phải service riêng.

---

## 2. Bên trong NestJS — các module và quan hệ

```mermaid
flowchart LR
    subgraph Shared["🧩 SharedModule"]
        Prisma[PrismaService]
        Cache[CacheManager<br/>+ KeyvRedis]
        Auth[AuthGuard<br/>RolesGuard]
        Filter[HTTP Exception Filter]
        Helpers[helpers.ts<br/>toSlug, ...]
    end

    subgraph Domain["🏛 Domain modules"]
        UserMod[User / Auth]
        PageLayout[PageLayout<br/>· CRUD · publish<br/>· schedule · clone]
        PostMod[Post<br/>· CRUD · clone-into-layout<br/>· cron publish]
        Widget[Widget<br/>· registry]
        Media[Media<br/>· upload · tag]
        Subscription[Subscription<br/>· tag-based notify]
        Visitor[Visitor<br/>· analytics]
        Department[Department<br/>· optional]
    end

    UserMod --> Auth
    UserMod --> Prisma

    PageLayout --> Prisma
    PageLayout --> Cache
    PageLayout --> Auth
    PageLayout --> Helpers

    PostMod --> Prisma
    PostMod --> Cache
    PostMod --> Auth
    PostMod --> Helpers
    PostMod -. clones .-> PageLayout

    Widget --> Prisma
    Widget --> Auth

    Media --> Prisma
    Media --> Auth

    Subscription --> Prisma
    Subscription --> Auth

    Visitor --> Prisma

    classDef shared fill:#fce7f3,stroke:#db2777,color:#831843
    classDef mod fill:#e0e7ff,stroke:#6366f1,color:#312e81
    class Prisma,Cache,Auth,Filter,Helpers shared
    class UserMod,PageLayout,PostMod,Widget,Media,Subscription,Visitor,Department mod
```

**Cách đọc:**
- `SharedModule` cung cấp Prisma, cache, guards, helpers — mọi module domain đều import.
- Module Domain **không gọi nhau qua HTTP**, chỉ inject service trực tiếp (NestJS DI).
- Mũi tên đứt nét `PostMod -.-> PageLayout` thể hiện quan hệ "Post **clone** template layout của PageLayout khi tạo bản nháp" — không phải dependency cứng.

---

## 3. Luồng tạo bài đăng (post → layout → public URL)

```mermaid
sequenceDiagram
    autonumber
    actor Admin as "Thầy/Cô"
    participant UI as "Admin UI"
    participant API as "NestJS API"
    participant DB as "PostgreSQL"

    Admin->>UI: Soạn post + chọn template
    UI->>API: POST /posts/:id/clone-into-layout
    API->>DB: SELECT template PageLayout
    API->>API: Inject post vào puckData<br/>(PostHeader, PostBody, ...)
    API->>DB: INSERT PageLayout draft
    Admin->>UI: Publish
    UI->>API: POST /page-layouts/:id/publish
    API->>DB: publishedPuckData ← puckData
```

**Cách đọc:**
- Bài đăng là **dữ liệu có cấu trúc** (title, body, tag, ảnh), không phải HTML public trực tiếp.
- Backend **walk cây puckData** của template, thay placeholder (`PostHeader`, `PostBody`, ...) bằng giá trị thật → tạo layout draft mới.
- Khi publish, backend snapshot `puckData` → `publishedPuckData`. Public site đọc snapshot này.
- Sửa post sau đó → `syncAttachedLayouts()` re-inject cho mọi layout có `sourcePostId` trùng.

---

## Phụ lục — Sơ đồ dữ liệu chính (entity simplified)

```mermaid
erDiagram
    User ||--o{ PageLayout : "createdBy"
    User ||--o{ Post : "createdBy"
    PageLayout ||--o{ WidgetInstance : has
    Widget ||--o{ WidgetInstance : "is instance of"
    Post ||--o{ PostTag : has
    Tag ||--o{ PostTag : "tagged in"
    Media ||--o{ MediaTag : has
    Tag ||--o{ MediaTag : "tagged in"
    Post |o--o{ PageLayout : "sourcePostId (1 post → N layouts)"
    Post {
        string id PK
        string title
        string slug UK
        string body
        enum status "DRAFT|PENDING|SCHEDULED|PUBLISHED|REJECTED"
        json eventStartAt
        datetime publishedAt
    }
    PageLayout {
        string id PK
        string name
        string slug
        json puckData
        json publishedPuckData
        bool isPublished
        datetime scheduledAt
        string sourcePostId FK
    }
```

---

## Export cho slide / Canva

1. Mở `https://mermaid.live`
2. Copy block Mermaid vào panel trái
3. **Actions → PNG** (hoặc SVG để giữ chất lượng vector)
4. Tải file rồi upload lên Canva

Hoặc cài VS Code extension **"Markdown Preview Mermaid Support"** để preview ngay trong file này.
