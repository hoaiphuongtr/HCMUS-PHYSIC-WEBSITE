import { Injectable } from '@nestjs/common';
import { SubscriptionRepository } from './subscription.repo';
import { CreateSubscriptionBodyType } from './subscription.model';
import { SubscriptionNotFoundException } from './subscription.error';

@Injectable()
export class SubscriptionService {
  constructor(private readonly repo: SubscriptionRepository) {}

  create(body: CreateSubscriptionBodyType) {
    const tagSlugs = Array.from(new Set(body.tagSlugs ?? []));
    return this.repo.upsert({
      email: body.email,
      tagSlugs,
      visitorId: body.visitorId,
    });
  }

  async findByEmail(email: string) {
    const sub = await this.repo.findByEmail(email);
    if (!sub) return { tagSlugs: [] };
    return { tagSlugs: sub.tagSlugs };
  }

  findAll() {
    return this.repo.findAll();
  }

  async deleteByEmail(email: string) {
    const existing = await this.repo.findByEmail(email);
    if (!existing) throw SubscriptionNotFoundException;
    await this.repo.deleteByEmail(email);
    return { ok: true };
  }
}
