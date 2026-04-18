import { Injectable } from '@nestjs/common';
import { VisitorRepository } from './visitor.repo';

const SLUG_LABELS: Record<string, string> = {
  'hoc-bong': 'Học bổng',
  'tuyen-sinh': 'Tuyển sinh',
  'ban-dan': 'Bán dẫn',
  'nghien-cuu': 'Nghiên cứu',
  'su-kien': 'Sự kiện',
  'tin-tuc': 'Tin tức',
};

@Injectable()
export class VisitorService {
  constructor(private readonly repo: VisitorRepository) {}

  async trackSlug(visitorId: string, slug: string) {
    await this.repo.recordSlugVisit(visitorId, slug);
    const existing = await this.repo.findProfile(visitorId);
    const slugWeights = {
      ...((existing?.slugWeights as Record<string, number>) || {}),
    };
    slugWeights[slug] = (slugWeights[slug] || 0) + 1;

    const tagWeights = {
      ...((existing?.tagWeights as Record<string, number>) || {}),
    };
    const matchedTag = await this.repo.findTagBySlug(slug);
    if (matchedTag) {
      tagWeights[matchedTag.slug] = (tagWeights[matchedTag.slug] || 0) + 1;
    }
    await this.repo.upsertProfile(visitorId, tagWeights, slugWeights);
    return { ok: true };
  }

  async trackPost(visitorId: string, postId: string) {
    await this.repo.recordPostRead(visitorId, postId);
    const postTags = await this.repo.findPostTagSlugs(postId);
    const existing = await this.repo.findProfile(visitorId);
    const tagWeights = {
      ...((existing?.tagWeights as Record<string, number>) || {}),
    };
    for (const pt of postTags) {
      const s = pt.tag.slug;
      tagWeights[s] = (tagWeights[s] || 0) + 1;
    }
    const slugWeights = (existing?.slugWeights as Record<string, number>) || {};
    await this.repo.upsertProfile(visitorId, tagWeights, slugWeights);
    return { ok: true };
  }

  async getProfile(visitorId: string) {
    const profile = await this.repo.findProfile(visitorId);
    const subscription = await this.repo.findSubscriptionByVisitorId(visitorId);
    return {
      tagWeights: (profile?.tagWeights as Record<string, number> | null) || {},
      slugWeights:
        (profile?.slugWeights as Record<string, number> | null) || {},
      subscribedTagSlugs: subscription?.tagSlugs || [],
    };
  }

  async getSuggestions(visitorId: string, limit = 6) {
    const profile = await this.repo.findProfile(visitorId);
    const tagWeights = (profile?.tagWeights as Record<string, number>) || {};
    const slugWeights = (profile?.slugWeights as Record<string, number>) || {};

    const topSlugs = Object.entries(slugWeights)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);
    const suggestedLinks = topSlugs.map(([slug]) => ({
      label: SLUG_LABELS[slug] || slug,
      url: `/${slug}`,
    }));

    const topTagSlugs = Object.entries(tagWeights)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([slug]) => slug);
    const tags =
      topTagSlugs.length > 0
        ? await this.repo.findTagsBySlugs(topTagSlugs)
        : [];
    const labelBySlug = new Map(tags.map((t) => [t.slug, t.name]));
    const hotTags = topTagSlugs.map((slug) => ({
      slug,
      label: labelBySlug.get(slug) || SLUG_LABELS[slug] || slug,
    }));

    return { suggestedLinks, hotTags };
  }
}
