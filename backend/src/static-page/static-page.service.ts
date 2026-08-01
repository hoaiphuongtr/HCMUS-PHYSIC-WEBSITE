import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { dirname, join, normalize, sep } from 'path';
import AdmZip from 'adm-zip';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateStaticPageBodyType,
  UpdateStaticPageBodyType,
} from './static-page.model';

const UPLOADS_DIR = join(process.cwd(), 'uploads');
const SITES_SUBDIR = 'static-sites';

// Case-PRESERVING slug: event slugs like "ICEBA2026" should stay uppercase, so
// (unlike the site-wide toSlug) we keep letter case. Strip diacritics + replace
// anything that isn't a letter/digit with a hyphen. Matching is case-insensitive.
const normSlug = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

@Injectable()
export class StaticPageService {
  constructor(private readonly prisma: PrismaService) {}

  // Admin: list without the heavy html blob.
  async list() {
    return this.prisma.staticPage.findMany({
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        slug: true,
        title: true,
        renderMode: true,
        bundlePath: true,
        isPublished: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findById(id: string) {
    const page = await this.prisma.staticPage.findUnique({ where: { id } });
    if (!page) throw new NotFoundException('Static page not found');
    return page;
  }

  // Public: slugs of all published pages — the site middleware uses this to
  // rewrite ONLY real static pages to a clean top-level URL (leaving every other
  // route untouched).
  async publishedSlugs() {
    const rows = await this.prisma.staticPage.findMany({
      where: { isPublished: true },
      select: { slug: true },
    });
    return rows.map((r) => r.slug);
  }

  // Public: published folder-microsite pages → { slug, bundlePath }. The site
  // middleware proxies /<slug>/* straight to the extracted files so absolute-path
  // exports (Next.js etc.) work dynamically at a clean URL — no per-site config.
  async publishedBundles() {
    return this.prisma.staticPage.findMany({
      where: { isPublished: true, NOT: { bundlePath: null } },
      select: { slug: true, bundlePath: true },
    });
  }

  // Public: resolve a published page by slug (used by the site catch-all).
  async findPublishedBySlug(slug: string) {
    // Case-insensitive so /ICEBA2026 and /iceba2026 resolve to the same page.
    const page = await this.prisma.staticPage.findFirst({
      where: { slug: { equals: slug, mode: 'insensitive' }, isPublished: true },
    });
    if (!page) throw new NotFoundException('Static page not found');
    return page;
  }

  private async assertSlugFree(slug: string, exceptId?: string) {
    const other = await this.prisma.staticPage.findFirst({
      where: {
        slug: { equals: slug, mode: 'insensitive' },
        ...(exceptId ? { id: { not: exceptId } } : {}),
      },
      select: { id: true },
    });
    if (other) throw new ConflictException('Slug đã tồn tại');
  }

  async create(body: CreateStaticPageBodyType, createdBy?: string | null) {
    const slug = normSlug(body.slug || body.title);
    if (!slug) throw new ConflictException('Slug không hợp lệ');
    await this.assertSlugFree(slug);
    return this.prisma.staticPage.create({
      data: {
        slug,
        title: body.title,
        html: body.html,
        renderMode: body.renderMode,
        isPublished: body.isPublished,
        createdBy: createdBy ?? null,
      },
    });
  }

  async update(id: string, body: UpdateStaticPageBodyType) {
    await this.findById(id);
    const data: {
      slug?: string;
      title?: string;
      html?: string;
      renderMode?: string;
      isPublished?: boolean;
    } = {};
    if (body.slug !== undefined) {
      const slug = normSlug(body.slug);
      if (!slug) throw new ConflictException('Slug không hợp lệ');
      await this.assertSlugFree(slug, id);
      data.slug = slug;
    }
    if (body.title !== undefined) data.title = body.title;
    if (body.html !== undefined) data.html = body.html;
    if (body.renderMode !== undefined) data.renderMode = body.renderMode;
    if (body.isPublished !== undefined) data.isPublished = body.isPublished;
    return this.prisma.staticPage.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.staticPage.delete({ where: { id } });
    // Clean up any extracted bundle folder.
    rmSync(join(UPLOADS_DIR, SITES_SUBDIR, id), {
      recursive: true,
      force: true,
    });
    return { ok: true };
  }

  /**
   * Extract an uploaded .zip (a folder microsite: index.html + assets) under the
   * persistent uploads volume and point the page's bundlePath at its index.html.
   * The served folder keeps relative asset links working. Guards against zip-slip.
   */
  async uploadBundle(id: string, file?: Express.Multer.File) {
    const page = await this.findById(id);
    if (!file?.path) throw new BadRequestException('Thiếu file .zip');

    try {
      const destAbs = join(UPLOADS_DIR, SITES_SUBDIR, id);
      rmSync(destAbs, { recursive: true, force: true });
      mkdirSync(destAbs, { recursive: true });

      let zip: AdmZip;
      try {
        zip = new AdmZip(file.path);
      } catch {
        throw new BadRequestException('File .zip không hợp lệ');
      }

      let indexEntry: string | null = null;
      for (const entry of zip.getEntries()) {
        if (entry.isDirectory) continue;
        // strip leading ../ and reject anything escaping the destination (zip-slip)
        const rel = normalize(entry.entryName).replace(/^(\.\.[/\\])+/, '');
        const target = join(destAbs, rel);
        if (target !== destAbs && !target.startsWith(destAbs + sep)) continue;
        mkdirSync(dirname(target), { recursive: true });
        writeFileSync(target, entry.getData());
        const posix = rel.split(sep).join('/');
        if (/(^|\/)index\.html$/i.test(posix)) {
          // prefer the shallowest index.html
          if (indexEntry === null || posix.length < indexEntry.length)
            indexEntry = posix;
        }
      }

      if (!indexEntry) {
        rmSync(destAbs, { recursive: true, force: true });
        throw new BadRequestException(
          'Không tìm thấy index.html trong file .zip',
        );
      }

      // Inject <base href="/<slug>/"> so RELATIVE-path builds (CRA homepage:'.',
      // Vite base:'./', Astro, plain HTML) resolve their assets under /<slug>/
      // no matter the trailing slash — no redirect needed, no loop. Absolute-path
      // builds (Next basePath) ignore <base>, so they keep working too.
      try {
        const indexAbs = join(destAbs, ...indexEntry.split('/'));
        let html = readFileSync(indexAbs, 'utf8');
        if (!/<base\s/i.test(html)) {
          html = html.replace(
            /<head(\s[^>]*)?>/i,
            (m) => `${m}<base href="/${page.slug}/">`,
          );
          writeFileSync(indexAbs, html);
        }
      } catch {
        // non-fatal: absolute-path builds don't need the base tag
      }

      const bundlePath = `/uploads/${SITES_SUBDIR}/${id}/${indexEntry}`;
      return await this.prisma.staticPage.update({
        where: { id },
        data: { bundlePath },
      });
    } finally {
      // always remove the temp upload, whether extraction succeeded or not
      rmSync(file.path, { force: true });
    }
  }
}
