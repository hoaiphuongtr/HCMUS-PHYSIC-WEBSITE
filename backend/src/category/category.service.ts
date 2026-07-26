import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCategoryBodyType,
  UpdateCategoryBodyType,
} from './category.model';
import type { InputJsonValue } from '../generated/prisma/internal/prismaNamespace';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.category.findMany({
      where: { status: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findById(id: string) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Category not found');
    return cat;
  }

  async create(body: CreateCategoryBodyType, userId: string) {
    const conflict = await this.prisma.category.findUnique({
      where: { slug: body.slug },
    });
    if (conflict) throw new ConflictException('Slug đã tồn tại');
    const category = await this.prisma.category.create({
      data: {
        slug: body.slug,
        name: body.name,
        excerpt: body.excerpt ?? undefined,
        image: body.image ?? null,
      },
    });
    // Auto-provision a post template for the new category by copying the design
    // of an existing template and just re-pointing it at this category. Best
    // effort — a failure here must not fail category creation.
    await this.createCategoryTemplate(category, userId).catch(() => undefined);
    return category;
  }

  // Clone the newest existing post template (placeholder blocks only, no real
  // content) into an unpublished "Mẫu — <category>" layout for the picker.
  private async createCategoryTemplate(
    category: { id: string; slug: string; name: unknown },
    userId: string,
  ) {
    // Prefer the canonical placeholder template; fall back to any existing
    // category template if the canonical one is missing.
    const base =
      (await this.prisma.pageLayout.findFirst({
        where: { slug: '__post-template-default' },
        select: { puckData: true },
      })) ??
      (await this.prisma.pageLayout.findFirst({
        where: { categoryId: { not: null }, sourcePostId: null },
        orderBy: { updatedAt: 'desc' },
        select: { puckData: true },
      }));
    if (!base?.puckData) return;
    const nameVi =
      (category.name as { vi?: string } | null)?.vi ?? category.slug;
    await this.prisma.pageLayout.create({
      data: {
        name: `Layout mẫu — ${nameVi}`,
        // Same slug convention as the existing per-category templates. Slug is
        // not unique in the DB and the template stays unpublished, so it never
        // collides with the category's public page.
        slug: category.slug,
        categoryId: category.id,
        isPublished: false,
        puckData: base.puckData as InputJsonValue,
        createdBy: userId,
      },
    });
  }

  async update(id: string, body: UpdateCategoryBodyType) {
    await this.findById(id);
    if (body.slug) {
      const other = await this.prisma.category.findUnique({
        where: { slug: body.slug },
      });
      if (other && other.id !== id)
        throw new ConflictException('Slug đã tồn tại');
    }
    return this.prisma.category.update({
      where: { id },
      data: {
        slug: body.slug,
        name: body.name,
        excerpt: body.excerpt,
        image: body.image,
        status: body.status,
      },
    });
  }

  async remove(id: string) {
    await this.findById(id);
    const postCount = await this.prisma.post.count({
      where: { categoryId: id },
    });
    if (postCount > 0) {
      throw new ConflictException(
        `Không xoá được — còn ${postCount} bài đăng trong category`,
      );
    }
    return this.prisma.category.delete({ where: { id } });
  }
}
