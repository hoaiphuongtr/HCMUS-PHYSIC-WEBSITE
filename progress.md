# Session Progress Log

## Current State

**Last Updated:** 2026-06-14
**Active Feature:** feat-013 — Legacy migration (MariaDB dump → Postgres + media)

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
| P5 Validation + push | **in_progress** | Spot-check + commit + push P3/P4. Backend `pnpm exec nest build` clean, frontend tsc clean. Dump (.sql + .sql.gz) kept out of git via `backend/initialScript/migrate-legacy/.gitignore`. uploads/legacy/ already covered by `backend/.gitignore`. |

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
