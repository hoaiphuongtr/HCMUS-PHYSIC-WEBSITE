# Session Progress Log

## Current State

**Last Updated:** 2026-06-28
**Active Feature:** feat-013 — Legacy migration (header dropdowns + section pages)

## Session 2026-06-28 — Legacy header dropdowns + missing section pages (feat-013, DONE)

**Goal:** mimic the legacy site (phys.hcmus.edu.vn) header nav 1-to-1 on the public
site, and build the section pages each dropdown links to (most were never migrated).

### What was done

1. **Recovered the real legacy header** from the SQL dump (`menus` + `menuslang`,
   filtered `deptid=1, locationid=1, deleted=0, status=1`) — 9 top items + 36 dropdown
   links, VI/EN labels, matches the live site exactly.
2. **Navbar** (`build-legacy-header.ts`): wrote the tree into the homepage (`trang-chu`)
   `Navbar.menuItems`. `SiteHeader`/`SiteFooter` are **syndicated** (fetch `trang-chu`
   at runtime), so this one write propagates the nav to every layout. Exports
   `MENU_ITEMS`, now reused by `seed-homepage-layout.ts` so a fresh seed reproduces it.
3. **Section pages** (`build-legacy-pages.ts`): built **29** PageLayouts (28 missing +
   republished the pre-existing unpublished `viec-lam-nganh-vat-ly`) from legacy
   `pages`/`pageslang`, via the post template (`SiteHeader` + Container + `SiteFooter`)
   using `injectPostIntoPuckData` — reproduces each legacy page (banner + title + HTML
   body) 1-to-1. Slugs = legacy slugs (so navbar links match). Update-or-create by slug.
4. **Media** (`download-page-media.ts`): fetched 180/187 page assets to
   `uploads/legacy/` (2 are broken on the legacy server itself).
5. **Helpers**: `legacy-html.ts` (entity decode + `<img>`/`<iframe>` `/uploads`→
   `/uploads/legacy` rewrite + script/iframe sanitize), `flush-cache.ts` (deletes the
   NestJS `CacheInterceptor` keys in Redis namespace `hcmus-physics` after direct-DB
   writes — wired into both build scripts).

### Verification (all green)

- Playwright screenshot of `/vi`: all 9 legacy top items; "Đào tạo" dropdown lists its
  7 children. EN locale switches labels. No JS console errors.
- All **30** internal nav links resolve to a published PageLayout; 9 external/#/home
  links as expected.
- `gioi-thieu` etc. render header + banner (cover via `resolveMediaUrl`, loads in dev)
  + legacy content + footer.
- `tsc --noEmit` clean. Added `@redis/client@5.12.1` to backend deps (used by flush-cache).

### How to re-run (legacy MariaDB on :3309, db `legacy`, root/root)

```
pnpm --filter backend exec tsx --env-file=.env initialScript/migrate-legacy/build-legacy-header.ts
pnpm --filter backend exec tsx --env-file=.env initialScript/migrate-legacy/build-legacy-pages.ts
pnpm --filter backend exec tsx --env-file=.env initialScript/migrate-legacy/download-page-media.ts
# then revalidate the public site (token in frontend-public/.env):
curl -XPOST localhost:3002/api/revalidate -H "x-revalidate-token: $TOKEN" \
  -H 'content-type: application/json' -d '{"tags":["sitemap","page:trang-chu"]}'
```

### Known limitations / residual risks

- **Inline body images 404 in localhost dev** — pre-existing, site-wide: body HTML is
  rendered raw (not via `resolveMediaUrl`), so relative `/uploads/legacy/...` resolves
  against :3002 not the backend. Identical to all ~1600 migrated post pages; serves in
  prod behind the `/uploads` reverse proxy. (Optional future fix: a `/uploads/:path*`
  rewrite in `frontend-public/next.config.ts` → backend.)
- Section pages use the **post-article template**, so the breadcrumb shows
  "Trang chủ / Tin tức / Chuyên mục" — slightly article-flavored for a static page.
  Acceptable for v1; a dedicated page template could remove it.
- 3 pages have thin text (images/PDF only): `tam-nhin---su-mang`, `to-chuc-nhan-su`
  (org-chart images), `quy-che-hoc-tap` (embedded PDF — iframe src rewritten to local
  so it isn't stripped by PostBodyRender).
- `cat:46` "Câu lạc bộ" (tag merged away in feat-013 category-merge) → links to legacy
  `https://phys.hcmus.edu.vn/cau-lac-bo`.
- Direct-DB writes bypass the service's cache.clear() + public ISR — scripts now flush
  Redis; the public site still needs a tag revalidate (or 1h ISR) to refresh page HTML.

---

## feat-013 plan

Site cũ: PHP custom CMS trên MariaDB 10.6 (dump `phys_db_1781370050.sql.gz`, 5MB gz / 70MB raw). 46 bảng, multi-language (vi+en) qua pattern `xxx + xxxlang`.

### Counts (theo AUTO_INCREMENT)

- posts: ~1944, postslang: ~3411
- categories: ~50, categorieslang: ~101
- pages: ~? , pageslang: ~?
- staffs: ~130
- depts: ~10
- users: ~11
- language: 2 (VI=1, EN=2)

### Decisions chốt với user

1. **Category → relation** (FK) thay vì enum. New `Category` model với `name: Json` localized.
2. **Post i18n → JSON localized** cho `title/body/excerpt` `{vi, en}`.
3. **Media → bulk download** từ `https://phys.hcmus.edu.vn/uploads/...` về sandbox local. Fail-soft trên 404.
4. **No server access** cho legacy box → chỉ dump SQL + HTTP fetch ảnh.

### Phases

| Phase | Status | Description |
|---|---|---|
| P0 Schema design | done | decisions locked above |
| P1 Prisma schema | **done** | migration `20260613171157_categories_and_post_i18n` applied. Category table seeded with 5 defaults (cat_default_*). Post.title/body/excerpt converted text→jsonb via `jsonb_build_object('vi', <old>)`. Existing 67 posts kept, all backfilled to `cat_default_educational`. UserPreference.categories: PostCategory[] → text[]. PostCategory enum dropped. |
| P1 Backend adapt | **done** | post.model.ts: LocalizedTextSchema + UpsertPostBodySchema uses categoryId + title/body/excerpt as Localized. post.service: `asLocalized` + `viOf` helpers; create/update use categoryId + JSONB writes; serialize emits Localized objects; cloneIntoLayout/syncAttachedLayouts now load Category by id to get slug+name; viOf(post.title) for slug + injectPayload. New CategoryModule (controller/service/dto/model) wired into AppModule. `pnpm exec nest build` clean. |
| P2 Frontend adapt | **done** | api.ts: LocalizedText / CategoryRef / Category types added; PostRecord, UpsertPostBody, PostPublicCard now LocalizedText + categoryId; `categoryApi` (list/getById/create/update/remove) added. New `lib/localized.ts` helper (localize/toLocalized/emptyLocalized). `lib/post-categories.ts` rewritten: static color map by slug + buildCategoryOptions(categories, locale). Consumers updated: post-list-view (fetch categoryApi, categoryLabel + localize(title,'vi')), post-composer-view (VI/EN tab switch for title/body/excerpt, categoryId dropdown from categoryApi), news-feed (post.category.slug + post.category.name + categoryColor()), dashboard-view (localize(post.title,'vi')), scheduled-modal (categoryId in payload). frontend-public/lib/api.ts re-export updated. `npx tsc --noEmit` clean for both admin + public. Biome lint admin: 196 warnings (all pre-existing). Backend lint: 0 errors / 83 warnings (all pre-existing). |
| P3 Migration script | **done** | `backend/initialScript/migrate-legacy/run.ts` boots a temp MariaDB 10.6 (Docker), restores the dump, then upserts depts→users→categories→posts into Postgres. Idempotent via `legacyId` (+ id prefix `dept_legacy_*`, `legacy_user_*`, `cat_legacy_*`, `post_legacy_*`). Slug + email collisions dedupe via chooseSlug + counter suffix. Result on current local: 10 departments, 11 legacy users, 45 legacy categories (+ 5 defaults = 50), 1637 legacy posts (+ 67 prior = 1704). Title/body/excerpt stored as `{vi, en}` JSONB. Run instructions in `backend/initialScript/migrate-legacy/README.md`. |
| P4 Media downloader | **done** | `backend/initialScript/migrate-legacy/download-media.ts` scans every migrated post (coverUrl + body[vi/en] `<img src=>`) + categories and downloads everything under `https://phys.hcmus.edu.vn/uploads/...` into `backend/uploads/legacy/`. 6-concurrent fetch loop. Run on current local: 1909 unique paths → 1870 ok, 36 failed (legacy 404s), 3 skipped (already on disk). Total disk: 3.9GB. Then `rewrite-media-urls.ts` rewrote all post.coverUrl, post.body img src, category.image, user.avatarUrl from `/uploads/X` → `/uploads/legacy/X` so the local Nest static-file middleware (`src/main.ts` line 37) serves them. 1636 posts + 7 categories updated. |
| P5 Validation + push | **done** | All five phases committed to `wip/feat-013-legacy-migration`. Backend `pnpm exec nest build` clean. Admin + public `npx tsc --noEmit` clean (modulo `auth-client.ts` which references `better-auth/react`, a pre-existing import from the initial bootstrap commit `7086ace`, unrelated to feat-013). 1704 posts visible via Prisma, 1870 media files under `backend/uploads/legacy/`. Branch pushed: `wip/feat-013-legacy-migration` (commits `e3d8214` P1, `b6361b9` P2, `e568b9e` P3+P4). Ready for review + merge into main. |

## What still needs the user

1. **Real-server QA** before promoting to prod. Boot `pnpm dev`, open `/admin/posts/list`, confirm:
   - Mine tab shows your local-only posts.
   - Published tab shows the 1637 legacy posts.
   - Post composer opens an existing legacy post → title/body show in VI tab, switch to EN tab → English content visible, cover image renders from `/uploads/legacy/...`.
   - News-feed widget shows category color badges (from `categoryColor(slug)`).
2. **Sandbox deploy** (CentOS 7.9, 103.88.121.212:63379, user vlkt) — not attempted this session. The 3.9GB media folder must ship alongside (rsync after build).
3. **SMTP setup** for OTP forgot-password — still deferred from earlier session.
4. **Merge `wip/feat-013-legacy-migration` → main** when QA passes.

## Resume checklist (next session)

1. **Frontend is mid-refactor — fix compile errors first.** `cd frontend && npx tsc --noEmit` will surface the remaining call sites:
   - `src/lib/api.ts` — update PostRecord, UpsertPostBody, PostPublicCard to use LocalizedText + categoryId; add `categoryApi.list/create/update/remove` block.
   - `src/lib/post-categories.ts` — replace static enum-based mapping with dynamic Category fetching helper, OR delete and use Category from API.
   - `src/views/admin/posts/post-list-view.tsx` — categoryLabelVi import + filter + display.
   - `src/views/admin/posts/post-composer-view.tsx` — category select fetches from /categories; title/body/excerpt become 2-tab (VI/EN) inputs.
   - `src/views/admin/dashboard/dashboard-view.tsx` — `post.title` is object; use a localize helper.
   - `src/views/admin/widgets-layout/components/news-feed.tsx` — `post.category` string → category.slug; `CATEGORY_LABELS[post.category]` lookup needs Category data.
2. Add `frontend/src/lib/localized.ts` helper: `localize(value: LocalizedText | string | null, locale: 'vi'|'en'): string`.
3. After FE compiles, write migration script (P3).
4. Test login still works (BE wasn't touched in a breaking way that hits auth, but verify).
5. Spot-check existing 67 posts render — they now have `title: { vi: <original> }`, no `en`. UI must handle absent `en`.

### Touched files estimate

- **Backend** (~10 files): schema.prisma + migration, post.model/dto/service/repo/controller, new category/* module
- **Frontend** (~8 files): lib/localized.ts (new), post-list/post-composer/post-detail/public render, post-categories.ts (dynamic)
- **Migration scripts** (~7 files): all new under backend/initialScript/migrate-legacy/

### Breaking nature

Schema change is BREAKING for any code that reads `post.title` as string. All call sites must use `localized(post.title, locale)` helper. Compile-checked at each phase before moving forward.

## Sandbox info (for deploy phase, after migration)

- IP: 103.88.121.212, OS CentOS 7.9, SSH port 63379, user vlkt
- 4 vCPU / 4 GB RAM / 50 GB disk
- SSH reachability TBD (host unreachable from current WSL — user to test)
- No domain assigned yet → temporary HTTP via IP

## Recent commits (last session)

- da3e399 fix(sidebar): theme switch — slide knob between fixed icons
- ca81539 feat(admin): hover-expand sidebar, theme switch redesign, puck cleanup
- 94ca4ef fix(avatar): use next/image with unoptimized; preload LCP sidebar avatar
- 422f564 fix(settings): department as free-text + resolveMediaUrl on avatars
- ee07a67 feat(settings): /admin/settings profile + change password
- (earlier feat-010 to feat-012 unchanged)

## Active rules

- All toasts Vietnamese only (no Anh-Việt mix). Replace "Password" → "Mật khẩu".
- Verification gate: `pnpm build` (not just vitest) before push — vitest swc skips TS strict.
- One feature at a time per CLAUDE.md harness rule.
