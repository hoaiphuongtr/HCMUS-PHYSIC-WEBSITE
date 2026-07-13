// Nén kho ảnh legacy: ảnh > 300KB được thu về tối đa 1600px và nén lại (giữ nguyên định dạng, ghi đè tại chỗ).
import { readdir, stat, rename, unlink } from "node:fs/promises";
import { join, extname } from "node:path";
import sharp from "sharp";

const ROOT = new URL("../../uploads/legacy", import.meta.url).pathname;
const MAX_W = 1600, MIN_BYTES = 300 * 1024;
let done = 0, saved = 0, skipped = 0, failed = 0;

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else yield p;
  }
}

const files = [];
for await (const p of walk(ROOT)) {
  const ext = extname(p).toLowerCase();
  if (![".jpg", ".jpeg", ".png"].includes(ext)) continue;
  const s = await stat(p);
  if (s.size >= MIN_BYTES) files.push([p, s.size, ext]);
}
console.log("cần xử lý:", files.length, "ảnh");

for (const [p, size, ext] of files) {
  try {
    const img = sharp(p, { failOn: "none" }).rotate();
    const meta = await img.metadata();
    let pipe = img;
    if ((meta.width || 0) > MAX_W) pipe = pipe.resize({ width: MAX_W, withoutEnlargement: true });
    pipe = ext === ".png"
      ? pipe.png({ compressionLevel: 9, palette: !meta.hasAlpha, quality: 85 })
      : pipe.jpeg({ quality: 78, mozjpeg: true });
    const tmp = p + ".tmp";
    await pipe.toFile(tmp);
    const ns = await stat(tmp);
    if (ns.size < size * 0.92) { await rename(tmp, p); saved += size - ns.size; done++; }
    else { await unlink(tmp); skipped++; }
  } catch (e) { failed++; }
  if ((done + skipped + failed) % 200 === 0)
    console.log(`  ...${done + skipped + failed}/${files.length} (tiết kiệm ${(saved / 1048576).toFixed(0)}MB)`);
}
console.log(`XONG: nén ${done}, giữ nguyên ${skipped}, lỗi ${failed}, tiết kiệm ${(saved / 1048576).toFixed(0)}MB`);
