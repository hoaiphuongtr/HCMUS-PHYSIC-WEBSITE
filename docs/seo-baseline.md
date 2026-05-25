# SEO Baseline — After Step 1+2

**Audit date**: 2026-05-25
**URL**: http://localhost:3002
**Business type**: Educational Organization (university faculty)

## Score Estimate

| Category | Weight | Score | Notes |
|---|---|---|---|
| Technical SEO | 22% | 90 | robots.txt, sitemap.xml, canonical, lang=vi all present |
| Content Quality | 23% | 75 | Vietnamese, structured H1/H2, descriptive copy |
| On-Page SEO | 20% | 88 | title template, meta description, OG tags, canonical |
| Schema | 10% | 95 | Organization + WebSite + EducationalOrganization + SearchAction; per-route BreadcrumbList |
| Performance (CWV) | 10% | TBD | needs Lighthouse trace |
| AI Search Readiness | 10% | 80 | structured JSON-LD, vi-VN locale, real entity (faculty) |
| Images | 5% | 95 | 48 images, all with alt attribute on homepage |
| **Overall (weighted)** | | **~85** | Strong baseline |

## Signals Verified

### Foundation (Step 1)
- `/robots.txt` returns 200 with Allow + Disallow + Sitemap line
- `/sitemap.xml` returns valid XML with 12+ URLs (homepage + page-layouts + post layouts)
- `<html lang="vi" suppressHydrationWarning>` ✓
- `<title>` 31 chars + brand template
- `<meta name="description">` 70+ chars Vietnamese
- 6 `application/ld+json` blocks injected by `<JsonLd>` component
- Canonical URL absolute

### Per-Route Metadata (Step 2)
- `/vi` homepage: generateMetadata uses layout.name + layout.description + og:image
- `/vi/[...slug]`: generateMetadata + BreadcrumbList JSON-LD
- OG locale `vi_VN`
- Twitter card `summary_large_image`

### JSON-LD Schemas Emitted
- Organization
- WebSite (with SearchAction)
- EducationalOrganization (faculty entity with PostalAddress + ContactPoint + sameAs Facebook)
- BreadcrumbList (per-route)
- CollegeOrUniversity (parent: HCMUS)
- ContactPoint, PostalAddress, SearchAction, EntryPoint nested

## Issues Found

### Critical
- None.

### High
- **OG image dynamic route missing**: `/api/og` referenced in `buildOgImage(slug)` but route not yet implemented. Falls back to logo PNG for slug-specific routes, which is acceptable but loses per-page social previews. Address in Step 3.
- **`force-dynamic` on layout pages**: `[locale]/page.tsx` + `[locale]/[...slug]/page.tsx` use `dynamic = "force-dynamic"` + `revalidate = 0`. Bypasses cache; sitemap revalidation (Step 7) won't help these. Consider switching to ISR (`revalidate = 300`) once cache invalidation webhook is wired.

### Medium
- **Material Symbols Outlined Google Font** still loaded in `layout.tsx` head despite admin migration to lucide. Public app no longer uses it (verified via grep). Remove to save one render-blocking external request.
- **Title duplication on inner H1 vs H2**: homepage has H1 "Khoa Vật lý - Vật lý Kỹ thuật" plus first H2 with identical text. Demote H2 or rewrite for keyword variation.
- **Sitemap layout filter relies on `isPublished`** but does not respect `scheduledAt > now`. Edge case: scheduled-future layouts could leak into sitemap if `isPublished=true` flips before scheduled time (currently isn't possible by the cron worker, but worth a guard).

### Low
- `keywords` array set in defaultMetadata — Google ignores it but Bing still reads. Keep.
- No `apple-touch-icon` or `manifest.json` linked. Step 1 plan mentioned these; skipped for scope. Add when designing PWA polish.

## Next Steps

Per `docs/seo-roadmap.md`:
- Step 3: image optimization + LCP + dynamic `/api/og` route
- Step 4: Vietnamese SEO tuning (slug helper, author bylines, footer NAP)
- Step 5: GEO (FAQ schema, direct-answer paragraphs)
- Step 6: Core Web Vitals
- Step 7: sitemap auto-revalidate webhook
