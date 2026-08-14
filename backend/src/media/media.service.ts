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
import {
  canAccessDepartment,
  FACULTY_DEPT_ID,
  isFacultyWide,
  mediaScopeWhere,
} from '../shared/helpers';

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

  async upload(
    file: FileLike,
    body: UploadMediaBodyType,
    userId: string,
    departmentId: string | null,
    roleName: string,
  ) {
    const created = await this.repo.create({
      name: file.originalname,
      type: 'IMAGE',
      url: `/uploads/${file.filename}`,
      mimeType: file.mimetype,
      size: file.size,
      alt: body.alt ?? null,
      createdBy: userId,
      departmentId: this.resolveTargetDept(
        roleName,
        departmentId,
        body.departmentId,
      ),
    });
    if (body.tagSlugs?.length)
      await this.repo.syncTags(created.id, body.tagSlugs);
    const withTags = await this.repo.findById(created.id);
    return toMedia(withTags);
  }

  // Chỉ admin toàn khoa mới lưu ảnh sang bộ môn khác; còn lại luôn dùng kho của
  // chính mình (bỏ qua departmentId gửi lên).
  private resolveTargetDept(
    roleName: string,
    userDept: string | null,
    target: string | null | undefined,
  ): string | null {
    if (target && isFacultyWide(roleName, userDept)) return target;
    return userDept ?? null;
  }

  async createFromUrl(
    body: CreateFromUrlBodyType,
    userId: string,
    departmentId: string | null,
    roleName: string,
  ) {
    const filename = body.url.split('/').pop()?.split('?')[0] || 'remote-image';
    const created = await this.repo.create({
      name: body.name ?? filename,
      type: 'IMAGE',
      url: body.url,
      mimeType: null,
      size: null,
      alt: body.alt ?? null,
      createdBy: userId,
      departmentId: this.resolveTargetDept(
        roleName,
        departmentId,
        body.departmentId,
      ),
    });
    if (body.tagSlugs?.length)
      await this.repo.syncTags(created.id, body.tagSlugs);
    const withTags = await this.repo.findById(created.id);
    return toMedia(withTags);
  }

  async list(
    query: ListMediaQueryType,
    userId: string,
    roleName: string,
    departmentId: string | null,
  ) {
    const scope = mediaScopeWhere(roleName, departmentId);
    // Lọc theo kho bộ môn được chọn. "Khoa" (FACULTY_DEPT_ID) gồm cả ảnh dùng
    // chung (departmentId null). Quyền vẫn do `scope` chặn ở tầng trên.
    let deptFilter: Record<string, unknown> | undefined;
    if (query.departmentId) {
      deptFilter =
        query.departmentId === FACULTY_DEPT_ID
          ? { OR: [{ departmentId: FACULTY_DEPT_ID }, { departmentId: null }] }
          : { departmentId: query.departmentId };
    }
    const { items, total } = await this.repo.findPaginated(
      query,
      scope,
      deptFilter,
    );
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

  async findById(
    id: string,
    userId: string,
    roleName: string,
    departmentId: string | null,
  ) {
    const record = await this.repo.findById(id);
    if (!record) throw MediaNotFoundException;
    // read: own dept + shared faculty/null are viewable
    const viewable =
      roleName === 'SUPER_ADMIN' ||
      record.departmentId === null ||
      record.departmentId === 'dept_legacy_1' ||
      record.departmentId === departmentId;
    if (!viewable) throw MediaNotFoundException;
    return toMedia(record);
  }

  async update(
    id: string,
    body: UpdateMediaBodyType,
    userId: string,
    roleName: string,
    departmentId: string | null,
  ) {
    const existing = await this.repo.findById(id);
    if (!existing) throw MediaNotFoundException;
    if (!canAccessDepartment(roleName, departmentId, existing.departmentId)) {
      throw MediaNotFoundException;
    }
    const { tagSlugs, ...rest } = body;
    if (Object.keys(rest).length) await this.repo.update(id, rest);
    if (tagSlugs) await this.repo.syncTags(id, tagSlugs);
    const refreshed = await this.repo.findById(id);
    return toMedia(refreshed);
  }

  async delete(
    id: string,
    userId: string,
    roleName: string,
    departmentId: string | null,
  ) {
    const existing = await this.repo.findById(id);
    if (!existing) throw MediaNotFoundException;
    if (!canAccessDepartment(roleName, departmentId, existing.departmentId)) {
      throw MediaNotFoundException;
    }
    if (existing.url.startsWith('/uploads/')) {
      const filePath = join(UPLOADS_DIR, basename(existing.url));
      await fs.unlink(filePath).catch(() => undefined);
    }
    await this.repo.delete(id);
    return { ok: true };
  }

  listTagsInUse(userId: string, roleName: string, departmentId: string | null) {
    return this.repo.findTagsInUse(mediaScopeWhere(roleName, departmentId));
  }
}
