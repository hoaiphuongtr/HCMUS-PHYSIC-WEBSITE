import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  listPaged(skip: number, take: number) {
    return this.prisma.user.findMany({
      where: { role: 'ADMIN' },
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
      where: { role: 'ADMIN' },
    });
  }

  countActiveSince(since: Date) {
    return this.prisma.user.count({
      where: {
        role: 'ADMIN',
        lastLoginAt: { gte: since },
      },
    });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  setActive(id: string, isActive: boolean) {
    return this.prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        email: true,
        isActive: true,
      },
    });
  }

  setPassword(id: string, hashedPassword: string) {
    return this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
      select: { id: true, email: true },
    });
  }
}
