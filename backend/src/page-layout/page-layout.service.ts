import { Inject, Injectable } from '@nestjs/common';
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
} from './page-layout.model';
import {
  PageLayoutSlugExistsException,
  PageLayoutNotFoundException,
  WidgetInstanceNotFoundException,
} from './page-layout.error';
import { WidgetNotFoundException } from '../widget/widget.error';

@Injectable()
export class PageLayoutService {
  constructor(
    private readonly pageLayoutRepository: PageLayoutRepository,
    private readonly widgetRepository: WidgetRepository,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

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
