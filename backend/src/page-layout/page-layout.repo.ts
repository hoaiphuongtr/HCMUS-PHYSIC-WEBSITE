import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePageLayoutBodyType,
  UpdatePageLayoutBodyType,
  AddWidgetInstanceBodyType,
  UpdateWidgetInstanceBodyType,
} from './page-layout.model';
import {
  InputJsonValue,
  JsonValue,
  NullableJsonNullValueInput,
} from 'src/generated/prisma/internal/prismaNamespace';

const widgetInclude = {
  widget: {
    select: {
      id: true,
      type: true,
      name: true,
      icon: true,
      configSchema: true,
      defaultConfig: true,
    },
  },
} as const;

@Injectable()
export class PageLayoutRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreatePageLayoutBodyType & { createdBy: string }) {
    return this.prisma.pageLayout.create({ data });
  }

  findBySlug(slug: string) {
    return this.prisma.pageLayout.findUnique({
      where: { slug },
      include: {
        widgets: {
          include: widgetInclude,
          orderBy: [{ row: 'asc' }, { order: 'asc' }],
          where: { widget: { isActive: true } },
        },
      },
    });
  }

  findById(id: string) {
    return this.prisma.pageLayout.findUnique({
      where: { id },
      include: {
        widgets: {
          include: widgetInclude,
          orderBy: [{ row: 'asc' }, { order: 'asc' }],
        },
      },
    });
  }

  findAll() {
    return this.prisma.pageLayout.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { widgets: true } } },
    });
  }

  update(id: string, data: UpdatePageLayoutBodyType) {
    return this.prisma.pageLayout.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.pageLayout.delete({ where: { id } });
  }

  async publish(id: string) {
    const layout = await this.prisma.pageLayout.findUnique({
      where: { id },
      select: { puckData: true },
    });
    return this.prisma.pageLayout.update({
      where: { id },
      data: {
        isPublished: true,
        publishedAt: new Date(),
        scheduledAt: null,
        publishedPuckData: layout?.puckData ?? undefined,
      },
    });
  }

  scheduleManyPublish(ids: string[], scheduledAt: Date) {
    return this.prisma.pageLayout.updateMany({
      where: { id: { in: ids } },
      data: { isPublished: false, scheduledAt },
    });
  }

  unpublish(id: string) {
    return this.prisma.pageLayout.update({
      where: { id },
      data: { isPublished: false, scheduledAt: null },
    });
  }

  findDueForPublish(now: Date) {
    return this.prisma.pageLayout.findMany({
      where: {
        isPublished: false,
        scheduledAt: { not: null, lte: now },
      },
      select: { id: true },
    });
  }

  addWidgetInstance(pageLayoutId: string, data: AddWidgetInstanceBodyType) {
    return this.prisma.widgetInstance.create({
      data: {
        pageLayoutId,
        widgetId: data.widgetId,
        config: data.config ?? {},
        order: data.order,
        row: data.row ?? 0,
        colSpan: data.colSpan ?? 12,
      },
      include: widgetInclude,
    });
  }

  findWidgetInstance(instanceId: string) {
    return this.prisma.widgetInstance.findUnique({
      where: { id: instanceId },
      include: widgetInclude,
    });
  }

  updateWidgetInstance(instanceId: string, data: UpdateWidgetInstanceBodyType) {
    const { config, ...rest } = data;
    return this.prisma.widgetInstance.update({
      where: { id: instanceId },
      data: {
        ...rest,
        ...(config !== undefined && { config }),
      },
      include: widgetInclude,
    });
  }

  removeWidgetInstance(instanceId: string) {
    return this.prisma.widgetInstance.delete({ where: { id: instanceId } });
  }

  async duplicateWithWidgets(
    original: {
      name: string;
      slug: string;
      description: string | null;
      widgets: Array<{
        widgetId: string;
        config: any;
        order: number;
        row: number;
        colSpan: number;
        isVisible: boolean;
      }>;
    },
    newData: { name: string; slug: string; createdBy: string },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const layout = await tx.pageLayout.create({
        data: {
          name: newData.name,
          slug: newData.slug,
          description: original.description,
          createdBy: newData.createdBy,
        },
      });
      if (original.widgets.length > 0) {
        await tx.widgetInstance.createMany({
          data: original.widgets.map((w) => ({
            pageLayoutId: layout.id,
            widgetId: w.widgetId,
            config: w.config,
            order: w.order,
            row: w.row,
            colSpan: w.colSpan,
            isVisible: w.isVisible,
          })),
        });
      }
      return this.findById(layout.id);
    });
  }

  savePuckData(
    id: string,
    puckData: NullableJsonNullValueInput | InputJsonValue | undefined,
  ) {
    return this.prisma.pageLayout.update({
      where: { id },
      data: { puckData },
    });
  }

  async reorderWidgets(pageLayoutId: string, orderedInstanceIds: string[]) {
    await this.prisma.$transaction(
      orderedInstanceIds.map((id, index) =>
        this.prisma.widgetInstance.update({
          where: { id },
          data: { order: index },
        }),
      ),
    );
    return this.findById(pageLayoutId);
  }
}
