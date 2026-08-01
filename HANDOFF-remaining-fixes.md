# Handoff — Remaining fixes (phys.hcmus.edu.vn CMS)

> Written at the end of a very long polishing session. Latest pushed commit:
> **`a696e72`** on branch `wip/feat-013-legacy-migration` (local == remote).
> Open a fresh session and apply the fixes below one at a time.

---

## 0. Standard workflow for EVERY fix — **pull → commit & push → build + deploy**

Always in this order so nothing is lost and the deployed image matches remote:

```bash
# 1) PULL first (a colleague — cô Ngân — works on AI/chatbot; never build on stale code)
cd /home/hoai/final-project
git fetch --all --prune
git status -sb                      # confirm 0 behind; git pull if behind

# 2) make the change, then COMMIT & PUSH
git add -A
git commit -m "…"                   # end body with: Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
git push

# 3) BUILD + DEPLOY (scripts live in the session scratchpad — recreate if cleared)
#    Frontend only (admin+public, NO backend → no OOM risk):
bash <scratchpad>/build_fe.sh       # docker build admin+public → save|gzip → deploy_fe.py
#    All 3 (includes backend — backend `nest build` OOMs at 3072MB if <~5Gi free):
bash <scratchpad>/build_deploy.sh
#    Backend only:
bash <scratchpad>/build_be.sh
```

`build_fe.sh` builds with:
`--build-arg NEXT_PUBLIC_API_URL=https://phys.hcmus.edu.vn/be --build-arg NEXT_PUBLIC_IMAGE_FETCH_ORIGIN=http://backend:3001 --build-arg NEXT_PUBLIC_SITE_URL=https://phys.hcmus.edu.vn`

`deploy_*.py` does: sftp image → `docker load` → `docker compose -f docker-compose.sandbox.yml up -d --no-deps --no-build --force-recreate <svc>` → `redis FLUSHALL` → clear public `.next/cache` (keep `images`).

**Cache gotcha:** for DATA-only changes (DB edits), clearing `.next/cache` + `redis FLUSHALL` is often NOT enough — the running Next server keeps ISR/in-memory renders, and the backend layout API is `CacheInterceptor`-cached. To make an edit show immediately you must **restart public** (and for layout-name/title changes, it needs the backend redis flush too):
```
docker compose -f docker-compose.sandbox.yml restart public
```

---

## 1. Access / infra (reusable)

**Sandbox box** (prod): `vlkt@103.88.121.212:63379`, password in `~/.hcmus-sbpass`. Use paramiko.
- DB container `hcmus-cms-db-1`: `psql -U physics -d hcmus_physics`.
- Uploads bind-mount: host `/home/vlkt/hcmus-cms/backend/uploads` → container `/app/uploads`. Served at `/be/uploads/...` and `/uploads/...`.
- Services: `hcmus-cms-{backend,admin,public,db,redis,ollama-1}`, `hcmus-caddy`. compose at `/home/vlkt/hcmus-cms/docker-compose.sandbox.yml`. Admin at `https://phys.hcmus.edu.vn:3000` (super-admin `admin@hcmus.edu.vn` / `Phys-HCMUS-Admin-2026!`).
- The box **can reach the old site directly** (used for asset re-migration).

**Old site** (Joomla, source of legacy assets): IP `112.78.11.146:443`, must send header `Host: phys.hcmus.edu.vn`, SSL verify OFF. e.g.
```
curl -sk -H 'Host: phys.hcmus.edu.vn' 'https://112.78.11.146/uploads/<path>'
```
Old site uses `/uploads/<path>` (NO `legacy/` or `mirror/` prefix). New-site refs sometimes have `/uploads/legacy/…` or `/uploads/mirror/…` → strip that prefix to build the old-site URL.

**Asset re-download pattern (already used for images+PDFs; reuse for anything):**
- Enumerate refs from DB: `regexp_matches(puckData::text || publishedPuckData::text, '/uploads/[^"\\ ]+?\.(?:ext)', 'g')`.
  ⚠️ Do NOT exclude `)` in the char class — filenames like `Lê Văn Ngọc (1).jpg` contain literal parens.
- Save base MUST be `/home/vlkt/hcmus-cms/backend` (NOT `.../backend/uploads`) because the ref path already starts with `/uploads/` → otherwise you get a `uploads/uploads/…` double dir.
- Box shell loop: skip if `[ -f "$base$disk" ]`, else `curl -sk -H 'Host: phys.hcmus.edu.vn' "https://112.78.11.146<oldpath>"` trying `[strip-legacy, strip-mirror, as-is]`.
- ~33 assets are genuinely gone from the old site (unrecoverable).

---

## 2. Remaining tasks (investigated)

### #65 — Trash tab: "Xóa vĩnh viễn" (permanent delete) button  — **backend + UI**
The soft-delete/restore/trash system already exists.
- **Backend** `backend/src/post/post.controller.ts`: has `@Delete(':id')` (line ~155, soft-delete → sets `deletedAt`) and `@Post(':id/restore')` (line ~165). **Add** a hard-delete endpoint, e.g. `@Delete(':id/purge')` → `postService.purge(id, userId, roleName, departmentId)`.
- **Backend** `backend/src/post/post.service.ts`: model the hard delete on `purgeExpiredTrash()` (line ~668–692) which does, in a `$transaction`:
  `tx.pageLayout.deleteMany({ where: { sourcePostId: {in:[id]} } })` → `tx.postTag.deleteMany({ where:{ postId:id } })` → `tx.post.deleteMany({ where:{ id } })`. **Guard: only allow if the post is already trashed (`deletedAt != null`)** + ownership/dept-scope (reuse `assertOwnership`/scope like `restore`). Trigger `publicRevalidate` for affected slugs + `sitemap`.
- **API** `frontend/src/lib/api.ts` (`postApi`, starts line ~775): add `purge: (id) => api(\`/posts/${id}/purge\`, { method: "DELETE" })` next to `restore`/`remove`.
- **UI** `frontend/src/views/admin/posts/post-list-view.tsx`: trash tab renders "Khôi phục" at lines ~466–482. Add a **"Xóa vĩnh viễn"** button (red, with a confirm) + `purgeMutation = useMutation({ mutationFn: (id)=>postApi.purge(id), onSuccess: invalidate list + trashCount })`.
- Needs backend rebuild (`build_be.sh` or `build_deploy.sh`) — watch RAM (nest build OOMs at 3072MB heap; ensure ≥~5Gi free; the boompay-api docker stack locally eats a lot).

### #69 — Restore ICEBA 2023 & 2024 pages (with new layout)  — **content migration**
- **Confirmed**: old site serves `/vi/iceba2023`, `/vi/iceba2024`, `/vi/iceba2025` (all 200, Joomla microsites). New site only has `iceba2026` (a **StaticPage**, slug `iceba2026`, served at clean top-level `/iceba2026`). ICEBA2023/24/25 → 404 on new site. Many `tin-tuc/*iceba*` **posts** exist but the standalone conference pages don't.
- User decision: **leave 2025 & 2026 as-is**; only **restore 2023 & 2024**. "có tồn tại trong db không" → they exist on the old site (not new DB).
- Fix: fetch old `/vi/iceba2023` and `/vi/iceba2024` HTML (+ their assets) from the old site, then create them as **StaticPage**s like `iceba2026` (advisor's static-pages feature — served at clean URL, bundle/zip based; see `backend/src/static-page/` + `docs`/recent commits `feat(static-pages)`). Check the `StaticPage` table shape and how `iceba2026` was created (probably a zip upload in admin). Re-point any internal links.

### #70 — Paragraph first-line indent shows on web but not editor (hoi-sinh-vien)  — **minor consistency**
- Web shows a first-line indent on some legacy paragraphs; the editor (Tiptap) shows them flush. Need to find the source per-paragraph: either (a) leading `&nbsp;`/spaces in the legacy HTML that the browser renders as indent but Tiptap trims, or (b) an inline `text-indent`. There is already a `text-indent: 0 !important` rule but only inside the `[data-post-body] @media(max-width:768px)` block (post-placeholders.tsx ~line 360) — legacy-content has no such reset.
- Likely fix: normalize in `LegacyHtmlRender` source processing — strip a single leading `&nbsp;`(runs) at the start of `<p>` OR add `.legacy-content p { text-indent: 0 }`. Decide direction with the user (both indented vs both flush). Low priority.

### #74 — Legacy LaTeX / equation images broken (`$d(n)$` etc.)  — **external images**
- On `vat-ly-tin-hoc/huong-nghien-cuu/xu-ly-am-thanh` the "math" `<img>`s are **`https://www.mathworks.com/help/examples/audio/win64/…eq….png`** (MATLAB doc equation PNGs, copied from a MathWorks example) + fallback `$…$` alt text. They break because the external mathworks.com images 404 / are CSP-blocked.
- Options: (a) mirror those specific PNGs locally + rewrite src; (b) allow `www.mathworks.com` in the public `next.config.ts images.remotePatterns` (but they still may 404 upstream); (c) if truly broken upstream, replace with KaTeX rendering of the `$…$` (only if the raw LaTeX is present). Niche page — low priority; confirm scope before big work.

### #61 & #63 — Editor images block-level (center-bleed + stacking)  — **DEPLOYED, needs in-editor verify**
- Already shipped (commit `cd906d8`): `markdown-editor.tsx` `ImageResize.configure({ inline: false })` + insert/render default styles → `display:block`; public CSS forces `div:has(> div > img) { display:block }` in `[data-post-body]` & `.legacy-content`.
- **Verify in the admin editor** (log in): select part of a line and center → should NOT affect the previous line; images should stack (editor ↔ Preview ↔ web consistent). If a regression on existing inline-image posts, revert `inline:false` and reconsider.

### ProfileCard shows a huge empty box when the image is missing (32 truly-gone assets)  — **frontend component**
- Component in `frontend/src/views/admin/widgets-layout/components/content.tsx` (`ProfileCard`). When `imageUrl` 404s, the fixed-aspect image container renders as a big blank card.
- Fix: add `onError` handling to the `<img>`/`next/image` → swap to a placeholder avatar (or hide the image box and show initials). One-line-ish component fix that improves ALL missing-photo cards + any future ones. (Already worked around 2 specific cards by downloading the old `/img/default3.jpg` default avatar to `/uploads/img/default3.jpg` and rewriting the ref.)

### Punch-list (data / manual — hand to faculty)
- **#110**: some VLĐT staff photos have the person's **name baked into the image** (old pre-labeled photos) → duplicate with the card's own name label. Must replace those specific source images.
- **#111**: on de-tai-khoa-luan-sv the 8-digit MSSV wraps to 2 lines (fit-vs-readability trade-off of `table-layout:fixed` + `overflow-wrap:break-word`). Cosmetic; could give MSSV a `white-space:nowrap` only if a per-column marker is added.
- ~**33 images/PDFs** are genuinely gone from the old site (unrecoverable) → decide replacements.

---

## 3. Already DONE this session (for context — do NOT redo)
FB og:image → post cover · remove duplicate cover in post detail · fix broken images in editor Preview tab · editor images block-level (#61/#63, verify) · data tables fit at any zoom + responsive min-width + colspan-header + **THEME A gridlines for borderless tables + uniform dark color + collapse `<p>&nbsp;</p>` gaps** (de-tai gap 1209→93px) · staff photos fill/flush + email wrap + white-space fix · tam-nhin image enlarged · CLB post template (copy of "Layout mẫu — Tin khoa học") · **#66 slug edits apply immediately + rewrite internal links** (+ one-time fix of 28 stale `giang-vien-co-huu1678184500` links) · **#75 fix 5 dept nhan-su tab titles** (were raw slug) · **#72/#73 re-migrated 878 images + 234 PDFs/docs from old site** (fixed double-uploads, paren-filename, wrong-base bugs) · default-avatar fix for 2 cards.

Key edited files: `frontend/src/views/admin/widgets-layout/components/post-placeholders.tsx` (most table/image render CSS + HTML post-processing), `.../components/legacy-page.tsx`, `frontend/src/views/admin/posts/markdown-editor.tsx`, `frontend/src/app/[locale]/[...slug]/page.tsx` (public, og:image), `backend/src/page-layout/{page-layout.service.ts,page-layout.repo.ts,page-layout.model.ts}` (#66 slug revalidate + rewrite, sourcePost cover).
