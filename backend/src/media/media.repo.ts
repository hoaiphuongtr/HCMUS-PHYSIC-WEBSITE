import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { MediaType } from '../generated/prisma/client';

type CreateInput = {
  name: string;
  type: MediaType;
  url: string;
  mimeType?: string | null;
  size?: number | null;
  alt?: string | null;
  createdBy: string;
  departmentId?: string | null;
};

@Injectable()
export class MediaRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateInput) {
    return this.prisma.media.create({
      data: {
        name: input.name,
        type: input.type,
        url: input.url,
        mimeType: input.mimeType ?? null,
        size: input.size ?? null,
        alt: input.alt ?? null,
        createdBy: input.createdBy,
        departmentId: input.departmentId ?? null,
      },
    });
  }

  findById(id: string) {
    return this.prisma.media.findUnique({
      where: { id },
      include: { mediaTags: { include: { tag: true } } },
    });
  }

  async findPaginated(
    params: {
      page: number;
      pageSize: number;
      search?: string;
      tagSlug?: string;
      type?: string;
    },
    scopeWhere?: Record<string, unknown>,
    departmentFilter?: Record<string, unknown>,
  ) {
    const { page, pageSize, search, tagSlug, type } = params;
    // Gộp mọi điều kiện bằng AND để chúng KHÔNG đè OR của nhau (trước đây `search`
    // ghi đè OR của scope quyền → admin bộ môn tìm kiếm thấy sai phạm vi).
    const and: Record<string, unknown>[] = [];
    if (scopeWhere) and.push(scopeWhere);
    if (departmentFilter) and.push(departmentFilter);
    if (search) {
      and.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { alt: { contains: search, mode: 'insensitive' } },
        ],
      });
    }
    if (type) and.push({ type });
    if (tagSlug) and.push({ mediaTags: { some: { tag: { slug: tagSlug } } } });
    const where: Record<string, unknown> = and.length ? { AND: and } : {};

    const [items, total] = await Promise.all([
      this.prisma.media.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { mediaTags: { include: { tag: true } } },
      }),
      this.prisma.media.count({ where }),
    ]);
    return { items, total };
  }

  update(id: string, data: { name?: string; alt?: string | null }) {
    return this.prisma.media.update({
      where: { id },
      data,
    });
  }

  delete(id: string) {
    return this.prisma.media.delete({ where: { id } });
  }

  async syncTags(mediaId: string, tagSlugs: string[]) {
    const unique = Array.from(new Set(tagSlugs));
    const tags = unique.length
      ? await this.prisma.tag.findMany({
          where: { slug: { in: unique } },
          select: { id: true },
        })
      : [];
    await this.prisma.mediaTag.deleteMany({ where: { mediaId } });
    if (tags.length) {
      await this.prisma.mediaTag.createMany({
        data: tags.map((t) => ({ mediaId, tagId: t.id })),
        skipDuplicates: true,
      });
    }
  }

  findTagsInUse(mediaWhere?: Record<string, unknown>) {
    return this.prisma.tag.findMany({
      where: mediaWhere
        ? { mediaTags: { some: { media: mediaWhere } } }
        : { mediaTags: { some: {} } },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true },
    });
  }
}
