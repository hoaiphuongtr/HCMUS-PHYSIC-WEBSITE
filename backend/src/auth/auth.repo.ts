import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../generated/prisma/client';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUniqueUserByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
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
}
