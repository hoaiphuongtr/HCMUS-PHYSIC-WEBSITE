import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { PageLayoutService } from './page-layout.service';
import { PageLayoutRepository } from './page-layout.repo';
import { WidgetRepository } from '../widget/widget.repo';
import { PublicRevalidateService } from '../shared/services/public-revalidate.service';
import { NotificationService } from '../notification/notification.service';
import { ChatbotService } from '../chatbot/chatbot.service';
import { PostService } from '../post/post.service';
import {
  PageLayoutNotFoundException,
  PageLayoutSlugExistsException,
  PageLayoutVersionNotFoundException,
} from './page-layout.error';

type RepoMock = Record<keyof PageLayoutRepository, ReturnType<typeof vi.fn>>;

const makeRepoMock = (): RepoMock => ({
  create: vi.fn(),
  findPublishedBySlug: vi.fn(),
  findAnyPublishedWithSlug: vi.fn(),
  findConflictBySlugAndStatus: vi.fn(),
  findById: vi.fn(),
  findAll: vi.fn(),
  findOwnedOrPublished: vi.fn(),
  findAllScoped: vi.fn(),
  findTrashed: vi.fn(),
  findPostTemplates: vi.fn(),
  findUserDepartmentId: vi.fn(),
  findAllPublished: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  restore: vi.fn(),
  publish: vi.fn(),
  scheduleManyPublish: vi.fn(),
  unpublish: vi.fn(),
  findDueForPublish: vi.fn(),
  addWidgetInstance: vi.fn(),
  findWidgetInstance: vi.fn(),
  updateWidgetInstance: vi.fn(),
  removeWidgetInstance: vi.fn(),
  duplicateWithWidgets: vi.fn(),
  savePuckData: vi.fn(),
  reorderWidgets: vi.fn(),
  listVersions: vi.fn(),
  findVersion: vi.fn(),
  snapshotPublishedVersion: vi.fn(),
  archiveCurrentVersions: vi.fn(),
  restoreVersionAsDraft: vi.fn(),
  rewriteSlugReferences: vi.fn(),
});

const sampleLayout = {
  id: 'layout-1',
  name: 'Home',
  slug: 'home',
  description: null,
  puckData: { v: 'draft' },
  publishedPuckData: { v: 'live' },
  isPublished: true,
  publishedAt: new Date('2026-05-01T00:00:00Z'),
  scheduledAt: null,
  sourcePostId: null,
  createdBy: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  widgets: [],
};

const sampleVersion = {
  id: 'ver-1',
  pageLayoutId: 'layout-1',
  versionNumber: 2,
  name: 'Home',
  slug: 'home',
  description: null,
  puckData: { v: 'live' },
  status: 'ARCHIVED' as const,
  publishedAt: new Date('2026-05-01T00:00:00Z'),
  publishedBy: 'user-1',
  createdAt: new Date(),
};

describe('PageLayoutService versioning', () => {
  let service: PageLayoutService;
  let repo: RepoMock;
  let revalidate: { trigger: ReturnType<typeof vi.fn> };
  let cache: { clear: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    repo = makeRepoMock();
    revalidate = { trigger: vi.fn() };
    cache = { clear: vi.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PageLayoutService,
        { provide: PageLayoutRepository, useValue: repo },
        { provide: WidgetRepository, useValue: {} },
        { provide: PublicRevalidateService, useValue: revalidate },
        { provide: CACHE_MANAGER, useValue: cache },
        {
          provide: NotificationService,
          useValue: { notifyPublished: vi.fn().mockResolvedValue(undefined) },
        },
        // PageLayoutService đánh chỉ mục chatbot và kéo trạng thái bài theo
        // layout khi xuất bản; cả hai đều là hiệu ứng phụ, chỉ cần bản giả.
        {
          provide: ChatbotService,
          useValue: {
            indexPage: vi.fn().mockResolvedValue(undefined),
            removePage: vi.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: PostService,
          useValue: {
            syncStatusFromLayouts: vi
              .fn()
              .mockResolvedValue({ slugs: [] as string[] }),
          },
        },
      ],
    }).compile();

    service = module.get(PageLayoutService);
  });

  describe('findAllForAdmin (multi-tenant)', () => {
    it('super-admin sees all layouts (no filter)', async () => {
      repo.findAll.mockResolvedValue([sampleLayout]);
      const result = await service.findAllForAdmin('user-x', 'SUPER_ADMIN');
      expect(repo.findAll).toHaveBeenCalled();
      expect(repo.findOwnedOrPublished).not.toHaveBeenCalled();
      expect(result).toEqual([sampleLayout]);
    });

    it('department admin sees only their department (scoped)', async () => {
      repo.findUserDepartmentId.mockResolvedValue('dept_legacy_6');
      repo.findAllScoped.mockResolvedValue([sampleLayout]);
      const result = await service.findAllForAdmin('user-1', 'ADMIN');
      expect(repo.findUserDepartmentId).toHaveBeenCalledWith('user-1');
      expect(repo.findAllScoped).toHaveBeenCalledWith({
        departmentId: 'dept_legacy_6',
      });
      expect(repo.findAll).not.toHaveBeenCalled();
      expect(result).toEqual([sampleLayout]);
    });
  });

  describe('findByIdForAdmin (department scoping)', () => {
    it('super-admin sees any layout', async () => {
      repo.findById.mockResolvedValue({
        ...sampleLayout,
        departmentId: 'dept_legacy_3',
      });
      const result = await service.findByIdForAdmin(
        'layout-1',
        'super-1',
        'SUPER_ADMIN',
      );
      expect(result.id).toBe('layout-1');
    });

    it('bộ-môn admin can read a layout in their department', async () => {
      repo.findUserDepartmentId.mockResolvedValue('dept_legacy_6');
      repo.findById.mockResolvedValue({
        ...sampleLayout,
        departmentId: 'dept_legacy_6',
      });
      const result = await service.findByIdForAdmin(
        'layout-1',
        'user-1',
        'ADMIN',
      );
      expect(result.id).toBe('layout-1');
    });

    it('faculty admin can read faculty-wide (null) layout', async () => {
      repo.findUserDepartmentId.mockResolvedValue('dept_legacy_1');
      repo.findById.mockResolvedValue({
        ...sampleLayout,
        departmentId: null,
      });
      const result = await service.findByIdForAdmin(
        'user-1',
        'user-1',
        'ADMIN',
      );
      expect(result.id).toBe('layout-1');
    });

    it('bộ-môn admin CANNOT read another department’s layout', async () => {
      repo.findUserDepartmentId.mockResolvedValue('dept_legacy_6');
      repo.findById.mockResolvedValue({
        ...sampleLayout,
        departmentId: 'dept_legacy_3',
      });
      await expect(
        service.findByIdForAdmin('layout-1', 'user-1', 'ADMIN'),
      ).rejects.toBe(PageLayoutNotFoundException);
    });
  });

  describe('publish', () => {
    it('snapshots a version after publishing', async () => {
      repo.findById.mockResolvedValue(sampleLayout);
      repo.findAnyPublishedWithSlug.mockResolvedValue(null);
      repo.publish.mockResolvedValue(sampleLayout);
      repo.snapshotPublishedVersion.mockResolvedValue(sampleVersion);

      await service.publish('layout-1', 'user-1', 'ADMIN');

      expect(repo.publish).toHaveBeenCalledWith('layout-1');
      expect(repo.snapshotPublishedVersion).toHaveBeenCalledWith(
        'layout-1',
        'user-1',
      );
      expect(repo.publish.mock.invocationCallOrder[0]).toBeLessThan(
        repo.snapshotPublishedVersion.mock.invocationCallOrder[0],
      );
      expect(revalidate.trigger).toHaveBeenCalledWith([
        'sitemap',
        // Trang chủ mang feed tin tức nên phải làm mới cùng lúc, không thì
        // lưới tin ở trang chủ giữ bản cũ cho tới khi hết ISR.
        'page:trang-chu',
        'page:home',
      ]);
    });

    it('rejects when another layout already publishes the slug', async () => {
      repo.findById.mockResolvedValue(sampleLayout);
      repo.findAnyPublishedWithSlug.mockResolvedValue({ id: 'other' });

      await expect(service.publish('layout-1', 'user-1', 'ADMIN')).rejects.toBe(
        PageLayoutSlugExistsException,
      );
      expect(repo.publish).not.toHaveBeenCalled();
      expect(repo.snapshotPublishedVersion).not.toHaveBeenCalled();
    });
  });

  describe('unpublish', () => {
    it('archives current versions when unpublishing', async () => {
      repo.findById.mockResolvedValue(sampleLayout);
      repo.findConflictBySlugAndStatus.mockResolvedValue(null);
      repo.unpublish.mockResolvedValue(sampleLayout);

      await service.unpublish('layout-1', 'user-1', 'ADMIN');

      expect(repo.unpublish).toHaveBeenCalledWith('layout-1');
      expect(repo.archiveCurrentVersions).toHaveBeenCalledWith('layout-1');
    });
  });

  describe('listVersions', () => {
    it('returns versions wrapped in {versions}', async () => {
      repo.findById.mockResolvedValue(sampleLayout);
      repo.listVersions.mockResolvedValue([sampleVersion]);

      const result = await service.listVersions('layout-1', 'user-1', 'ADMIN');
      expect(result).toEqual({ versions: [sampleVersion] });
    });

    it('throws when layout missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(
        service.listVersions('missing', 'user-1', 'ADMIN'),
      ).rejects.toBe(PageLayoutNotFoundException);
    });

    it('lazy-backfills v1 when layout published but no versions exist', async () => {
      repo.findById.mockResolvedValue(sampleLayout);
      repo.listVersions
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([sampleVersion]);
      repo.snapshotPublishedVersion.mockResolvedValue(sampleVersion);

      const result = await service.listVersions('layout-1', 'user-1', 'ADMIN');

      expect(repo.snapshotPublishedVersion).toHaveBeenCalledWith(
        'layout-1',
        sampleLayout.createdBy,
      );
      expect(result).toEqual({ versions: [sampleVersion] });
    });

    it('does NOT backfill when layout is not published', async () => {
      repo.findById.mockResolvedValue({ ...sampleLayout, isPublished: false });
      repo.listVersions.mockResolvedValue([]);

      const result = await service.listVersions('layout-1', 'user-1', 'ADMIN');

      expect(repo.snapshotPublishedVersion).not.toHaveBeenCalled();
      expect(result).toEqual({ versions: [] });
    });

    it('does NOT backfill when publishedPuckData is empty', async () => {
      repo.findById.mockResolvedValue({
        ...sampleLayout,
        publishedPuckData: null,
      });
      repo.listVersions.mockResolvedValue([]);

      const result = await service.listVersions('layout-1', 'user-1', 'ADMIN');

      expect(repo.snapshotPublishedVersion).not.toHaveBeenCalled();
      expect(result).toEqual({ versions: [] });
    });
  });

  describe('getVersion', () => {
    it('rejects when version belongs to a different layout', async () => {
      repo.findById.mockResolvedValue(sampleLayout);
      repo.findVersion.mockResolvedValue({
        ...sampleVersion,
        pageLayoutId: 'other-layout',
      });

      await expect(
        service.getVersion('layout-1', 'ver-1', 'user-1', 'ADMIN'),
      ).rejects.toBe(PageLayoutVersionNotFoundException);
    });

    it('returns the version when ownership matches', async () => {
      repo.findById.mockResolvedValue(sampleLayout);
      repo.findVersion.mockResolvedValue(sampleVersion);
      const v = await service.getVersion(
        'layout-1',
        'ver-1',
        'user-1',
        'ADMIN',
      );
      expect(v).toEqual(sampleVersion);
    });
  });

  describe('rollbackToVersion', () => {
    it('draft mode restores puckData and does NOT publish', async () => {
      repo.findById.mockResolvedValue(sampleLayout);
      repo.findVersion.mockResolvedValue(sampleVersion);

      await service.rollbackToVersion(
        'layout-1',
        'ver-1',
        'user-1',
        { mode: 'draft' },
        'ADMIN',
      );

      expect(repo.restoreVersionAsDraft).toHaveBeenCalledWith(
        'layout-1',
        sampleVersion.puckData,
      );
      expect(repo.publish).not.toHaveBeenCalled();
      expect(repo.snapshotPublishedVersion).not.toHaveBeenCalled();
      expect(revalidate.trigger).not.toHaveBeenCalled();
    });

    it('republish mode checks slug conflict BEFORE touching draft', async () => {
      repo.findById.mockResolvedValue(sampleLayout);
      repo.findVersion.mockResolvedValue(sampleVersion);
      repo.findAnyPublishedWithSlug.mockResolvedValue({ id: 'other' });

      await expect(
        service.rollbackToVersion(
          'layout-1',
          'ver-1',
          'user-1',
          { mode: 'republish' },
          'ADMIN',
        ),
      ).rejects.toBe(PageLayoutSlugExistsException);

      expect(repo.restoreVersionAsDraft).not.toHaveBeenCalled();
      expect(repo.publish).not.toHaveBeenCalled();
    });

    it('republish mode restores, publishes, snapshots, then revalidates', async () => {
      repo.findById.mockResolvedValue(sampleLayout);
      repo.findVersion.mockResolvedValue(sampleVersion);
      repo.findAnyPublishedWithSlug.mockResolvedValue(null);

      await service.rollbackToVersion(
        'layout-1',
        'ver-1',
        'user-1',
        { mode: 'republish' },
        'ADMIN',
      );

      expect(repo.restoreVersionAsDraft).toHaveBeenCalled();
      expect(repo.publish).toHaveBeenCalledWith('layout-1');
      expect(repo.snapshotPublishedVersion).toHaveBeenCalledWith(
        'layout-1',
        'user-1',
      );
      expect(
        repo.restoreVersionAsDraft.mock.invocationCallOrder[0],
      ).toBeLessThan(repo.publish.mock.invocationCallOrder[0]);
      expect(repo.publish.mock.invocationCallOrder[0]).toBeLessThan(
        repo.snapshotPublishedVersion.mock.invocationCallOrder[0],
      );
      expect(revalidate.trigger).toHaveBeenCalledWith(['sitemap', 'page:home']);
    });

    it('throws when version not found', async () => {
      repo.findById.mockResolvedValue(sampleLayout);
      repo.findVersion.mockResolvedValue(null);

      await expect(
        service.rollbackToVersion(
          'layout-1',
          'missing',
          'user-1',
          { mode: 'draft' },
          'ADMIN',
        ),
      ).rejects.toBe(PageLayoutVersionNotFoundException);
    });
  });

  describe('cron handleScheduledPublish', () => {
    it('snapshots each layout after auto-publish', async () => {
      repo.findDueForPublish.mockResolvedValue([{ id: 'layout-1' }]);
      repo.findById.mockResolvedValue(sampleLayout);
      repo.findAnyPublishedWithSlug.mockResolvedValue(null);

      await service.handleScheduledPublish();

      expect(repo.publish).toHaveBeenCalledWith('layout-1');
      expect(repo.snapshotPublishedVersion).toHaveBeenCalledWith(
        'layout-1',
        'user-1',
      );
    });
  });
});
