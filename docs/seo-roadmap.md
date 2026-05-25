# SEO Roadmap — frontend-public

7-step plan to bring `frontend-public` (Next.js 16, .edu.vn domain) up to production SEO baseline.

Each step is a self-contained prompt — copy the fenced block into the project's Claude Code chat. The `orchestrator` skill will dispatch `public-fe-agent` with `seo-frontend-public` loaded.

Run steps in order. Do not skip 1 or 2 — they are foundation.

---

## Priority

| Priority | Step | Why |
|---|---|---|
| 🔴 Must-do first | 1, 2 | Foundation. Without these, every audit reports false negatives. |
| 🟡 High | 3, 4 | Image SEO + Vietnamese tuning — biggest score gains for least effort. |
| 🟢 When time allows | 5, 6 | GEO + Core Web Vitals — score lift, low risk. |
| ⚪ Last | 7 | Needs backend coordination (revalidate webhook). |

After each step: `/seo audit http://localhost:3002` and compare score delta vs previous step.

---

## Common prompt header (paste with every step)

```
[scope: chỉ frontend-public, không đụng backend hay frontend admin]
[skills: orchestrator → public-fe-agent + seo-frontend-public]
[verify: /seo <command> http://localhost:3002 + hcmus-verify L3]
[report: pass/fail từng check + screenshot trước-sau khi liên quan UI]
```

---

## Step 1 — Foundation (sitemap, robots, JsonLd component, base metadata)

```
Khởi tạo SEO foundation cho frontend-public:

1. Tạo frontend-public/src/app/sitemap.ts
   - Fetch danh sách post + page-layout từ backend (http://localhost:3001)
   - Yield URLs với { url, lastModified, changeFrequency, priority }
   - Include: /, mọi /[slug] page-layout published, mọi /post/[slug] published
   - Use cache + revalidate 300s

2. Tạo frontend-public/src/app/robots.ts
   - Allow: /
   - Disallow: /api/*, /preview/*, /admin/*, /_next/*
   - Sitemap: ${baseUrl}/sitemap.xml
   - Host: từ env NEXT_PUBLIC_SITE_URL

3. Tạo frontend-public/src/components/JsonLd.tsx
   - Typed server component, render <script type="application/ld+json">
   - Export helpers: organizationSchema, websiteSchema, articleSchema, newsArticleSchema, personSchema, educationalOrganizationSchema, faqPageSchema, breadcrumbListSchema, courseSchema
   - Mỗi helper nhận typed args, return JSON-LD object
   - Component nhận schema object | object[], render an toàn

4. Tạo frontend-public/src/lib/seo.ts
   - getBaseUrl() — từ env NEXT_PUBLIC_SITE_URL hoặc fallback localhost:3002
   - buildCanonical(path: string) → absolute URL
   - buildOgImage(slug?: string) → absolute URL tới /api/og hoặc static fallback
   - defaultMetadata: Metadata — title template, openGraph defaults, twitter defaults, locale vi_VN
   - facultyOrganization() → Organization schema cho Khoa Vật Lý (address, contactPoint, sameAs)

5. Update frontend-public/src/app/layout.tsx
   - <html lang="vi" suppressHydrationWarning>
   - export const metadata = defaultMetadata
   - Render <JsonLd schema={[organizationSchema(), websiteSchema()]} /> trong <head>
   - Viewport, theme-color, manifest links

Sau khi xong:
- /seo audit http://localhost:3002 → ghi baseline score vào docs/seo-baseline.md
- /seo schema http://localhost:3002
- /seo sitemap http://localhost:3002
```

---

## Step 2 — Per-route metadata + JSON-LD

```
Thêm generateMetadata + JSON-LD cho mọi route type trong frontend-public/src/app:

Route types cần xử lý (skip cái không tồn tại):
- /                         → Organization + WebSite (SearchAction)
- /[slug] (page-layout)     → page-specific metadata + BreadcrumbList
- /post/[slug]              → NewsArticle + author Person + BreadcrumbList + image
- /category/[slug]          → CollectionPage + ItemList + BreadcrumbList
- /faculty/[slug]           → Person + worksFor EducationalOrganization (nếu route tồn tại)

Mỗi page:
- generateMetadata async, fetch data từ backend, return:
  * title unique 50-60 chars + brand
  * description 140-160 chars
  * alternates.canonical = buildCanonical(path)
  * openGraph: title, description, type ('article' cho post, 'website' cho page), url, images: [{url: buildOgImage(slug), width: 1200, height: 630, alt}]
  * twitter: card 'summary_large_image'
  * robots: index:true, follow:true (riêng /preview/* noindex)
- Render <JsonLd schema={[...]}> với schema phù hợp route type
- BreadcrumbList trên mọi route không phải homepage

Verify từng route:
- /seo schema http://localhost:3002/<route>
- /seo audit http://localhost:3002/<route>
```

---

## Step 3 — Images + LCP

```
Image SEO + LCP optimization cho frontend-public:

1. Audit: grep -rn "<img" frontend-public/src
   - Mọi <img> tag → đổi sang next/image với width/height explicit
   - Exception: <img> trong JSON-LD logo (chuỗi URL) — giữ nguyên

2. Hero/LCP image mỗi page:
   - priority prop
   - sizes prop cho responsive
   - fetchPriority="high" implicit qua priority

3. Alt text:
   - grep alt="" hoặc alt={undefined} → fix mô tả
   - Không dùng filename, không "image", không "photo"
   - Tiếng Việt mô tả nội dung ảnh

4. Below-fold images:
   - loading="lazy" (next/image default)
   - Reserve space: aspect-ratio CSS hoặc explicit dimensions

5. Dynamic OG image:
   - Tạo frontend-public/src/app/api/og/route.tsx
   - Dùng next/og ImageResponse
   - Accept ?title=&subtitle= query params
   - Output 1200x630 PNG với brand colors + fonts
   - Cache-Control: public, max-age=31536000, immutable

Verify:
- /seo images http://localhost:3002/<slug>
- Chrome DevTools MCP: performance trace, check LCP element + LCP time
```

---

## Step 4 — Vietnamese SEO tuning

```
Vietnamese-first SEO cho .edu.vn domain:

1. Slug helper DRY:
   - Tìm toSlug hoặc slugify trong backend/src/shared/helpers.ts
   - Import vào frontend-public (qua copy-paste nếu cross-package import phức tạp, ghi comment 'mirrors backend toSlug')
   - Mọi nơi cần slug dùng helper này, không inline regex

2. Locale:
   - <html lang="vi"> (đã set ở Step 1, double-check)
   - OG locale: 'vi_VN' trong defaultMetadata
   - Twitter có thuộc tính lang nếu apply

3. Meta descriptions:
   - Audit mọi page: description phải tiếng Việt tự nhiên
   - Không dùng output Google Translate
   - Bao gồm primary keyword + faculty name

4. Author byline:
   - Mọi post detail render <span>Tác giả: <a href="/faculty/{slug}">{name}</a></span>
   - Real names, link tới Person profile
   - JSON-LD Article.author = Person schema với name + url + (nếu có) ORCID

5. Footer + Organization schema:
   - Footer hiện địa chỉ vật lý Khoa Vật Lý ĐHKHTN — TPHCM
   - Phone, email contact
   - Map link (optional)
   - facultyOrganization() schema trong layout.tsx phải có:
     * address: PostalAddress (streetAddress, addressLocality, addressRegion: 'TPHCM', addressCountry: 'VN')
     * contactPoint: ContactPoint (telephone, contactType: 'customer service', areaServed: 'VN', availableLanguage: ['Vietnamese'])
     * sameAs: [facebook, youtube nếu có]

Verify:
- /seo content http://localhost:3002/<slug>
- /seo local http://localhost:3002 (faculty address check)
```

---

## Step 5 — GEO (AI Overviews / ChatGPT / Perplexity)

```
GEO patterns cho content pages:

1. Direct-answer opening:
   - Mọi post detail mở đầu paragraph 80-120 từ trả lời thẳng câu hỏi/topic của post
   - Editor (Tiptap) UX hint: tooltip "Đoạn mở đầu nên trả lời trực tiếp câu hỏi chính"
   - Render: paragraph đầu của post hiển thị trước above-the-fold

2. Question-answer format:
   - Audit existing posts: nếu H2 là statement, convert sang question khi natural ("Cách đăng ký..." → "Làm thế nào để đăng ký...")
   - Không hard-rewrite content tự động — chỉ apply pattern cho post mới + tooltip hướng dẫn

3. FAQ schema:
   - Tạo component <Faq items={[{question, answer}]} /> trong frontend-public/src/components
   - Render visible HTML + JSON-LD faqPageSchema
   - Áp dụng lên: trang chủ section FAQ, /tuyen-sinh, /faculty pages có FAQ section

4. Citations:
   - Post type 'research' hoặc 'news': nếu có DOI/source URL, render dưới body
   - Article schema thêm citation: [{ '@type': 'CreativeWork', identifier: 'doi:...', url: '...' }]

5. No-hide rule:
   - Audit Puck blocks: bất kỳ block nào dùng <details>, tabs, accordions cho primary content → flag
   - Primary content phải render trong DOM initial, có thể hide visually nhưng không display:none

Verify:
- /seo geo http://localhost:3002/<slug>
- View page source: confirm answer paragraph trong HTML, không phía sau JS
```

---

## Step 6 — Core Web Vitals

```
CWV pass cho frontend-public:

1. Audit baseline:
   - Chrome DevTools MCP: performance_start_trace + reload mỗi route chính
   - Ghi LCP, CLS, INP từng route vào bảng

2. Fonts:
   - grep "fonts.googleapis" → đổi sang next/font/google
   - grep "@font-face" tự host → kiểm tra preload + font-display: swap
   - Subset 'vietnamese' bắt buộc

3. Above-the-fold:
   - Audit "use client" components render trên top viewport
   - Move sang server component nếu không cần state/effect
   - Nếu cần interactivity, dynamic import với ssr:false CHỈ phần cần JS

4. CLS:
   - Mọi <img>/<Image> có width+height
   - Mọi iframe (YouTube embed): aspect-ratio container
   - Ad slots / dynamic content: min-height placeholder

5. Bundle:
   - pnpm --filter public build → check route sizes trong output
   - Route nào > 200kb First Load JS → audit imports, code-split
   - Tailwind 4: confirm tree-shake hoạt động (CSS output < 50kb)

Verify:
- /seo technical http://localhost:3002/<slug>
- Chrome DevTools MCP performance_analyze_insight LCP cho route LCP cao nhất
- Lighthouse score qua /seo audit
```

---

## Step 7 — Sitemap auto-revalidate

```
Wire sitemap + page cache auto-revalidate khi backend publish:

Backend side (backend/src):
1. post.service.ts publish() và page-layout.service.ts publish():
   - Sau khi update DB + clear Redis, POST tới ${PUBLIC_REVALIDATE_URL}/api/revalidate
   - Body: { tags: ['sitemap', 'post:<slug>'] } hoặc tương đương cho page
   - Header: X-Revalidate-Token = env REVALIDATE_TOKEN
   - Fire-and-forget (không block publish nếu webhook fail)
   - Log warn nếu fail

2. Env mới: PUBLIC_REVALIDATE_URL, REVALIDATE_TOKEN trong backend/.env

Frontend-public side:
1. Tạo frontend-public/src/app/api/revalidate/route.ts:
   - POST handler
   - Validate X-Revalidate-Token header === env REVALIDATE_TOKEN (401 nếu sai)
   - Parse body { tags: string[] }
   - Call revalidateTag(tag) cho mỗi tag
   - Return { revalidated: true, tags }

2. Tag mọi cached fetch:
   - sitemap.ts: fetch backend với { next: { tags: ['sitemap'] } }
   - post detail: { next: { tags: ['post:' + slug, 'sitemap'] } }
   - page detail: { next: { tags: ['page:' + slug, 'sitemap'] } }

3. Env mới: REVALIDATE_TOKEN trong frontend-public/.env.local

Test:
- Boot full stack (pnpm docker:up hoặc 3 dev terms)
- Publish 1 post từ admin
- Trong vòng 2s: curl http://localhost:3002/sitemap.xml | grep <new-slug> → phải có
- curl http://localhost:3002/post/<new-slug> → 200, không 404
- Backend log: thấy "revalidate webhook OK"

Anti-pattern:
- Đừng dùng on-demand revalidate path cho mỗi page navigation (cache miss storm)
- Đừng để REVALIDATE_TOKEN trong code/git — env only
```

---

## After all steps

1. Run full audit: `/seo audit http://localhost:3002` — should score > 90
2. Generate PDF report: `/seo report` (skill `seo-google`)
3. Commit roadmap completion notes vào `docs/seo-baseline.md` với before/after scores
4. Production: swap `NEXT_PUBLIC_SITE_URL` sang real domain (`https://phys.hcmus.edu.vn/...`), re-run audit on prod URL
5. Wire `seo-google` skill với Google Search Console API cho ongoing monitoring (cần OAuth setup separately)

## Forbidden during this work

- Touching `backend/` outside Step 7's specific service files
- Touching `frontend/` (admin) — wrong package
- Changing global SEO defaults without confirming với user (high blast radius)
- Skipping verify step in any single Step
- Committing without `hcmus-verify L3` pass

## Reference

Skills loaded by `public-fe-agent` during this work:
- `orchestrator` — dispatch
- `seo-frontend-public` — checklist gate
- `seo` + all `seo-*` sub-skills — domain knowledge
- `next-best-practices`, `next-cache-components`, `performance` — Next 16 patterns
- `hcmus-verify` — final gate
