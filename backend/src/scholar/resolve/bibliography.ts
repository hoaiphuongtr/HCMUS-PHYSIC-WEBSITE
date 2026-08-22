/**
 * Đọc file thư mục tham khảo người dùng tải lên: BibTeX (.bib), RIS (.ris /
 * .txt — Mendeley, Zotero, EndNote, Scopus, Web of Science đều xuất được),
 * và CSL-JSON (Zotero).
 *
 * Vì sao tự viết thay vì kéo thư viện: cả ba định dạng ở đây chỉ cần đọc, không
 * cần ghi; và mỗi phụ thuộc mới đều phải cài được trong container backend. Ba
 * bộ đọc này gói gọn trong một file, không có phụ thuộc ngoài.
 *
 * Nguyên tắc: đọc được tới đâu lấy tới đó. Một mục thiếu DOI vẫn trả về để người
 * dùng tự bổ sung — chặn ở đây chỉ tổ làm mất công nhập.
 */
import {
  asArr,
  asObj,
  asStr,
  dateParts,
  firstStr,
  normalizeArxiv,
  normalizeDoi,
  normalizeIsbn,
  normalizeIssn,
  parseMonth,
  parseYear,
  type ResolvedAuthor,
  type ResolvedWork,
} from './work';

// ── Dọn LaTeX ───────────────────────────────────────────────────────────────
/** Bỏ ngoặc nhóm và các lệnh dấu của LaTeX: {\"o} → o, \'{e} → e, {Ti}tle → Title. */
function deLatex(input: string): string {
  return input
    .replace(/\\[`'"^~=.]\s*\{?([A-Za-z])\}?/g, '$1')
    .replace(/\\[a-zA-Z]+\s*/g, '')
    .replace(/[{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** "Nguyen, Ngan V. T." hoặc "Ngan V. T. Nguyen" → {family, given}. */
function parseAuthorName(raw: string): ResolvedAuthor {
  const s = deLatex(raw);
  if (!s) return { name: '' };
  if (s.includes(',')) {
    const [family, ...rest] = s.split(',');
    return { family: family.trim(), given: rest.join(',').trim() || null };
  }
  const parts = s.split(/\s+/);
  if (parts.length === 1) return { family: parts[0], given: null };
  return {
    family: parts[parts.length - 1],
    given: parts.slice(0, -1).join(' '),
  };
}

// ── BibTeX ──────────────────────────────────────────────────────────────────
const BIBTEX_TYPE: Record<string, string> = {
  article: 'journal-article',
  inproceedings: 'proceedings-article',
  conference: 'proceedings-article',
  proceedings: 'proceedings-article',
  incollection: 'book-chapter',
  inbook: 'book-chapter',
  book: 'book',
  booklet: 'book',
  phdthesis: 'thesis',
  mastersthesis: 'thesis',
  patent: 'patent',
  techreport: 'report',
  misc: 'other',
  unpublished: 'other',
};

/** Cắt từ vị trí mở ngoặc tới ngoặc đóng cân đối tương ứng. */
function sliceBalanced(
  text: string,
  openAt: number,
): { body: string; end: number } {
  let depth = 0;
  for (let i = openAt; i < text.length; i += 1) {
    if (text[i] === '{') depth += 1;
    else if (text[i] === '}') {
      depth -= 1;
      if (depth === 0) return { body: text.slice(openAt + 1, i), end: i };
    }
  }
  return { body: text.slice(openAt + 1), end: text.length };
}

/** Tách "key = value" trong thân một mục BibTeX. */
function parseBibFields(body: string): Record<string, string> {
  const out: Record<string, string> = {};
  let i = body.indexOf(',');
  if (i === -1) return out;
  i += 1;

  while (i < body.length) {
    const eq = body.indexOf('=', i);
    if (eq === -1) break;
    const key = body.slice(i, eq).replace(/[,\s]/g, '').toLowerCase();
    let j = eq + 1;
    while (j < body.length && /\s/.test(body[j])) j += 1;

    let value = '';
    if (body[j] === '{') {
      const { body: inner, end } = sliceBalanced(body, j);
      value = inner;
      j = end + 1;
    } else if (body[j] === '"') {
      const end = body.indexOf('"', j + 1);
      value = body.slice(j + 1, end === -1 ? body.length : end);
      j = (end === -1 ? body.length : end) + 1;
    } else {
      const end = body.indexOf(',', j);
      value = body.slice(j, end === -1 ? body.length : end);
      j = (end === -1 ? body.length : end) + 1;
    }
    if (key) out[key] = deLatex(value);
    const comma = body.indexOf(',', j - 1);
    i = comma === -1 ? body.length : comma + 1;
  }
  return out;
}

export function parseBibtex(text: string): ResolvedWork[] {
  const out: ResolvedWork[] = [];
  const re = /@(\w+)\s*\{/g;
  let m: RegExpExecArray | null;

  while ((m = re.exec(text)) !== null) {
    const kind = m[1].toLowerCase();
    if (kind === 'comment' || kind === 'preamble' || kind === 'string')
      continue;
    const { body, end } = sliceBalanced(text, re.lastIndex - 1);
    re.lastIndex = end;

    const f = parseBibFields(body);
    const title = f.title ?? f.booktitle;
    if (!title) continue;

    const authors = (f.author ?? f.editor ?? '')
      .split(/\s+and\s+/i)
      .map((s) => s.trim())
      .filter(Boolean)
      .map(parseAuthorName);

    out.push({
      doi: normalizeDoi(f.doi),
      arxivId: normalizeArxiv(f.eprint ?? f.archiveprefix ?? f.url),
      isbn: normalizeIsbn(f.isbn),
      issn: normalizeIssn(f.issn),
      type: BIBTEX_TYPE[kind] ?? 'other',
      title,
      containerTitle: f.journal ?? f.booktitle ?? f.series ?? null,
      volume: f.volume ?? null,
      issue: f.number ?? f.issue ?? null,
      pages: f.pages ? f.pages.replace(/--/g, '–') : null,
      publisher: f.publisher ?? f.school ?? f.institution ?? null,
      url: f.url ?? null,
      publishedYear: parseYear(f.year ?? f.date),
      publishedMonth: parseMonth(f.month) ?? monthFromDate(f.date),
      authors: authors.map((a, i) => ({
        ...a,
        sequence: i === 0 ? 'first' : 'additional',
      })),
      source: 'bibtex',
      raw: f,
    });
  }
  return out;
}

function monthFromDate(date?: string | null): number | null {
  if (!date) return null;
  const m = String(date).match(/^\s*\d{4}[-/](\d{1,2})/);
  return m ? parseMonth(m[1]) : null;
}

// ── RIS ─────────────────────────────────────────────────────────────────────
const RIS_TYPE: Record<string, string> = {
  JOUR: 'journal-article',
  CPAPER: 'proceedings-article',
  CONF: 'proceedings-article',
  CHAP: 'book-chapter',
  BOOK: 'book',
  EBOOK: 'book',
  PAT: 'patent',
  THES: 'thesis',
  RPRT: 'report',
  GEN: 'other',
};

export function parseRis(text: string): ResolvedWork[] {
  const out: ResolvedWork[] = [];
  let cur: Record<string, string[]> | null = null;

  const flush = () => {
    if (!cur) return;
    const first = (k: string) => cur?.[k]?.[0] ?? null;
    const pick = (...keys: string[]) => {
      for (const k of keys) {
        const v = first(k);
        if (v) return v;
      }
      return null;
    };

    const title = pick('TI', 'T1', 'BT');
    if (title) {
      const names = [...(cur.AU ?? []), ...(cur.A1 ?? []), ...(cur.A2 ?? [])];
      const start = pick('SP');
      const endPage = pick('EP');
      out.push({
        doi: normalizeDoi(pick('DO', 'DI')),
        arxivId: normalizeArxiv(pick('UR', 'AN')),
        isbn: normalizeIsbn(pick('SN')),
        issn: normalizeIssn(pick('SN')),
        type: RIS_TYPE[pick('TY') ?? 'GEN'] ?? 'other',
        title,
        containerTitle: pick('JO', 'JF', 'JA', 'T2', 'BT'),
        volume: pick('VL'),
        issue: pick('IS'),
        pages: start ? (endPage ? `${start}–${endPage}` : start) : null,
        publisher: pick('PB'),
        url: pick('UR'),
        publishedYear: parseYear(pick('PY', 'Y1', 'DA')),
        publishedMonth: monthFromRisDate(
          pick('DA') ?? pick('PY') ?? pick('Y1'),
        ),
        authors: names.map((n, i) => ({
          ...parseAuthorName(n),
          sequence: i === 0 ? ('first' as const) : ('additional' as const),
        })),
        source: 'ris',
        raw: cur,
      });
    }
    cur = null;
  };

  for (const line of String(text).split(/\r?\n/)) {
    const m = line.match(/^([A-Z][A-Z0-9])\s{2}-\s?(.*)$/);
    if (!m) {
      // Dòng nối tiếp của trường trước đó (tóm tắt dài hay bị xuống dòng).
      continue;
    }
    const [, tag, value] = m;
    if (tag === 'TY') {
      flush();
      cur = {};
    }
    if (!cur) cur = {};
    if (tag === 'ER') {
      flush();
      continue;
    }
    (cur[tag] ??= []).push(value.trim());
  }
  flush();
  return out;
}

/** RIS ghi ngày kiểu "2024/05/15/" hoặc "2024///". */
function monthFromRisDate(v?: string | null): number | null {
  if (!v) return null;
  const m = String(v).match(/^\s*\d{4}\/(\d{1,2})/);
  return m ? parseMonth(m[1]) : null;
}

// ── CSL-JSON (Zotero) ───────────────────────────────────────────────────────
const CSL_TYPE: Record<string, string> = {
  'article-journal': 'journal-article',
  'paper-conference': 'proceedings-article',
  chapter: 'book-chapter',
  book: 'book',
  patent: 'patent',
  thesis: 'thesis',
  report: 'report',
};

export function parseCslJson(text: string): ResolvedWork[] {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return [];
  }
  const rows = Array.isArray(data) ? data : [data];

  return rows.flatMap((row): ResolvedWork[] => {
    const r = asObj(row);
    const title = firstStr(r.title);
    if (!title) return [];
    const parts = dateParts(r.issued);

    return [
      {
        doi: normalizeDoi(asStr(r.DOI) ?? asStr(r.doi)),
        arxivId: normalizeArxiv(asStr(r.URL)),
        isbn: normalizeIsbn(firstStr(r.ISBN)),
        issn: normalizeIssn(firstStr(r.ISSN)),
        type: CSL_TYPE[asStr(r.type) ?? ''] ?? 'other',
        title,
        containerTitle: firstStr(r['container-title']),
        volume: asStr(r.volume),
        issue: asStr(r.issue),
        pages: asStr(r.page),
        publisher: asStr(r.publisher),
        url: asStr(r.URL),
        publishedYear: parseYear(asStr(parts[0])),
        publishedMonth: parseMonth(asStr(parts[1])),
        authors: asArr(r.author).map((raw, i) => {
          const a = asObj(raw);
          return {
            family: asStr(a.family),
            given: asStr(a.given),
            name: asStr(a.literal),
            sequence: i === 0 ? ('first' as const) : ('additional' as const),
          };
        }),
        source: 'csl-json',
        raw: r,
      },
    ];
  });
}

/**
 * Đoán định dạng rồi đọc. Người dùng chỉ việc kéo file vào, không phải khai đây
 * là .bib hay .ris.
 */
export function parseBibliographyFile(text: string): ResolvedWork[] {
  const head = text.slice(0, 4000);
  if (/^\s*[[{]/.test(head)) {
    const csl = parseCslJson(text);
    if (csl.length) return csl;
  }
  if (/^\s*TY\s{2}-\s/m.test(head)) return parseRis(text);
  if (/@\w+\s*\{/.test(head)) return parseBibtex(text);
  // Không nhận ra thì thử lần lượt — một số file RIS mở đầu bằng dòng trống hoặc
  // BOM khiến kiểm tra ở trên trượt.
  return parseRis(text).length ? parseRis(text) : parseBibtex(text);
}
