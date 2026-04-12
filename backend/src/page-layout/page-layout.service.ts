import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { PageLayoutRepository } from './page-layout.repo';
import { WidgetRepository } from '../widget/widget.repo';
import {
  CreatePageLayoutBodyType,
  UpdatePageLayoutBodyType,
  AddWidgetInstanceBodyType,
  UpdateWidgetInstanceBodyType,
  ReorderWidgetsBodyType,
  DuplicatePageLayoutBodyType,
  SavePuckDataBodyType,
  SchedulePublishBodyType,
} from './page-layout.model';
import {
  PageLayoutSlugExistsException,
  PageLayoutNotFoundException,
  WidgetInstanceNotFoundException,
} from './page-layout.error';
import { WidgetNotFoundException } from '../widget/widget.error';

@Injectable()
export class PageLayoutService {
  private readonly logger = new Logger(PageLayoutService.name);

  constructor(
    private readonly pageLayoutRepository: PageLayoutRepository,
    private readonly widgetRepository: WidgetRepository,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE, { name: 'publishDueLayouts' })
  async handleScheduledPublish() {
    const due = await this.pageLayoutRepository.findDueForPublish(new Date());
    if (due.length === 0) return;
    for (const layout of due) {
      try {
        await this.pageLayoutRepository.publish(layout.id);
        this.logger.log(`Auto-published scheduled layout ${layout.id}`);
      } catch (err) {
        this.logger.error(
          `Failed to auto-publish layout ${layout.id}`,
          err as Error,
        );
      }
    }
    await this.cache.clear();
  }

  async create(body: CreatePageLayoutBodyType, userId: string) {
    const existing = await this.pageLayoutRepository.findBySlug(body.slug);
    if (existing) throw PageLayoutSlugExistsException;
    const layout = await this.pageLayoutRepository.create({
      ...body,
      createdBy: userId,
    });
    await this.cache.clear();
    return layout;
  }

  findAll() {
    return this.pageLayoutRepository.findAll();
  }

  async findById(id: string) {
    const layout = await this.pageLayoutRepository.findById(id);
    if (!layout) throw PageLayoutNotFoundException;
    return layout;
  }

  async findBySlug(slug: string) {
    const layout = await this.pageLayoutRepository.findBySlug(slug);
    if (!layout) throw PageLayoutNotFoundException;
    return layout;
  }

  async update(id: string, body: UpdatePageLayoutBodyType) {
    await this.findById(id);
    if (body.slug) {
      const existing = await this.pageLayoutRepository.findBySlug(body.slug);
      if (existing && existing.id !== id) throw PageLayoutSlugExistsException;
    }
    const updated = await this.pageLayoutRepository.update(id, body);
    await this.cache.clear();
    return updated;
  }

  async delete(id: string) {
    await this.findById(id);
    const result = await this.pageLayoutRepository.delete(id);
    await this.cache.clear();
    return result;
  }

  async publish(id: string) {
    await this.findById(id);
    const result = await this.pageLayoutRepository.publish(id);
    await this.cache.clear();
    return result;
  }

  async schedulePublish(id: string, body: SchedulePublishBodyType) {
    await this.findById(id);
    const ids = [id, ...(body.alsoScheduleIds ?? [])];
    const uniqueIds = Array.from(new Set(ids));
    for (const layoutId of uniqueIds) {
      if (layoutId !== id) {
        const exists = await this.pageLayoutRepository.findById(layoutId);
        if (!exists) throw PageLayoutNotFoundException;
      }
    }
    await this.pageLayoutRepository.scheduleManyPublish(
      uniqueIds,
      body.scheduledAt,
    );
    await this.cache.clear();
    return this.findById(id);
  }

  async unpublish(id: string) {
    await this.findById(id);
    const result = await this.pageLayoutRepository.unpublish(id);
    await this.cache.clear();
    return result;
  }

  async addWidgetInstance(
    pageLayoutId: string,
    body: AddWidgetInstanceBodyType,
  ) {
    await this.findById(pageLayoutId);
    const widget = await this.widgetRepository.findById(body.widgetId);
    if (!widget) throw WidgetNotFoundException;
    const config = { ...(widget.defaultConfig as object), ...body.config };
    const instance = await this.pageLayoutRepository.addWidgetInstance(
      pageLayoutId,
      { ...body, config },
    );
    await this.cache.clear();
    return instance;
  }

  async updateWidgetInstance(
    pageLayoutId: string,
    instanceId: string,
    body: UpdateWidgetInstanceBodyType,
  ) {
    await this.findById(pageLayoutId);
    const instance =
      await this.pageLayoutRepository.findWidgetInstance(instanceId);
    if (!instance || instance.pageLayoutId !== pageLayoutId)
      throw WidgetInstanceNotFoundException;
    const updated = await this.pageLayoutRepository.updateWidgetInstance(
      instanceId,
      body,
    );
    await this.cache.clear();
    return updated;
  }

  async removeWidgetInstance(pageLayoutId: string, instanceId: string) {
    await this.findById(pageLayoutId);
    const instance =
      await this.pageLayoutRepository.findWidgetInstance(instanceId);
    if (!instance || instance.pageLayoutId !== pageLayoutId)
      throw WidgetInstanceNotFoundException;
    await this.pageLayoutRepository.removeWidgetInstance(instanceId);
    await this.cache.clear();
    return { message: 'Widget instance removed successfully' };
  }

  async duplicate(
    id: string,
    userId: string,
    body: DuplicatePageLayoutBodyType,
  ) {
    const original = await this.pageLayoutRepository.findById(id);
    if (!original) throw PageLayoutNotFoundException;
    const baseName = body.name || `Copy of ${original.name}`;
    let slug = baseName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const existing = await this.pageLayoutRepository.findBySlug(slug);
    if (existing) {
      slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    }
    const duplicated = await this.pageLayoutRepository.duplicateWithWidgets(
      {
        name: original.name,
        slug: original.slug,
        description: original.description,
        widgets: (original.widgets || []).map((w) => ({
          widgetId: w.widgetId,
          config: w.config,
          order: w.order,
          row: w.row,
          colSpan: w.colSpan,
          isVisible: w.isVisible,
        })),
      },
      { name: baseName, slug, createdBy: userId },
    );
    await this.cache.clear();
    return duplicated;
  }

  async savePuckData(id: string, body: SavePuckDataBodyType) {
    await this.findById(id);
    const result = await this.pageLayoutRepository.savePuckData(
      id,
      body.puckData,
    );
    await this.cache.clear();
    return result;
  }

  async reorderWidgets(pageLayoutId: string, body: ReorderWidgetsBodyType) {
    await this.findById(pageLayoutId);
    const result = await this.pageLayoutRepository.reorderWidgets(
      pageLayoutId,
      body.orderedInstanceIds,
    );
    await this.cache.clear();
    return result;
  }
}
