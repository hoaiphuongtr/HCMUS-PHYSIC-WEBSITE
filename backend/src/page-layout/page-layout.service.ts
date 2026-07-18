import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common';
import {
  canAccessDepartment,
  departmentScopeWhere,
  FACULTY_DEPT_ID,
  toSlug,
} from '../shared/helpers';
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
  PageLayoutVersionNotFoundException,
  WidgetInstanceNotFoundException,
  slugExistsInStatusException,
} from './page-layout.error';
import type { RollbackPageLayoutVersionBodyType } from './page-layout.model';
import { WidgetNotFoundException } from '../widget/widget.error';
import { PublicRevalidateService } from '../shared/services/public-revalidate.service';
import { ChatbotService } from '../chatbot/chatbot.service';

@Injectable()
export class PageLayoutService {
  private readonly logger = new Logger(PageLayoutService.name);

  constructor(
    private readonly pageLayoutRepository: PageLayoutRepository,
    private readonly widgetRepository: WidgetRepository,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly publicRevalidate: PublicRevalidateService,
    private readonly chatbot: ChatbotService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE, { name: 'publishDueLayouts' })
  async handleScheduledPublish() {
    const due = await this.pageLayoutRepository.findDueForPublish(new Date());
    if (due.length === 0) return;
    const publishedSlugs: string[] = [];
    for (const dueLayout of due) {
      try {
        const layout = await this.pageLayoutRepository.findById(dueLayout.id);
        if (!layout) continue;
        const conflict =
          await this.pageLayoutRepository.findAnyPublishedWithSlug(
            layout.slug,
            layout.id,
          );
        if (conflict) {
          await this.pageLayoutRepository.unpublish(conflict.id);
          this.logger.log(
            `Auto-unpublished ${conflict.id} to free slug "${layout.slug}"`,
          );
        }
        await this.pageLayoutRepository.publish(layout.id);
        await this.pageLayoutRepository.snapshotPublishedVersion(
          layout.id,
          layout.createdBy,
        );
        await this.chatbot.indexPage(layout.id).catch(() => undefined);
        publishedSlugs.push(layout.slug);
        this.logger.log(`Auto-published scheduled layout ${layout.id}`);
      } catch (err) {
        this.logger.error(
          `Failed to auto-publish layout ${dueLayout.id}`,
          err as Error,
        );
      }
    }
    await this.cache.clear();
    if (publishedSlugs.length > 0) {
      this.publicRevalidate.trigger([
        'sitemap',
        ...publishedSlugs.map((s) => `page:${s}`),
      ]);
    }
  }

  async create(
    body: CreatePageLayoutBodyType,
    userId: string,
    roleName: string,
  ) {
    // Assign the new layout to the creator's department so they can immediately
    // see and open it. Super-admin and faculty-office keep it null (global /
    // faculty scope); a department admin's layout is scoped to their department.
    // Without this the layout is created with departmentId=null, which a
    // department admin's own scope can't list and getById rejects (404) — the
    // editor never opens, only the "created" toast shows.
    const dept =
      roleName === 'SUPER_ADMIN'
        ? null
        : await this.pageLayoutRepository.findUserDepartmentId(userId);
    const layout = await this.pageLayoutRepository.create({
      ...body,
      createdBy: userId,
      departmentId: dept && dept !== FACULTY_DEPT_ID ? dept : null,
    });
    await this.cache.clear();
    return layout;
  }

  async findAllForAdmin(userId: string, roleName: string) {
    if (roleName === 'SUPER_ADMIN') {
      return this.pageLayoutRepository.findAll();
    }
    const dept = await this.pageLayoutRepository.findUserDepartmentId(userId);
    const scope = departmentScopeWhere(roleName, dept) ?? {};
    return this.pageLayoutRepository.findAllScoped(scope);
  }

  findAllPublished() {
    return this.pageLayoutRepository.findAllPublished();
  }

  async findById(id: string) {
    const layout = await this.pageLayoutRepository.findById(id);
    if (!layout) throw PageLayoutNotFoundException;
    return layout;
  }

  async findByIdForAdmin(id: string, userId: string, roleName: string) {
    const layout = await this.pageLayoutRepository.findById(id);
    if (!layout) throw PageLayoutNotFoundException;
    if (roleName === 'SUPER_ADMIN') return layout;
    const dept = await this.pageLayoutRepository.findUserDepartmentId(userId);
    if (canAccessDepartment(roleName, dept, layout.departmentId)) return layout;
    throw PageLayoutNotFoundException;
  }

  private async assertOwnership(id: string, userId: string, roleName: string) {
    const layout = await this.pageLayoutRepository.findById(id);
    if (!layout) throw PageLayoutNotFoundException;
    if (roleName === 'SUPER_ADMIN') return layout;
    const dept = await this.pageLayoutRepository.findUserDepartmentId(userId);
    if (!canAccessDepartment(roleName, dept, layout.departmentId)) {
      throw PageLayoutNotFoundException;
    }
    return layout;
  }

  async findBySlug(slug: string) {
    const layout = await this.pageLayoutRepository.findPublishedBySlug(slug);
    if (!layout) throw PageLayoutNotFoundException;
    return layout;
  }

  async update(
    id: string,
    body: UpdatePageLayoutBodyType,
    userId: string,
    roleName: string,
  ) {
    const current = await this.assertOwnership(id, userId, roleName);
    if (body.slug && body.slug !== current.slug) {
      const conflict =
        await this.pageLayoutRepository.findConflictBySlugAndStatus(
          body.slug,
          current.isPublished,
          id,
        );
      if (conflict)
        throw slugExistsInStatusException(
          current.isPublished ? 'published' : 'draft',
          conflict.name,
        );
    }
    const updated = await this.pageLayoutRepository.update(id, body);
    await this.cache.clear();
    return updated;
  }

  async delete(id: string, userId: string, roleName: string) {
    await this.assertOwnership(id, userId, roleName);
    const result = await this.pageLayoutRepository.delete(id);
    await this.cache.clear();
    return result;
  }

  async publish(id: string, userId: string, roleName: string) {
    const layout = await this.assertOwnership(id, userId, roleName);
    const conflict = await this.pageLayoutRepository.findAnyPublishedWithSlug(
      layout.slug,
      id,
    );
    if (conflict) throw PageLayoutSlugExistsException;
    const result = await this.pageLayoutRepository.publish(id);
    await this.pageLayoutRepository.snapshotPublishedVersion(id, userId);
    await this.cache.clear();
    await this.chatbot.indexPage(id).catch(() => undefined);
    this.publicRevalidate.trigger(['sitemap', `page:${layout.slug}`]);
    return result;
  }

  async schedulePublish(
    id: string,
    body: SchedulePublishBodyType,
    userId: string,
    roleName: string,
  ) {
    await this.assertOwnership(id, userId, roleName);
    const ids = [id, ...(body.alsoScheduleIds ?? [])];
    const uniqueIds = Array.from(new Set(ids));
    for (const layoutId of uniqueIds) {
      if (layoutId !== id) {
        await this.assertOwnership(layoutId, userId, roleName);
      }
    }
    await this.pageLayoutRepository.scheduleManyPublish(
      uniqueIds,
      body.scheduledAt,
    );
    await this.cache.clear();
    return this.findById(id);
  }

  async unpublish(id: string, userId: string, roleName: string) {
    const layout = await this.assertOwnership(id, userId, roleName);
    const conflict =
      await this.pageLayoutRepository.findConflictBySlugAndStatus(
        layout.slug,
        false,
        id,
      );
    if (conflict) throw slugExistsInStatusException('draft', conflict.name);
    const result = await this.pageLayoutRepository.unpublish(id);
    await this.pageLayoutRepository.archiveCurrentVersions(id);
    await this.cache.clear();
    await this.chatbot.removePage(id).catch(() => undefined);
    this.publicRevalidate.trigger(['sitemap', `page:${layout.slug}`]);
    return result;
  }

  async listVersions(id: string, userId: string, roleName: string) {
    const layout = await this.findByIdForAdmin(id, userId, roleName);
    let versions = await this.pageLayoutRepository.listVersions(id);
    if (
      versions.length === 0 &&
      layout.isPublished &&
      layout.publishedPuckData
    ) {
      await this.pageLayoutRepository.snapshotPublishedVersion(
        id,
        layout.createdBy,
      );
      versions = await this.pageLayoutRepository.listVersions(id);
    }
    return { versions };
  }

  async getVersion(
    id: string,
    versionId: string,
    userId: string,
    roleName: string,
  ) {
    await this.findByIdForAdmin(id, userId, roleName);
    const version = await this.pageLayoutRepository.findVersion(versionId);
    if (!version || version.pageLayoutId !== id)
      throw PageLayoutVersionNotFoundException;
    return version;
  }

  async rollbackToVersion(
    id: string,
    versionId: string,
    userId: string,
    body: RollbackPageLayoutVersionBodyType,
    roleName: string,
  ) {
    const layout = await this.assertOwnership(id, userId, roleName);
    const version = await this.pageLayoutRepository.findVersion(versionId);
    if (!version || version.pageLayoutId !== id)
      throw PageLayoutVersionNotFoundException;
    if (body.mode === 'republish') {
      const conflict = await this.pageLayoutRepository.findAnyPublishedWithSlug(
        layout.slug,
        id,
      );
      if (conflict) throw PageLayoutSlugExistsException;
    }
    await this.pageLayoutRepository.restoreVersionAsDraft(id, version.puckData);
    if (body.mode === 'republish') {
      await this.pageLayoutRepository.publish(id);
      await this.pageLayoutRepository.snapshotPublishedVersion(id, userId);
      this.publicRevalidate.trigger(['sitemap', `page:${layout.slug}`]);
    }
    await this.cache.clear();
    return this.findById(id);
  }

  async addWidgetInstance(
    pageLayoutId: string,
    body: AddWidgetInstanceBodyType,
    userId: string,
    roleName: string,
  ) {
    await this.assertOwnership(pageLayoutId, userId, roleName);
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
    userId: string,
    roleName: string,
  ) {
    await this.assertOwnership(pageLayoutId, userId, roleName);
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

  async removeWidgetInstance(
    pageLayoutId: string,
    instanceId: string,
    userId: string,
    roleName: string,
  ) {
    await this.assertOwnership(pageLayoutId, userId, roleName);
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
    roleName: string,
  ) {
    const original = await this.findByIdForAdmin(id, userId, roleName);
    const baseName = body.name || `Copy of ${original.name}`;
    const baseSlug =
      toSlug(baseName) || `${toSlug(original.slug) || 'layout'}-copy`;
    // Find an unused draft slug. Repo allows multi-draft per slug only if no
    // draft conflict exists; loop until we hit a free one.
    let slug = baseSlug;
    let suffix = 1;
    while (
      await this.pageLayoutRepository.findConflictBySlugAndStatus(slug, false)
    ) {
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
      if (suffix > 50) {
        throw new ConflictException(
          'Cannot find a free slug for the duplicated layout',
        );
      }
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

  async savePuckData(
    id: string,
    body: SavePuckDataBodyType,
    userId: string,
    roleName: string,
  ) {
    await this.assertOwnership(id, userId, roleName);
    const result = await this.pageLayoutRepository.savePuckData(
      id,
      body.puckData,
    );
    await this.cache.clear();
    return result;
  }

  async reorderWidgets(
    pageLayoutId: string,
    body: ReorderWidgetsBodyType,
    userId: string,
    roleName: string,
  ) {
    await this.assertOwnership(pageLayoutId, userId, roleName);
    const result = await this.pageLayoutRepository.reorderWidgets(
      pageLayoutId,
      body.orderedInstanceIds,
    );
    await this.cache.clear();
    return result;
  }
}
