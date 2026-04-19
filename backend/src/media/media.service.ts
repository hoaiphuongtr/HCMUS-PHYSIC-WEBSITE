import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { basename, join } from 'path';
import { MediaRepository } from './media.repo';
import type {
  CreateFromUrlBodyType,
  ListMediaQueryType,
  UpdateMediaBodyType,
  UploadMediaBodyType,
} from './media.model';
import { MediaNotFoundException } from './media.error';

const UPLOADS_DIR = join(process.cwd(), 'uploads');

type FileLike = {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
};

function toMedia(record: Awaited<ReturnType<MediaRepository['findById']>>) {
  if (!record) return null;
  const { mediaTags, ...rest } = record;
  return {
    ...rest,
    tags: mediaTags.map((mt) => ({
      id: mt.tag.id,
      slug: mt.tag.slug,
      name: mt.tag.name,
    })),
  };
}

@Injectable()
export class MediaService {
  constructor(private readonly repo: MediaRepository) {}

  async upload(file: FileLike, body: UploadMediaBodyType, userId: string) {
    const created = await this.repo.create({
      name: file.originalname,
      type: 'IMAGE',
      url: `/uploads/${file.filename}`,
      mimeType: file.mimetype,
      size: file.size,
      alt: body.alt ?? null,
      createdBy: userId,
    });
    if (body.tagSlugs?.length)
      await this.repo.syncTags(created.id, body.tagSlugs);
    const withTags = await this.repo.findById(created.id);
    return toMedia(withTags);
  }

  async createFromUrl(body: CreateFromUrlBodyType, userId: string) {
    const filename = body.url.split('/').pop()?.split('?')[0] || 'remote-image';
    const created = await this.repo.create({
      name: body.name ?? filename,
      type: 'IMAGE',
      url: body.url,
      mimeType: null,
      size: null,
      alt: body.alt ?? null,
      createdBy: userId,
    });
    if (body.tagSlugs?.length)
      await this.repo.syncTags(created.id, body.tagSlugs);
    const withTags = await this.repo.findById(created.id);
    return toMedia(withTags);
  }

  async list(query: ListMediaQueryType) {
    const { items, total } = await this.repo.findPaginated(query);
    return {
      items: items.map((m) => ({
        ...m,
        tags: m.mediaTags.map((mt) => ({
          id: mt.tag.id,
          slug: mt.tag.slug,
          name: mt.tag.name,
        })),
      })),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  async findById(id: string) {
    const record = await this.repo.findById(id);
    if (!record) throw MediaNotFoundException;
    return toMedia(record);
  }

  async update(id: string, body: UpdateMediaBodyType) {
    const existing = await this.repo.findById(id);
    if (!existing) throw MediaNotFoundException;
    const { tagSlugs, ...rest } = body;
    if (Object.keys(rest).length) await this.repo.update(id, rest);
    if (tagSlugs) await this.repo.syncTags(id, tagSlugs);
    const refreshed = await this.repo.findById(id);
    return toMedia(refreshed);
  }

  async delete(id: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw MediaNotFoundException;
    if (existing.url.startsWith('/uploads/')) {
      const filePath = join(UPLOADS_DIR, basename(existing.url));
      await fs.unlink(filePath).catch(() => undefined);
    }
    await this.repo.delete(id);
    return { ok: true };
  }

  listTagsInUse() {
    return this.repo.findTagsInUse();
  }
}
