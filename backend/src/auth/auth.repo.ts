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
    return this.prisma.user.findUnique({ where: { id } });
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
  }) {
    return this.prisma.user.create({ data, omit: { password: true } });
  }

  createUserFromGoogle(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
    googleId: string;
  }) {
    return this.prisma.user.create({ data, omit: { password: true } });
  }

  updateUserPassword(email: string, password: string) {
    return this.prisma.user.update({
      where: { email },
      data: { password },
    });
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
