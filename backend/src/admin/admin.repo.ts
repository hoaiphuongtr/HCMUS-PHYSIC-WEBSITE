import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';
import { UpdateAdminProfileBodyType } from './admin.model';

// Trang quản lý user cho CẢ nhân sự: admin CMS lẫn giảng viên (LECTURER). Mục 10
// biến trang "admins" thành nơi web Khoa làm chủ hồ sơ mọi người.
const STAFF_WHERE: Prisma.UserWhereInput = {
  role: { in: ['SUPER_ADMIN', 'ADMIN', 'LECTURER'] },
};

const STAFF_SELECT = {
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
  physoomId: true,
  teacherId: true,
  degree: true,
  rank: true,
  positionKey: true,
  positionFrom: true,
  positionTo: true,
  employmentType: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class AdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  listPaged(skip: number, take: number) {
    return this.prisma.user.findMany({
      where: STAFF_WHERE,
      orderBy: [{ createdAt: 'desc' }],
      skip,
      take,
      select: STAFF_SELECT,
    });
  }

  count() {
    return this.prisma.user.count({ where: STAFF_WHERE });
  }

  countActiveSince(since: Date) {
    return this.prisma.user.count({
      where: { ...STAFF_WHERE, lastLoginAt: { gte: since } },
    });
  }

  /** Đơn vị để dropdown chọn (Mục 10). */
  listUnits() {
    return this.prisma.department.findMany({
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true },
    });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  updateProfile(id: string, body: UpdateAdminProfileBodyType) {
    return this.prisma.user.update({
      where: { id },
      // Chỉ ghi trường được gửi; `departmentId` là FK vô hướng, đặt thẳng được.
      data: {
        ...(body.rank !== undefined ? { rank: body.rank } : {}),
        ...(body.positionKey !== undefined
          ? { positionKey: body.positionKey }
          : {}),
        ...(body.positionFrom !== undefined
          ? { positionFrom: body.positionFrom }
          : {}),
        ...(body.positionTo !== undefined
          ? { positionTo: body.positionTo }
          : {}),
        ...(body.degree !== undefined ? { degree: body.degree } : {}),
        ...(body.teacherId !== undefined ? { teacherId: body.teacherId } : {}),
        ...(body.employmentType !== undefined
          ? { employmentType: body.employmentType }
          : {}),
        ...(body.departmentId !== undefined
          ? { departmentId: body.departmentId }
          : {}),
      },
      select: STAFF_SELECT,
    });
  }

  setActive(id: string, isActive: boolean) {
    return this.prisma.user.update({
      where: { id },
      data: { isActive },
      select: { id: true, email: true, isActive: true },
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
