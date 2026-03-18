import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateDepartmentBodyType,
  UpdateDepartmentBodyType,
} from './department.model';

@Injectable()
export class DepartmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateDepartmentBodyType) {
    return this.prisma.department.create({ data });
  }

  findBySlug(slug: string) {
    return this.prisma.department.findUnique({ where: { slug } });
  }

  findById(id: string) {
    return this.prisma.department.findUnique({ where: { id } });
  }

  findAll() {
    return this.prisma.department.findMany({ orderBy: { name: 'asc' } });
  }

  update(id: string, data: UpdateDepartmentBodyType) {
    return this.prisma.department.update({ where: { id }, data });
  }
}
