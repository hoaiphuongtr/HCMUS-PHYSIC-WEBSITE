import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWidgetBodyType, UpdateWidgetBodyType } from './widget.model';
import { WidgetCategory } from '../generated/prisma/client';

@Injectable()
export class WidgetRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateWidgetBodyType) {
    return this.prisma.widget.create({
      data: {
        type: data.type,
        name: data.name,
        description: data.description,
        category: data.category as WidgetCategory,
        icon: data.icon,
        configSchema: data.configSchema,
        defaultConfig: data.defaultConfig ?? {},
      },
    });
  }

  findByType(type: string) {
    return this.prisma.widget.findUnique({ where: { type } });
  }

  findById(id: string) {
    return this.prisma.widget.findUnique({ where: { id } });
  }

  findAll(filters?: { category?: WidgetCategory; isActive?: boolean }) {
    return this.prisma.widget.findMany({
      where: {
        ...(filters?.category && { category: filters.category }),
        ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  update(id: string, data: UpdateWidgetBodyType) {
    const { configSchema, defaultConfig, category, ...rest } = data;
    return this.prisma.widget.update({
      where: { id },
      data: {
        ...rest,
        ...(category && { category: category as WidgetCategory }),
        ...(configSchema !== undefined && {
          configSchema: configSchema,
        }),
        ...(defaultConfig !== undefined && {
          defaultConfig: defaultConfig,
        }),
      },
    });
  }

  softDelete(id: string) {
    return this.prisma.widget.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
