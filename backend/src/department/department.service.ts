import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DepartmentRepository } from './department.repo';
import {
  CreateDepartmentBodyType,
  UpdateDepartmentBodyType,
} from './department.model';
import {
  DepartmentSlugExistsException,
  DepartmentNotFoundException,
} from './department.error';

@Injectable()
export class DepartmentService {
  constructor(
    private readonly departmentRepository: DepartmentRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(body: CreateDepartmentBodyType) {
    const existing = await this.departmentRepository.findBySlug(body.slug);
    if (existing) throw DepartmentSlugExistsException;
    return this.departmentRepository.create(body);
  }

  findAll() {
    return this.departmentRepository.findAll();
  }

  async findById(id: string) {
    const department = await this.departmentRepository.findById(id);
    if (!department) throw DepartmentNotFoundException;
    return department;
  }

  async update(id: string, body: UpdateDepartmentBodyType) {
    const current = await this.findById(id);
    if (body.slug && body.slug !== current.slug) {
      const existing = await this.departmentRepository.findBySlug(body.slug);
      if (existing && existing.id !== id) throw DepartmentSlugExistsException;
      // A department's page layouts live under its slug prefix
      // (vat-ly-tin-hoc/tin-tuc/...). Rewrite them so renaming the department
      // doesn't break every layout URL beneath it.
      await this.rewriteLayoutSlugPrefix(current.slug, body.slug);
    }
    return this.departmentRepository.update(id, body);
  }

  // Merge `sourceId` into `targetId`: move all users/posts/layouts to the
  // target, rewrite the source layout slug prefix to the target's, then delete
  // the now-empty source department.
  async merge(sourceId: string, targetId: string) {
    if (sourceId === targetId)
      throw new ConflictException('Không thể gộp bộ môn vào chính nó');
    const source = await this.findById(sourceId);
    const target = await this.findById(targetId);
    await this.prisma.$transaction(async (tx) => {
      await tx.user.updateMany({
        where: { departmentId: sourceId },
        data: { departmentId: targetId },
      });
      await tx.post.updateMany({
        where: { departmentId: sourceId },
        data: { departmentId: targetId },
      });
      await tx.pageLayout.updateMany({
        where: { departmentId: sourceId },
        data: { departmentId: targetId },
      });
    });
    await this.rewriteLayoutSlugPrefix(source.slug, target.slug);
    await this.prisma.department.delete({ where: { id: sourceId } });
    return target;
  }

  // Rewrite "<from>/..." → "<to>/..." across PageLayout slugs, skipping rows
  // whose rewritten slug would collide with an existing one.
  private async rewriteLayoutSlugPrefix(from: string, to: string) {
    if (from === to) return;
    await this.prisma.$executeRawUnsafe(
      `UPDATE "PageLayout" AS pl
         SET slug = $1 || substring(pl.slug from ${from.length + 1})
       WHERE pl.slug LIKE $2
         AND NOT EXISTS (
           SELECT 1 FROM "PageLayout" p2
           WHERE p2.slug = $1 || substring(pl.slug from ${from.length + 1})
         )`,
      to,
      `${from}/%`,
    );
  }
}
