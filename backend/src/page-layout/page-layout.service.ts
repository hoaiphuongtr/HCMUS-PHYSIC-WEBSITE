import { Injectable } from '@nestjs/common';
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
  ) {}

  async create(body: CreatePageLayoutBodyType, userId: string) {
    const existing = await this.pageLayoutRepository.findBySlug(body.slug);
    if (existing) throw PageLayoutSlugExistsException;
    return this.pageLayoutRepository.create({ ...body, createdBy: userId });
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
    return this.pageLayoutRepository.update(id, body);
  }

  async delete(id: string) {
    await this.findById(id);
    return this.pageLayoutRepository.delete(id);
  }

  async publish(id: string) {
    await this.findById(id);
    return this.pageLayoutRepository.publish(id);
  }

  async addWidgetInstance(
    pageLayoutId: string,
    body: AddWidgetInstanceBodyType,
  ) {
    await this.findById(pageLayoutId);
    const widget = await this.widgetRepository.findById(body.widgetId);
    if (!widget) throw WidgetNotFoundException;
    const config = { ...(widget.defaultConfig as object), ...body.config };
    return this.pageLayoutRepository.addWidgetInstance(pageLayoutId, {
      ...body,
      config,
    });
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
    return this.pageLayoutRepository.updateWidgetInstance(instanceId, body);
  }

  async removeWidgetInstance(pageLayoutId: string, instanceId: string) {
    await this.findById(pageLayoutId);
    const instance =
      await this.pageLayoutRepository.findWidgetInstance(instanceId);
    if (!instance || instance.pageLayoutId !== pageLayoutId)
      throw WidgetInstanceNotFoundException;
    await this.pageLayoutRepository.removeWidgetInstance(instanceId);
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
    return this.pageLayoutRepository.duplicateWithWidgets(
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
  }

  async savePuckData(id: string, body: SavePuckDataBodyType) {
    await this.findById(id);
    return this.pageLayoutRepository.savePuckData(id, body.puckData);
  }

  async reorderWidgets(pageLayoutId: string, body: ReorderWidgetsBodyType) {
    await this.findById(pageLayoutId);
    return this.pageLayoutRepository.reorderWidgets(
      pageLayoutId,
      body.orderedInstanceIds,
    );
  }
}
