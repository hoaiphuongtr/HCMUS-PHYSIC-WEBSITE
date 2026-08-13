/**
 * parse-legacy-postslang.mjs — bóc bản dịch bài viết từ dump MariaDB.
 *
 * Đọc bảng `postslang` trong dump/legacy.sql, gom theo postid:
 *   { [postid]: { vi:{title,content,excerpt}, en:{title,content,excerpt} } }
 * (langid 1 = Việt, 2 = Anh — theo bảng `language`).
 *
 * Ghi ra _post_lang.json để recover-post-english.ts dùng. CHỈ ĐỌC FILE, không DB.
 *   node initialScript/migrate-legacy/parse-legacy-postslang.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(here, 'dump', 'legacy.sql'), 'latin1'); // đọc raw, giải mã utf8 sau

// mysqldump escape: \n \r \t \0 \b \Z \\ \' \"
const ESC = { n: '\n', r: '\r', t: '\t', 0: '\0', b: '\b', Z: '\x1a', '\\': '\\', "'": "'", '"': '"' };

// Parse danh sách tuple "(...),(...)" bắt đầu tại vị trí after, dừng ở ';' top-level.
function* parseTuples(s, start) {
  let i = start;
  const n = s.length;
  while (i < n) {
    while (i < n && s[i] !== '(' && s[i] !== ';') i++;
    if (i >= n || s[i] === ';') return i;
    i++; // skip (
    const row = [];
    let field = '';
    let quoted = false;
    let inStr = false;
    while (i < n) {
      const c = s[i];
      if (inStr) {
        if (c === '\\') {
          const nx = s[i + 1];
          field += ESC[nx] ?? nx;
          i += 2;
          continue;
        }
        if (c === "'") { inStr = false; i++; continue; }
        field += c;
        i++;
      } else {
        if (c === "'") { inStr = true; quoted = true; i++; continue; }
        if (c === ',') { row.push(quoted ? field : field.trim()); field = ''; quoted = false; i++; continue; }
        if (c === ')') { row.push(quoted ? field : field.trim()); i++; break; }
        field += c;
        i++;
      }
    }
    yield row;
  }
  return i;
}

const MARKER = 'INSERT INTO `postslang` VALUES ';
const byPost = new Map();
let rows = 0;
let idx = sql.indexOf(MARKER);
while (idx !== -1) {
  const it = parseTuples(sql, idx + MARKER.length);
  let r = it.next();
  while (!r.done) {
    const row = r.value; // [id, postid, langid, title, content, excerpt]
    const postid = Number.parseInt(row[1], 10);
    const langid = Number.parseInt(row[2], 10);
    if (Number.isFinite(postid) && (langid === 1 || langid === 2)) {
      const dec = (v) => (v == null || v === 'NULL' ? '' : Buffer.from(v, 'latin1').toString('utf8'));
      const rec = { title: dec(row[3]), content: dec(row[4]), excerpt: dec(row[5]) };
      const e = byPost.get(postid) ?? {};
      e[langid === 1 ? 'vi' : 'en'] = rec;
      byPost.set(postid, e);
      rows++;
    }
    r = it.next();
  }
  idx = sql.indexOf(MARKER, idx + MARKER.length);
}

const out = Object.fromEntries(byPost);
writeFileSync(join(here, '_post_lang.json'), JSON.stringify(out), 'utf8');

// Thống kê
let withEn = 0, enHasTitle = 0, enTitleDiff = 0, enHasBody = 0, enBodyDiff = 0;
for (const e of byPost.values()) {
  if (!e.en) continue;
  withEn++;
  const enT = (e.en.title ?? '').trim();
  const viT = (e.vi?.title ?? '').trim();
  if (enT) enHasTitle++;
  if (enT && enT !== viT) enTitleDiff++;
  const enB = (e.en.content ?? '').trim();
  const viB = (e.vi?.content ?? '').trim();
  if (enB) enHasBody++;
  if (enB && enB !== viB) enBodyDiff++;
}
console.log(`Đã parse ${rows} dòng postslang / ${byPost.size} bài.`);
console.log(`Có bản EN: ${withEn}`);
console.log(`  EN có tiêu đề: ${enHasTitle}  (khác VN: ${enTitleDiff})`);
console.log(`  EN có thân bài: ${enHasBody}  (khác VN: ${enBodyDiff})`);
console.log(`-> _post_lang.json`);
