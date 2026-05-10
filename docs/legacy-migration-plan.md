# Legacy Data Migration Plan — PHP CMS (`phys_db`) → NestJS Prisma

**Created**: 2026-05-10
**Status**: planning — schema not yet upgraded

This file is the single source of truth for migrating the existing
PHP/MariaDB Khoa Vật lý site to the new NestJS+Prisma+PostgreSQL stack.
**Goal**: preserve 100% of legacy data while continuing to add new content
to the new schema after migration completes.

---

## Source database overview

- Engine: MariaDB 10.6, charset `utf8mb3`
- Domain manage URL: `http://demo.phys.honeynet.vn:2222` (DirectAdmin panel,
  HTTP not HTTPS)
  - panel user/pass: `phys` / `demo.phys@2019`
- DB name: `phys_db`
- DB user/pass: `phys_root` / `OA7X8WyO4` (bind localhost on the panel server)
- 46 tables. Pattern: every entity is split into `<entity>` (data + meta)
  and `<entity>lang` (translations keyed by `langid`).
- 2 languages: `vi` and `en`.
- Soft delete: every table has `deleted INT DEFAULT 0`. Migration MUST filter
  `WHERE deleted = 0`.
- Multi-tenant: most tables carry `deptid` (department FK). Each bộ môn has
  its own content scope.

### Row counts (from local SQL dump on 2026-05-10)

| Table | Rows | Plan |
|---|---|---|
| posts + postslang | 1651 + 3302 | ✅ Migrate (high priority) |
| pages + pageslang | 273 + 538 | ✅ Migrate (high priority) |
| subjects + subjectslang | 415 + 830 | ✅ Migrate |
| menus + menuslang | 383 + 766 | ⚠ Skip — rebuild via Puck Navbar |
| staffs + staffslang | 126 + 252 | ✅ Migrate |
| slideshows + slideshowslang | 88 + 166 | ✅ Migrate |
| categories + categorieslang | 49 + 98 | ✅ Migrate (as Tag) |
| partners + partnerslang | 43 + 86 | ✅ Migrate |
| classes + classeslang | 41 + 82 | ✅ Migrate |
| researches + researcheslang | 15 + 30 | ✅ Migrate |
| depts + deptslang | 10 + 20 | ✅ Migrate (upgrade existing Department) |
| majors + majorslang | 8 + 16 | ✅ Migrate |
| links + linkslang | 19 + 36 | ✅ Migrate (QuickLink) |
| socials | 8 | ✅ Migrate (SocialAccount) |
| users (11) | 11 | ❌ Skip — bcrypt format incompatible, super_admin re-creates |
| role + permission* (4 tables) | small | ❌ Skip — new auth uses 2-role enum |
| slogs (18699) | 18699 | ❌ Skip — access log, not content |
| online | 10 | ❌ Skip — runtime tracker |
| notification | 0 | ❌ Skip — empty, new model exists |
| attributes | 8 | ❌ Skip — top-level menu groups, hardcoded UI |
| conection | 8 | ⚠ Maybe — stat counters (số SV/GV); review |
| filtersetting, fieldgroup, calendars | small | ⚠ Maybe — class schedule TKB; review |
| homes + homeslang | 10 + 20 | ❌ Skip — homepage settings now in Puck puckData |
| menuslocation | 20 | ❌ Skip — derived from Puck Navbar |
| language | 2 | ❌ Skip — hardcoded `LOCALES = [vi, en]` |

---

## Schema diff & required changes

### Tables that already have a Prisma counterpart

| PHP | Prisma (current) | Action |
|---|---|---|
| posts + postslang | `Post` | Add `legacyId`, `departmentId` FK |
| pages + pageslang | `PageLayout` (puckData) | HTML body wrapped in TextBlock + `legacyId` |
| categories + categorieslang | `Tag` | **Upgrade** `name String` → `name Json` (LocalizedString); add `legacyId` |
| depts + deptslang | `Department` | **Upgrade** with many missing fields (see below) |
| language | LOCALES const | Skip (already done) |

### Department upgrade (Prisma)

Current `Department` is minimal. Add legacy fields:

```prisma
model Department {
  id          String   @id @default(cuid())
  legacyId    Int?     @unique           // depts.id
  dcode       String   @unique           // depts.dcode (vd VLTH)
  slug        String   @unique
  fpath       String?                    // file path / hierarchy
  image       String?
  icon        String?
  logo        String?
  phone       String?
  email       String?
  parentId    String?                    // self-FK; depts.parentid
  status      ContentStatus @default(PUBLISHED)
  links       String?
  // localized fields (collapsed from deptslang)
  title       Json                        // {vi, en}
  excerpt     Json?                       // deptslang.except
  address     Json?
  logoText    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  parent      Department?  @relation("DepartmentHierarchy", fields: [parentId], references: [id])
  children    Department[] @relation("DepartmentHierarchy")
  // existing relations
}
```

### Post upgrade (Prisma)

```prisma
model Post {
  // ... all existing fields
  legacyId      Int?    @unique           // posts.id
  departmentId  String?                   // posts.deptid
  department    Department? @relation(fields: [departmentId], references: [id], onDelete: SetNull)
}
```

### Tag upgrade (Prisma)

```prisma
model Tag {
  id          String   @id @default(cuid())
  legacyId    Int?     @unique           // categories.id
  slug        String   @unique
  name        Json                        // {vi, en} from categorieslang
  excerpt     Json?
  image       String?
  status      ContentStatus @default(PUBLISHED)
  departmentId String?
  department  Department? @relation(fields: [departmentId], references: [id])
  // ... existing relations
}
```

### New models to add (10 models)

```prisma
model Staff {
  id           String   @id @default(cuid())
  legacyId     Int?     @unique
  slug         String   @unique
  image        String?
  email        String?
  phone        String?
  regency      Int      @default(0)        // 1 = lãnh đạo Khoa, 2 = lãnh đạo bộ môn
  deptPosition Int      @default(0)
  sort         Int      @default(0)
  dsort        Int      @default(0)
  status       ContentStatus @default(PUBLISHED)
  departmentId String?
  title        Json                          // {vi, en}
  content      Json?                         // {vi, en} bio HTML
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  department   Department? @relation(fields: [departmentId], references: [id])
}

model Subject {
  id           String   @id @default(cuid())
  legacyId     Int?     @unique
  slug         String   @unique
  code         String?
  image        String?
  bgImage      String?
  status       ContentStatus @default(PUBLISHED)
  departmentId String?
  title        Json
  content      Json?
  excerpt      Json?
  createdAt    DateTime @default(now())
  updatedAt   DateTime @updatedAt
  department   Department? @relation(fields: [departmentId], references: [id])
}

model Major {
  id           String   @id @default(cuid())
  legacyId     Int?     @unique
  slug         String   @unique
  status       ContentStatus @default(PUBLISHED)
  departmentId String?
  image        String?
  bgImage      String?
  title        Json
  content      Json?
  stdout       Json?
  curriculum   Json?
  prospects    Json?
  fee          Json?
  researchInfo Json?
  studentInfo  Json?
  alumni       Json?
  rpartners    Json?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  department   Department? @relation(fields: [departmentId], references: [id])
}

model Class {
  id           String   @id @default(cuid())
  legacyId     Int?     @unique
  slug         String   @unique
  code         String?
  status       ContentStatus @default(PUBLISHED)
  departmentId String?
  image        String?
  bgImage      String?
  title        Json
  content      Json?
  excerpt      Json?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  department   Department? @relation(fields: [departmentId], references: [id])
}

model Research {
  id           String   @id @default(cuid())
  legacyId     Int?     @unique
  slug         String   @unique
  status       ContentStatus @default(PUBLISHED)
  departmentId String?
  image        String?
  bgImage      String?
  title        Json
  content      Json?
  excerpt      Json?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  department   Department? @relation(fields: [departmentId], references: [id])
}

model Partner {
  id           String   @id @default(cuid())
  legacyId     Int?     @unique
  link         String
  image        String?
  sort         Int      @default(0)
  status       ContentStatus @default(PUBLISHED)
  departmentId String?
  title        Json
  excerpt      Json?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Slideshow {
  id           String   @id @default(cuid())
  legacyId     Int?     @unique
  image        String
  link         String?
  sort         Int      @default(0)
  status       ContentStatus @default(PUBLISHED)
  departmentId String?
  title        Json?
  excerpt      Json?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model QuickLink {
  id           String   @id @default(cuid())
  legacyId     Int?     @unique
  icon         String?
  link         String
  sort         Int      @default(0)
  status       ContentStatus @default(PUBLISHED)
  departmentId String?
  title        Json
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model SocialAccount {
  id           String   @id @default(cuid())
  legacyId     Int?     @unique
  icon         String
  link         String
  name         String
  sort         Int      @default(0)
  status       ContentStatus @default(PUBLISHED)
  departmentId String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

// Optional — only if `calendars` table is needed (TKB)
model ClassSchedule {
  id           String   @id @default(cuid())
  legacyId     Int?     @unique
  status       ContentStatus @default(PUBLISHED)
  departmentId String?
  classId      String?
  subjectId    String?
  startDate    DateTime
  startTime    String                          // "HH:MM"
  endTime      String
  day          String
  year         Int
  semester     Int
  location     Int                             // building id
  room         String
  excerpt      Json?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

---

## Critical compatibility issues

### 1. HTML content from TinyMCE
PHP `posts.content` and `pageslang.content` are HTML blobs from TinyMCE editor
(inline styles, classes, sometimes scripts). Strategy:
- Migrate **as-is** to `Post.body` / `PageLayout` puckData TextBlock content.
- Sanitize: strip `<script>`, `<iframe>` (unless YouTube), `on*` event attrs.
- Render via existing `dangerouslySetInnerHTML` in MarkdownEditor / TextBlock.
- Do NOT convert to Puck nodes — too lossy, manual cleanup is huge.

### 2. Image paths
PHP `posts.image` etc. are server-relative paths (e.g.
`/uploads/khoa-vat-ly/.../foo.jpg`). Migration must:
- For each non-null image field: download from
  `https://phys.hcmus.edu.vn<path>` → save to `backend/uploads/<uuid>.<ext>`
- Insert Media row with `IMAGE` type, original alt text.
- Set `<entity>.coverMediaId` (or equivalent) + `coverUrl: /uploads/<uuid>.<ext>`.
- Keep download manifest (legacyPath → newId) to avoid duplicate downloads
  when the same image is referenced multiple times.

### 3. Status mapping
PHP `status INT(1)` → Prisma `ContentStatus` enum:
- `1` → `PUBLISHED`
- `0` → `DRAFT`
- `2` → `DRAFT` (rare, treat as draft)
- Filter `deleted = 1` rows out — never migrate.

### 4. Translations collapse
PHP `<entity>lang` is a separate row per `langid`. Migration:
- Group rows by parent entity id.
- `langid = 1` typically maps to `vi`, `langid = 2` to `en`.
  **Verify** by reading `language` table row at start of migration script.
- Build JSON `{ vi: row1.title, en: row2.title }` for every text field.
- Empty/null EN translation → `{ vi: "...", en: "" }`.

### 5. Auth — completely skip
- PHP `users.password` is bcrypt `$2y$08$...` (PHP convention).
- New code uses Node bcrypt `$2b$10$...` — formats incompatible, cannot
  re-verify old hashes.
- Decision: **do not migrate `users`**. Super_admin manually re-creates admin
  accounts via the new admin UI after launch.

### 6. Permission — skip
Old PHP CMS had RBAC (role + permission + permissiongroups + permissionrole +
permissionlist). New stack uses 2-role enum (ADMIN, SUPER_ADMIN) + NestJS
`@Roles()` decorator. Skip all 4 permission tables.

### 7. Legacy ID preservation
Every migrated record gets a `legacyId Int @unique` column referencing the
PHP id. This enables:
- Idempotent re-runs (`upsert by legacyId`).
- Future legacy URL redirects (`/post/123` → new slug-based URL).
- Cross-reference debugging when verifying migrated data.

---

## Migration phases

### Phase 1 — Schema upgrade (~2 h)
1. Edit `backend/prisma/schema.prisma`:
   - Upgrade `Department` (add ~10 fields).
   - Upgrade `Post` (add `legacyId`, `departmentId`).
   - Upgrade `Tag` (`name String` → `name Json`).
   - Add 10 new models above.
2. `pnpm --filter backend exec prisma migrate dev --name preserve_legacy_data`.
3. Backfill existing data: any current Tag rows get `name: { vi: oldName }`.

### Phase 2 — Migration script (~6 h)
File: `backend/scripts/migrate-legacy.ts` (TypeScript, run with `tsx`).

Inputs:
- env: `LEGACY_DB_URL=mysql://phys_root:OA7X8WyO4@<tunnel-host>:3306/phys_db`
  (after enabling Remote MySQL access in DirectAdmin and SSH-tunnelling, OR
  copy SQL dump locally and run mysql server in Docker)

Steps:
1. Connect MariaDB via `mysql2/promise`.
2. Read `language` table → build langid → locale code map.
3. For each entity, read parent table in batches of 200 + JOIN-load lang rows.
4. For text fields, build `{vi, en}` JSON.
5. For image fields, dispatch download queue (parallelism 4).
6. Sanitize HTML body (DOMPurify or `sanitize-html`).
7. Status int → enum.
8. Filter `deleted = 0`.
9. `prisma.<model>.upsert({ where: { legacyId }, ... })`.
10. Log progress every 50 rows; on failure log + continue (don't abort batch).

Order of migration (FK-safe):
1. `Department` (upgrade existing, fill new fields)
2. `Tag` (from categories)
3. `Slideshow`, `Partner`, `QuickLink`, `SocialAccount` (no FK dependencies)
4. `Subject`, `Class`, `Major`, `Research`
5. `Staff`
6. `Post` (FK → Department, Tag)
7. `PageLayout` from `pages` (FK → Department)
8. `ClassSchedule` (FK → Class, Subject)

### Phase 3 — Verification (~2 h)
1. Row count diff: write SQL queries on both DBs, assert counts match
   (modulo soft-deleted rows).
2. Random sample 20 posts: open in admin UI, verify HTML renders cleanly,
   images load, slug works, status correct.
3. Spot-check Department hierarchy: parentId chain reproduces correctly.
4. Spot-check translations: open in EN locale tab, verify EN content present
   when source had a langid=2 row.

### Phase 4 — Frontend refactor (~3 h)
- `PartnerShowcase` Puck component: switch from hardcoded `partners` prop
  array to fetch from new public endpoint `GET /partners/public/list`.
  Snapshot pattern same as `LatestNewsAuto` / `UpcomingEventsAuto`.
- `HeroFullScreen.slides`: optionally switch to fetch from Slideshow table.
- Add new Puck components:
  - `StaffList` — render Staff filtered by department.
  - `SubjectList`, `MajorList` — for đào tạo pages.
  - `ResearchList` — for trang nghiên cứu.
- New PageLayouts seeded automatically: `/<dept-slug>/mon-hoc`,
  `/<dept-slug>/giang-vien`, etc.

---

## Connecting to the legacy DB locally

The DB is bound to `localhost` on the panel server, so you cannot connect
directly. Three options:

### Option A — DirectAdmin Remote SQL Access (recommended for one-off migration)
1. Login DirectAdmin: `http://demo.phys.honeynet.vn:2222`
2. Navigate to MySQL Management → `phys_db` → "Remote SQL Access"
3. Add your public IP (`curl ifconfig.me`) to the allowlist
4. Verify port 3306 is reachable: `nc -zv demo.phys.honeynet.vn 3306`
5. Connect from migration script with
   `mysql://phys_root:OA7X8WyO4@demo.phys.honeynet.vn:3306/phys_db`

### Option B — Restore the SQL dump locally
1. Run a local MariaDB in Docker:
   ```sh
   docker run -d --name legacy-mariadb -e MARIADB_ROOT_PASSWORD=root \
     -p 3307:3306 mariadb:10.6
   ```
2. Import dump:
   ```sh
   docker exec -i legacy-mariadb mariadb -uroot -proot \
     -e "CREATE DATABASE phys_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   docker exec -i legacy-mariadb mariadb -uroot -proot phys_db < phys_db_dump.sql
   ```
3. Migration script connects to `mysql://root:root@localhost:3307/phys_db`.
4. Pros: faster, no cô-side firewall games. Cons: dump is a snapshot — any
   new rows added on the live PHP site after the dump are lost.

### Option C — SSH tunnel (only if SSH actually works)
The panel exposes only HTTP on 2222, no SSH. Skip.

**Decision**: Option B for development (already have the dump). Option A for
the final cutover when migrating against live data.

---

## Open questions to resolve before coding

1. **Schema upgrade approval**: ~10 new models + 3 model upgrades is a big
   schema diff. Confirm OK before running `prisma migrate dev`.
2. **Department fields used?** Specifically `dcode`, `fpath`, `logo`, `icon`,
   `phone`, `email`, `parentId` — if any are unused on the new site, drop
   them from the upgrade.
3. **Multi-tenant scoping**: do admins at different departments need access
   isolation (Post created by VLTH only editable by VLTH admins)? Or flat
   permissions (any ADMIN can edit anything)?
4. **Permission tables**: confirm skip — only ADMIN/SUPER_ADMIN.
5. **HTML body**: confirm migrate as-is, render via dangerouslySetInnerHTML.
6. **Image strategy**: confirm download → re-host locally (Option A from
   "Image paths" section above).
7. **Legacy URL redirects**: do we need `/post/<old-id>` → new slug? If yes,
   need a redirect map table or NextJS redirect rules using `legacyId`.
8. **Cutover timing**: when does the old site get turned off and the new one
   becomes canonical? Determines whether migration is a one-shot dump-import
   (Option B) or live replication (Option A + delta sync).
9. **`calendars` table**: do we need TKB (lớp / lịch học) on the new site?
   If no → skip; if yes → add ClassSchedule model.
10. **`conection` table**: 8 stat counters (số SV, GV, ...). Migrate to a
    single `Stat` table or skip and rebuild via Puck StatsCounter widget?
11. **`menus` table**: 383 menu rows define navigation hierarchy. New site
    rebuilds nav inside Puck Navbar component. Skip migrate, manually
    recreate? Or auto-generate Navbar puckData from menus + menuslang?

---

## File outputs to expect when this plan is executed

- `backend/prisma/schema.prisma` — updated with new models + legacy fields
- `backend/prisma/migrations/<timestamp>_preserve_legacy_data/migration.sql`
- `backend/scripts/migrate-legacy.ts` — main migration script (run via `tsx`)
- `backend/scripts/legacy-image-cache.json` — manifest of downloaded images
  (legacyPath → mediaId) for idempotent re-runs
- `docs/legacy-migration-report.md` — generated after migration: row counts,
  failures, sample rows for spot-check

---

## Reference: SQL dump location

Local copy on dev machine (WSL path):
```
/mnt/c/Users/Hoai Phuong/Downloads/phys_db_1778382745.sql
```
70 MB, MariaDB 10.6 dump format, UTF-8.
