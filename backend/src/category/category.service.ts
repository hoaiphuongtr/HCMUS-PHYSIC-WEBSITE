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

  async create(body: CreateCategoryBodyType) {
    const conflict = await this.prisma.category.findUnique({
      where: { slug: body.slug },
    });
    if (conflict) throw new ConflictException('Slug đã tồn tại');
    return this.prisma.category.create({
      data: {
        slug: body.slug,
        name: body.name,
        excerpt: body.excerpt ?? undefined,
        image: body.image ?? null,
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
