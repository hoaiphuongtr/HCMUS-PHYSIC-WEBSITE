/**
 * Khớp tên tác giả — nền của cơ chế "bài này có phải của bạn không".
 *
 * Tên người Việt khi đăng báo biến dạng rất nhiều:
 *   Nguyễn Vương Thuỳ Ngân → "Ngan V. T. Nguyen" · "N. V. T. Nguyen"
 *                          → "Nguyen Vuong Thuy Ngan" · "Thuy-Ngan V. Nguyen"
 *
 * Vì vậy KHÔNG đoán mò. Ba mức, theo đúng thứ tự tin cậy:
 *
 *   1. ORCID trùng            → chắc chắn, nhưng vẫn chỉ là GỢI Ý
 *   2. Trùng một dạng tên đã đăng ký (ScholarNameVariant) → gợi ý mạnh
 *   3. Giống lỏng (cùng chữ cái đầu + chung ít nhất một từ đầy đủ) → gợi ý yếu
 *
 * Không mức nào tự gắn tên người khác vào bài. Mọi kết quả đều rơi vào
 * PublicationAuthor.claimStatus = PENDING và phải chính chủ bấm xác nhận.
 * Bài học từ đợt tự động trích email của trang nhân sự: suy đoán sai trên dữ
 * liệu thật tốn nhiều công sửa hơn hẳn việc để người dùng tự chọn.
 */

/** Bỏ dấu tiếng Việt, hạ chữ thường, bỏ dấu câu, gom khoảng trắng. */
export function normalizeName(raw: string): string {
  return String(raw ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // bo dau thanh + dau mu
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/** Ghép tên tác giả từ dạng Crossref {family, given} thành một chuỗi. */
export function joinAuthorName(a: {
  family?: string | null;
  given?: string | null;
  name?: string | null;
}): string {
  if (a.name) return String(a.name).trim();
  return [a.given, a.family].filter(Boolean).join(' ').trim();
}

type Signature = {
  /** Các từ đầy đủ (dài ≥ 2 ký tự): "nguyen", "ngan", "thuy". */
  words: Set<string>;
  /** Chữ cái đầu của MỌI từ, đã sắp xếp: "nntv". */
  initials: string;
};

export function signatureOf(name: string): Signature {
  const tokens = normalizeName(name).split(' ').filter(Boolean);
  return {
    words: new Set(tokens.filter((t) => t.length >= 2)),
    initials: tokens
      .map((t) => t[0])
      .sort()
      .join(''),
  };
}

/**
 * Giống lỏng: cùng bộ chữ cái đầu VÀ chung ít nhất một từ đầy đủ.
 *
 * "Nguyen Vuong Thuy Ngan" vs "Ngan V. T. Nguyen"
 *   initials "nntv" = "nntv", chung {nguyen, ngan} → giống.
 *
 * Vẫn có thể nhầm ("Nguyen Van Thanh Ngoc" cũng ra "nntv" và chung "nguyen").
 * Chấp nhận được vì đây chỉ là gợi ý và người bị gợi ý phải tự xác nhận.
 */
export function looselyMatches(a: string, b: string): boolean {
  const sa = signatureOf(a);
  const sb = signatureOf(b);
  if (!sa.initials || sa.initials !== sb.initials) return false;
  for (const w of sa.words) if (sb.words.has(w)) return true;
  return false;
}

export type CandidateProfile = {
  userId: string;
  orcid: string | null;
  /** Dạng tên đã đăng ký, đã chuẩn hoá. */
  normalizedVariants: string[];
  /** Tên hiển thị trong hệ thống, dùng làm dạng tên ngầm định. */
  displayName: string;
};

export type AuthorMatch = {
  authorIndex: number;
  userId: string;
  /** Vì sao khớp — hiện thẳng lên giao diện để người dùng hiểu và sửa được. */
  reason: 'orcid' | 'variant' | 'loose';
};

/**
 * Dò danh sách tác giả của một bài, tìm những người trong Khoa có mặt trong đó.
 * Mỗi tác giả chỉ khớp nhiều nhất một người, và mỗi người chỉ khớp một vị trí —
 * ưu tiên bằng chứng mạnh hơn.
 */
export function matchAuthors(
  authors: Array<{
    family?: string | null;
    given?: string | null;
    name?: string | null;
    orcid?: string | null;
  }>,
  candidates: CandidateProfile[],
): AuthorMatch[] {
  const out: AuthorMatch[] = [];
  const takenAuthor = new Set<number>();
  const takenUser = new Set<string>();

  const claim = (
    authorIndex: number,
    userId: string,
    reason: AuthorMatch['reason'],
  ) => {
    if (takenAuthor.has(authorIndex) || takenUser.has(userId)) return;
    takenAuthor.add(authorIndex);
    takenUser.add(userId);
    out.push({ authorIndex, userId, reason });
  };

  const normalizedOrcid = (v?: string | null) =>
    String(v ?? '')
      .replace(/[^0-9X]/gi, '')
      .toUpperCase();

  // 1 — ORCID.
  authors.forEach((a, i) => {
    const key = normalizedOrcid(a.orcid);
    if (!key) return;
    const hit = candidates.find((c) => normalizedOrcid(c.orcid) === key);
    if (hit) claim(i, hit.userId, 'orcid');
  });

  // 2 — trùng một dạng tên đã đăng ký.
  authors.forEach((a, i) => {
    const norm = normalizeName(joinAuthorName(a));
    if (!norm) return;
    const hit = candidates.find((c) => c.normalizedVariants.includes(norm));
    if (hit) claim(i, hit.userId, 'variant');
  });

  // 3 — giống lỏng, kể cả với tên hiển thị trong hệ thống.
  authors.forEach((a, i) => {
    const full = joinAuthorName(a);
    if (!full) return;
    const hit = candidates.find(
      (c) =>
        looselyMatches(full, c.displayName) ||
        c.normalizedVariants.some((v) => looselyMatches(full, v)),
    );
    if (hit) claim(i, hit.userId, 'loose');
  });

  return out.sort((x, y) => x.authorIndex - y.authorIndex);
}

/**
 * Sinh sẵn các dạng tên hay gặp từ tên đầy đủ tiếng Việt, để người dùng chỉ phải
 * bỏ tick những dạng họ không dùng thay vì tự gõ ra từng dạng.
 *
 * "Nguyễn Vương Thuỳ Ngân" (họ = từ đầu) →
 *   Nguyen Vuong Thuy Ngan · Ngan V. T. Nguyen · N. V. T. Nguyen
 *   Vuong Thuy Ngan Nguyen · Ngan Nguyen
 */
export function suggestNameVariants(fullNameVi: string): string[] {
  const tokens = normalizeName(fullNameVi).split(' ').filter(Boolean);
  if (tokens.length < 2) return [];

  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const family = cap(tokens[0]);
  const rest = tokens.slice(1).map(cap);
  const last = rest[rest.length - 1];
  const middle = rest.slice(0, -1);
  const mid = middle.map((w) => `${w[0]}.`).join(' ');

  const out = [
    [family, ...rest].join(' '), // Nguyen Vuong Thuy Ngan
    [last, mid, family].filter(Boolean).join(' '), // Ngan V. T. Nguyen
    [`${last[0]}.`, mid, family].filter(Boolean).join(' '), // N. V. T. Nguyen
    [...rest, family].join(' '), // Vuong Thuy Ngan Nguyen
    [last, family].join(' '), // Ngan Nguyen
  ];

  return [...new Set(out.filter((s) => s.trim().length > 1))];
}
