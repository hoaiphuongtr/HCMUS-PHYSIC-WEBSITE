/**
 * Shared helpers for legacy-content migration:
 *  - decodeEntities: HTML-entity → unicode (mirrors clean-titles.ts ENTITY_MAP)
 *  - rewriteHtml:    /uploads/... → /uploads/legacy/... img rewrite (mirrors rewrite-media-urls.ts)
 *  - sanitizeHtml:   strip <script>/<iframe> (except YouTube) + on* handlers (per legacy-migration-plan.md §1)
 */

const ENTITY_MAP: Record<string, string> = {
  '&#34;': '"',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&nbsp;': ' ',
  '&#160;': ' ',
  '&#8217;': '’',
  '&#8216;': '‘',
  '&#8220;': '“',
  '&#8221;': '”',
  '&#8211;': '–',
  '&#8212;': '—',
  '&hellip;': '…',
  '&#8230;': '…',
};

export const decodeEntities = (raw: string): string => {
  let out = raw;
  for (const [from, to] of Object.entries(ENTITY_MAP)) {
    out = out.split(from).join(to);
  }
  out = out.replace(/&#(\d+);/g, (_, code: string) =>
    String.fromCharCode(Number(code)),
  );
  out = out.replace(/&#x([0-9a-f]+);/gi, (_, code: string) =>
    String.fromCharCode(Number.parseInt(code, 16)),
  );
  return out;
};

const toLocalUploads = (src: string): string => {
  if (src.startsWith('/uploads/legacy/')) return src;
  if (src.startsWith('/uploads/'))
    return src.replace(/^\/uploads\//, '/uploads/legacy/');
  const absMatch = src.match(/^https?:\/\/phys\.hcmus\.edu\.vn(\/uploads\/.*)$/i);
  if (absMatch) return absMatch[1].replace(/^\/uploads\//, '/uploads/legacy/');
  return src;
};

/**
 * Rewrite <img> and <iframe> srcs so legacy uploads resolve against the new
 * backend's /uploads/legacy/ mount (same rule as rewrite-media-urls.ts). Iframes
 * must use the relative form too — PostBodyRender strips iframes that point at
 * the absolute phys.hcmus.edu.vn host, which would drop embedded PDFs.
 */
export const rewriteHtmlImages = (html: string): string =>
  html.replace(
    /(<(?:img|iframe)[^>]+src=["'])([^"']+)(["'])/gi,
    (_m, prefix: string, src: string, suffix: string) =>
      `${prefix}${toLocalUploads(src)}${suffix}`,
  );

/**
 * Strip scripts and event handlers. Keep iframes only from trusted hosts:
 * YouTube, the legacy site itself (PDF/doc embeds), and Google Docs/Drive —
 * legacy pages embed regulation PDFs and org charts this way.
 */
const TRUSTED_IFRAME =
  /youtube\.com|youtu\.be|youtube-nocookie\.com|phys\.hcmus\.edu\.vn|docs\.google\.com|drive\.google\.com/i;

export const sanitizeHtml = (html: string): string =>
  html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, '')
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, (m) =>
      TRUSTED_IFRAME.test(m) ? m : '',
    );

/** Full transform for a legacy page/post HTML body. */
export const transformLegacyHtml = (raw: string | null | undefined): string => {
  if (!raw) return '';
  return rewriteHtmlImages(sanitizeHtml(raw));
};

/** Rewrite a single legacy image path (cover / banner) to the local mount. */
export const rewriteImagePath = (
  raw: string | null | undefined,
): string | null => {
  if (!raw) return null;
  let src = raw.trim();
  if (!src) return null;
  const absMatch = src.match(
    /^https?:\/\/phys\.hcmus\.edu\.vn(\/uploads\/.*)$/i,
  );
  if (absMatch) src = absMatch[1];
  if (src.startsWith('/uploads/legacy/')) return src;
  if (src.startsWith('/uploads/'))
    return src.replace(/^\/uploads\//, '/uploads/legacy/');
  return src;
};

/**
 * Gắn `border="0"` cho thẻ <table> nào chưa có thuộc tính border.
 *
 * Trang công khai nhận diện "bảng dữ liệu" (để kẻ đường và ép bố cục cột) dựa
 * vào dấu hiệu trong chính HTML: có `border=`, có MsoTableGrid, hoặc ô có
 * border-color. Nội dung lấy từ TRANG RENDER của site cũ thường không còn thuộc
 * tính đó, trong khi nội dung lấy từ DUMP thì có — nên hai bản của cùng một
 * trang hiện khác hẳn nhau: bản Việt có đường kẻ, bản Anh mất sạch, ảnh chồng
 * lên chữ (đo trên trang Giảng viên cơ hữu: 12/27 bảng bên bản Anh không được
 * nhận là bảng).
 *
 * Dùng `border="0"` chứ không phải "1" để khớp đúng cách dump ghi: nó chỉ là
 * dấu hiệu nhận diện, còn đường kẻ do CSS của trang vẽ.
 */
export const ensureTableBorderAttr = (html: string): string =>
  html.replace(/<table\b([^>]*)>/gi, (whole, attrs: string) =>
    /\bborder\s*=/i.test(attrs) ? whole : `<table border="0"${attrs}>`,
  );
