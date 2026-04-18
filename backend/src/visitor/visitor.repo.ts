import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VisitorRepository {
  constructor(private readonly prisma: PrismaService) {}

  recordSlugVisit(visitorId: string, slug: string) {
    return this.prisma.slugVisit.create({ data: { visitorId, slug } });
  }

  recordPostRead(visitorId: string, postId: string) {
    return this.prisma.postRead.create({ data: { visitorId, postId } });
  }

  async upsertProfile(
    visitorId: string,
    tagWeights: Record<string, number>,
    slugWeights: Record<string, number>,
  ) {
    return this.prisma.visitorProfile.upsert({
      where: { id: visitorId },
      create: {
        id: visitorId,
        tagWeights,
        slugWeights,
      },
      update: {
        tagWeights,
        slugWeights,
        lastSeenAt: new Date(),
      },
    });
  }

  findProfile(visitorId: string) {
    return this.prisma.visitorProfile.findUnique({
      where: { id: visitorId },
    });
  }

  findPostTagSlugs(postId: string) {
    return this.prisma.postTag.findMany({
      where: { postId },
      include: { tag: { select: { slug: true } } },
    });
  }

  findTagBySlug(slug: string) {
    return this.prisma.tag.findUnique({ where: { slug } });
  }

  findTagsBySlugs(slugs: string[]) {
    return this.prisma.tag.findMany({
      where: { slug: { in: slugs } },
      select: { slug: true, name: true },
    });
  }

  findSubscriptionByVisitorId(visitorId: string) {
    return this.prisma.subscription.findFirst({ where: { visitorId } });
  }
}
