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
| P2 Frontend adapt | **in_progress (stopped mid-edit)** | api.ts: started adding LocalizedText, CategoryRef, Category types; PostCategoryValue removed. **NOT YET DONE**: PostRecord/UpsertPostBody/PostPublicCard still reference removed PostCategoryValue; need to swap to LocalizedText/categoryId. Then categoryApi (list/create/update/remove) needs to be added. Then post-list-view / post-composer-view / news-feed.tsx / post-categories.ts / dashboard-view.tsx must read localized JSON + use categoryId. Compile is currently broken on FE — DO NOT push frontend yet. |
| P3 Migration script | pending | parse-dump.ts + seed-{categories,posts,pages,users}.ts, idempotent via legacyId, dry-run flag |
| P4 Media downloader | pending | fetch all image paths, save to backend/uploads/legacy/, create Media rows |
| P5 Validation + push | pending | spot-check 10 posts, count parity, progress.md update, commit, push |

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
