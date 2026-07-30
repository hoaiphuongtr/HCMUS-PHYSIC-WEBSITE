import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateStaticPageBodyType,
  UpdateStaticPageBodyType,
} from './static-page.model';
import { toSlug } from '../shared/helpers';

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

  // Public: resolve a published page by slug (used by the site catch-all).
  async findPublishedBySlug(slug: string) {
    const page = await this.prisma.staticPage.findUnique({ where: { slug } });
    if (!page || !page.isPublished)
      throw new NotFoundException('Static page not found');
    return page;
  }

  private async assertSlugFree(slug: string, exceptId?: string) {
    const other = await this.prisma.staticPage.findFirst({
      where: { slug, ...(exceptId ? { id: { not: exceptId } } : {}) },
      select: { id: true },
    });
    if (other) throw new ConflictException('Slug đã tồn tại');
  }

  async create(body: CreateStaticPageBodyType, createdBy?: string | null) {
    const slug = toSlug(body.slug || body.title);
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
      const slug = toSlug(body.slug);
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
    return { ok: true };
  }
}
