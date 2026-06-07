import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, VerificationCodeType } from '../generated/prisma/client';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUniqueUserByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }
  findUniqueUserByEmailButOmitPassword(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      omit: { password: true },
    });
  }
  findUniqueUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { department: { select: { id: true, name: true } } },
    });
  }

  createUser(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: Role;
    phone?: string;
    position?: string;
    bio?: string;
    departmentId?: string;
    avatarUrl?: string;
  }) {
    return this.prisma.user.create({ data, omit: { password: true } });
  }

  updateUserPassword(email: string, password: string) {
    return this.prisma.user.update({
      where: { email },
      data: { password },
    });
  }

  touchLastLogin(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  updateProfile(
    userId: string,
    data: {
      firstName?: string;
      lastName?: string;
      avatarUrl?: string | null;
      position?: string | null;
      departmentId?: string | null;
      phone?: string | null;
    },
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      omit: { password: true },
      include: { department: { select: { id: true, name: true } } },
    });
  }

  updatePasswordById(userId: string, password: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { password },
      select: { id: true },
    });
  }

  findUserWithPassword(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  createVerificationCode(data: {
    email: string;
    code: string;
    type: VerificationCodeType;
    expiresAt: Date;
  }) {
    return this.prisma.verificationCode.upsert({
      where: { email_type: { email: data.email, type: data.type } },
      create: data,
      update: { code: data.code, expiresAt: data.expiresAt },
    });
  }

  findVerificationCode(data: {
    email: string;
    code: string;
    type: VerificationCodeType;
  }) {
    return this.prisma.verificationCode.findUnique({
      where: { email_type: { email: data.email, type: data.type } },
    });
  }

  deleteVerificationCode(data: { email: string; type: VerificationCodeType }) {
    return this.prisma.verificationCode.delete({
      where: { email_type: { email: data.email, type: data.type } },
    });
  }
}
