import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  listPaged(skip: number, take: number) {
    return this.prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
      orderBy: [{ createdAt: 'desc' }],
      skip,
      take,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        position: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        department: { select: { id: true, name: true } },
      },
    });
  }

  count() {
    return this.prisma.user.count({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
    });
  }

  countActiveSince(since: Date) {
    return this.prisma.user.count({
      where: {
        role: { in: ['ADMIN', 'SUPER_ADMIN'] },
        lastLoginAt: { gte: since },
      },
    });
  }
}
