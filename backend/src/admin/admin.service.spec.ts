import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AdminService } from './admin.service';
import { AdminRepository } from './admin.repo';
import { HashingService } from '../shared/services/hashing.service';
import {
  AdminNotFoundException,
  CannotMutateSuperAdminException,
} from './admin.error';

type RepoMock = Record<keyof AdminRepository, ReturnType<typeof vi.fn>>;

const makeRepoMock = (): RepoMock => ({
  listPaged: vi.fn(),
  count: vi.fn(),
  countActiveSince: vi.fn(),
  findById: vi.fn(),
  setActive: vi.fn(),
  setPassword: vi.fn(),
});

const sampleAdmin = {
  id: 'admin-1',
  email: 'a@x.com',
  role: 'ADMIN' as const,
  isActive: true,
};

const sampleSuperAdmin = {
  id: 'super-1',
  email: 's@x.com',
  role: 'SUPER_ADMIN' as const,
  isActive: true,
};

describe('AdminService mutations', () => {
  let service: AdminService;
  let repo: RepoMock;
  let hashing: {
    hash: ReturnType<typeof vi.fn>;
    compare: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    repo = makeRepoMock();
    hashing = { hash: vi.fn().mockResolvedValue('HASHED'), compare: vi.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: AdminRepository, useValue: repo },
        { provide: HashingService, useValue: hashing },
      ],
    }).compile();

    service = module.get(AdminService);
  });

  describe('list', () => {
    it('returns paged items + total + activeNow', async () => {
      repo.listPaged.mockResolvedValue([sampleAdmin]);
      repo.count.mockResolvedValue(3);
      repo.countActiveSince.mockResolvedValue(1);

      const result = await service.list({ page: 2, pageSize: 5 });

      expect(repo.listPaged).toHaveBeenCalledWith(5, 5);
      expect(result).toEqual({
        items: [sampleAdmin],
        total: 3,
        activeNow: 1,
        page: 2,
        pageSize: 5,
      });
    });
  });

  describe('suspend', () => {
    it('sets isActive=false on a regular admin', async () => {
      repo.findById.mockResolvedValue(sampleAdmin);

      await service.suspend('admin-1');

      expect(repo.setActive).toHaveBeenCalledWith('admin-1', false);
    });

    it('throws AdminNotFound when id missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.suspend('missing')).rejects.toBe(
        AdminNotFoundException,
      );
      expect(repo.setActive).not.toHaveBeenCalled();
    });

    it('refuses to suspend a super-admin', async () => {
      repo.findById.mockResolvedValue(sampleSuperAdmin);
      await expect(service.suspend('super-1')).rejects.toBe(
        CannotMutateSuperAdminException,
      );
      expect(repo.setActive).not.toHaveBeenCalled();
    });
  });

  describe('restore', () => {
    it('sets isActive=true on a regular admin', async () => {
      repo.findById.mockResolvedValue({ ...sampleAdmin, isActive: false });

      await service.restore('admin-1');

      expect(repo.setActive).toHaveBeenCalledWith('admin-1', true);
    });

    it('refuses to restore a super-admin', async () => {
      repo.findById.mockResolvedValue(sampleSuperAdmin);
      await expect(service.restore('super-1')).rejects.toBe(
        CannotMutateSuperAdminException,
      );
    });
  });

  describe('resetPassword', () => {
    it('hashes password then persists', async () => {
      repo.findById.mockResolvedValue(sampleAdmin);

      await service.resetPassword('admin-1', { password: 'newPass123' });

      expect(hashing.hash).toHaveBeenCalledWith('newPass123');
      expect(repo.setPassword).toHaveBeenCalledWith('admin-1', 'HASHED');
    });

    it('refuses to reset super-admin password', async () => {
      repo.findById.mockResolvedValue(sampleSuperAdmin);
      await expect(
        service.resetPassword('super-1', { password: 'newPass123' }),
      ).rejects.toBe(CannotMutateSuperAdminException);
      expect(hashing.hash).not.toHaveBeenCalled();
      expect(repo.setPassword).not.toHaveBeenCalled();
    });

    it('throws AdminNotFound for unknown id', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(
        service.resetPassword('missing', { password: 'newPass123' }),
      ).rejects.toBe(AdminNotFoundException);
    });
  });
});
