import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubscriptionRepository {
  constructor(private readonly prisma: PrismaService) {}

  upsert(data: { email: string; tagSlugs: string[]; visitorId?: string }) {
    const { email, tagSlugs, visitorId } = data;
    return this.prisma.subscription.upsert({
      where: { email },
      create: { email, tagSlugs, visitorId },
      update: {
        tagSlugs: { set: tagSlugs },
        ...(visitorId ? { visitorId } : {}),
      },
    });
  }

  findByEmail(email: string) {
    return this.prisma.subscription.findUnique({ where: { email } });
  }

  findAll() {
    return this.prisma.subscription.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  deleteByEmail(email: string) {
    return this.prisma.subscription.delete({ where: { email } });
  }
}
