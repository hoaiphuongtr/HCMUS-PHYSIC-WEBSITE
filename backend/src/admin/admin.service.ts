import { Injectable } from '@nestjs/common';
import { AdminRepository } from './admin.repo';
import { AdminListQueryType } from './admin.model';

const ACTIVE_WINDOW_MS = 5 * 60 * 1000;

@Injectable()
export class AdminService {
  constructor(private readonly adminRepository: AdminRepository) {}

  async list(query: AdminListQueryType) {
    const { page, pageSize } = query;
    const skip = (page - 1) * pageSize;
    const activeSince = new Date(Date.now() - ACTIVE_WINDOW_MS);
    const [items, total, activeNow] = await Promise.all([
      this.adminRepository.listPaged(skip, pageSize),
      this.adminRepository.count(),
      this.adminRepository.countActiveSince(activeSince),
    ]);
    return { items, total, activeNow, page, pageSize };
  }
}
