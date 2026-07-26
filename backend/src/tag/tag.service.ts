import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTagBodyType, UpdateTagBodyType } from './tag.model';
import { toSlug } from '../shared/helpers';

@Injectable()
export class TagService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const tags = await this.prisma.tag.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { postTags: true } } },
    });
    return tags.map(({ _count, ...t }) => ({ ...t, postCount: _count.postTags }));
  }

  async findById(id: string) {
    const tag = await this.prisma.tag.findUnique({ where: { id } });
    if (!tag) throw new NotFoundException('Tag not found');
    return tag;
  }

  async create(body: CreateTagBodyType) {
    const slug = toSlug(body.slug || body.name);
    const conflict = await this.prisma.tag.findFirst({
      where: { OR: [{ slug }, { name: body.name }] },
    });
    if (conflict) throw new ConflictException('Tag đã tồn tại');
    return this.prisma.tag.create({
      data: { name: body.name, slug, icon: body.icon ?? null },
    });
  }

  async update(id: string, body: UpdateTagBodyType) {
    await this.findById(id);
    const data: { name?: string; slug?: string; icon?: string | null } = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.slug !== undefined) data.slug = toSlug(body.slug);
    if (body.icon !== undefined) data.icon = body.icon;
    const orConds: Array<{ slug: string } | { name: string }> = [];
    if (data.slug) orConds.push({ slug: data.slug });
    if (data.name) orConds.push({ name: data.name });
    if (orConds.length) {
      const other = await this.prisma.tag.findFirst({
        where: { id: { not: id }, OR: orConds },
      });
      if (other) throw new ConflictException('Tag đã tồn tại');
    }
    return this.prisma.tag.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findById(id);
    // PostTag rows cascade-delete, detaching the tag from any posts.
    return this.prisma.tag.delete({ where: { id } });
  }

  // Merge `id` into `targetId`: move post links to the target (skipping dups),
  // then delete the source tag. Used when consolidating duplicate tags.
  async merge(id: string, targetId: string) {
    if (id === targetId)
      throw new ConflictException('Không thể gộp tag vào chính nó');
    await this.findById(id);
    const target = await this.findById(targetId);
    const links = await this.prisma.postTag.findMany({
      where: { tagId: id },
      select: { postId: true },
    });
    await this.prisma.$transaction(async (tx) => {
      for (const { postId } of links) {
        const exists = await tx.postTag.findUnique({
          where: { postId_tagId: { postId, tagId: targetId } },
        });
        if (!exists) {
          await tx.postTag.create({ data: { postId, tagId: targetId } });
        }
      }
      await tx.postTag.deleteMany({ where: { tagId: id } });
      await tx.tag.delete({ where: { id } });
    });
    return target;
  }
}
