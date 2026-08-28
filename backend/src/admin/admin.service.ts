import { Injectable } from '@nestjs/common';
import { AdminRepository } from './admin.repo';
import {
  AdminListQueryType,
  ResetAdminPasswordBodyType,
  UpdateAdminProfileBodyType,
} from './admin.model';
import {
  AdminNotFoundException,
  CannotMutateSuperAdminException,
} from './admin.error';
import { HashingService } from '../shared/services/hashing.service';

const ACTIVE_WINDOW_MS = 5 * 60 * 1000;

@Injectable()
export class AdminService {
  constructor(
    private readonly adminRepository: AdminRepository,
    private readonly hashingService: HashingService,
  ) {}

  async list(query: AdminListQueryType) {
    const { page, pageSize } = query;
    const skip = (page - 1) * pageSize;
    const activeSince = new Date(Date.now() - ACTIVE_WINDOW_MS);
    const [items, total, activeNow, units] = await Promise.all([
      this.adminRepository.listPaged(skip, pageSize),
      this.adminRepository.count(),
      this.adminRepository.countActiveSince(activeSince),
      this.adminRepository.listUnits(),
    ]);
    return { items, total, activeNow, page, pageSize, units };
  }

  /**
   * Cập nhật hồ sơ tài khoản (Mục 10) — ngạch/chức vụ/học vị/MSCB/đơn vị… Web
   * Khoa làm chủ các trường này. KHÔNG chặn SUPER_ADMIN như suspend/reset: sửa
   * hồ sơ là vô hại, khác với khoá tài khoản.
   */
  async updateProfile(id: string, body: UpdateAdminProfileBodyType) {
    const user = await this.adminRepository.findById(id);
    if (!user) throw AdminNotFoundException;
    return this.adminRepository.updateProfile(id, body);
  }

  private async loadAdminOrThrow(id: string) {
    const user = await this.adminRepository.findById(id);
    if (!user) throw AdminNotFoundException;
    if (user.role === 'SUPER_ADMIN') throw CannotMutateSuperAdminException;
    return user;
  }

  async suspend(id: string) {
    await this.loadAdminOrThrow(id);
    await this.adminRepository.setActive(id, false);
    return { message: 'Admin suspended' };
  }

  async restore(id: string) {
    await this.loadAdminOrThrow(id);
    await this.adminRepository.setActive(id, true);
    return { message: 'Admin restored' };
  }

  async resetPassword(id: string, body: ResetAdminPasswordBodyType) {
    await this.loadAdminOrThrow(id);
    const hashed = await this.hashingService.hash(body.password);
    await this.adminRepository.setPassword(id, hashed);
    return { message: 'Password reset' };
  }
}
