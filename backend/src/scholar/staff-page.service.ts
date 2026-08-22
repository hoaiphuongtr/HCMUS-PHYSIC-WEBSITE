import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PublicRevalidateService } from '../shared/services/public-revalidate.service';
import {
  NoStaffPageException,
  StaffBlockNotFoundException,
} from './scholar.error';
import type { UpdateStaffPageBodyType } from './scholar.model';

/**
 * Cho giảng viên tự sửa TRANG NHÂN SỰ của chính mình từ app hồ sơ khoa học.
 *
 * Trang nhân sự không phải một thực thể riêng: nó là `PageLayout`, nội dung nằm
 * trong khối `StaffProfileEditorial` bên trong `puckData`. Vì vậy ở đây chỉ đụng
 * ĐÚNG props của khối đó — bố cục, header, footer giữ nguyên. Một lỗi ở đây là
 * hỏng một trang đang chạy thật.
 *
 * Ranh giới quyền: chỉ sửa được layout mà `ScholarProfile.staffPageSlug` của
 * chính người gọi trỏ tới. Không có tham số nào cho phép chỉ định trang khác.
 *
 * Ô `html` (nội dung cũ đổ từ đợt migration) chỉ ĐỌC. Nó vẫn hiển thị trên trang
 * cho tới khi người dùng tự chép sang các ô có cấu trúc — không tự tách, không
 * tự xoá, vì mỗi trang một kiểu và đoán sai là mất nội dung của người ta.
 */

type Localized = { vi?: string; en?: string };
type PuckNode = { type?: string; props?: Record<string, unknown> };

const STAFF_TYPES = ['StaffProfileEditorial', 'StaffProfile'];

const asText = (v: unknown): string => {
  if (typeof v === 'string') return v;
  const l = v as Localized | null | undefined;
  return String(l?.vi ?? l?.en ?? '');
};

/** Giữ nguyên hình dạng song ngữ mà trình dựng trang mong đợi. */
const toLocalized = (vi: string, prev: unknown): Localized => {
  const p = (typeof prev === 'object' && prev ? prev : {}) as Localized;
  return { vi, en: p.en ?? '' };
};

type EntryIn = { title: string; desc?: string };
type PubIn = { year?: string; title: string; meta?: string; url?: string };

@Injectable()
export class StaffPageService {
  private readonly logger = new Logger(StaffPageService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly publicRevalidate: PublicRevalidateService,
  ) {}

  /** Tìm layout của chính người gọi, và vị trí khối hồ sơ trong cây Puck. */
  private async locate(userId: string) {
    const profile = await this.prisma.scholarProfile.findUnique({
      where: { userId },
      select: { staffPageSlug: true },
    });
    if (!profile?.staffPageSlug) throw NoStaffPageException;

    const layout = await this.prisma.pageLayout.findFirst({
      where: { slug: profile.staffPageSlug, deletedAt: null },
      // Trang đã xuất bản là bản người đọc thấy — ưu tiên nó.
      orderBy: [{ isPublished: 'desc' }, { updatedAt: 'desc' }],
      select: { id: true, slug: true, puckData: true },
    });
    if (!layout) throw NoStaffPageException;

    const node = this.findStaffNode(layout.puckData);
    if (!node) throw StaffBlockNotFoundException;
    return { layout, node, slug: profile.staffPageSlug };
  }

  private findStaffNode(root: unknown): PuckNode | null {
    let found: PuckNode | null = null;
    const walk = (n: unknown) => {
      if (found) return;
      if (Array.isArray(n)) return n.forEach(walk);
      if (!n || typeof n !== 'object') return;
      const node = n as PuckNode;
      if (node.type && STAFF_TYPES.includes(node.type)) {
        found = node;
        return;
      }
      for (const v of Object.values(n)) {
        if (v && typeof v === 'object') walk(v);
      }
    };
    walk(root);
    return found;
  }

  async read(userId: string) {
    const { layout, node, slug } = await this.locate(userId);
    const p = node.props ?? {};
    const entries = (key: string): EntryIn[] =>
      ((p[key] ?? []) as Array<Record<string, unknown>>).map((e) => ({
        title: asText(e.title),
        desc: asText(e.desc),
      }));

    return {
      slug,
      layoutId: layout.id,
      photo: String(p.photo ?? ''),
      eyebrow: asText(p.eyebrow),
      name: asText(p.name),
      intro: asText(p.intro),
      research: entries('research'),
      teaching: entries('teaching'),
      extras: ((p.extras ?? []) as Array<Record<string, unknown>>).map((e) => ({
        section: asText(e.section),
        title: asText(e.title),
        desc: asText(e.desc),
      })),
      publications: (
        (p.publications ?? []) as Array<Record<string, unknown>>
      ).map((e) => ({
        year: String(e.year ?? ''),
        title: asText(e.title),
        meta: asText(e.meta),
        url: String(e.url ?? ''),
      })),
      /** Nội dung cũ, CHỈ ĐỌC — xem ghi chú đầu tệp. */
      legacyHtml: asText(p.html),
    };
  }

  async update(userId: string, body: UpdateStaffPageBodyType) {
    const { layout, node, slug } = await this.locate(userId);
    const prev = node.props ?? {};
    const next: Record<string, unknown> = { ...prev };

    if (body.photo !== undefined) next.photo = body.photo ?? '';
    if (body.eyebrow !== undefined) {
      next.eyebrow = toLocalized(body.eyebrow ?? '', prev.eyebrow);
    }
    if (body.intro !== undefined) {
      next.intro = toLocalized(body.intro ?? '', prev.intro);
    }
    for (const key of ['research', 'teaching'] as const) {
      const list = body[key];
      if (!list) continue;
      next[key] = list.map((e: EntryIn) => ({
        title: toLocalized(e.title, null),
        desc: toLocalized(e.desc ?? '', null),
      }));
    }
    if (body.extras) {
      next.extras = body.extras.map((e) => ({
        section: toLocalized(e.section, null),
        title: toLocalized(e.title, null),
        desc: toLocalized(e.desc ?? '', null),
      }));
    }
    if (body.publications) {
      next.publications = body.publications.map((e: PubIn) => ({
        year: String(e.year ?? ''),
        title: toLocalized(e.title, null),
        meta: toLocalized(e.meta ?? '', null),
        url: e.url ?? '',
      }));
    }

    // Thay props TẠI CHỖ trong cây: nhân bản cây rồi đổi đúng một khối, để mọi
    // thứ khác của layout không bị đụng tới.
    const tree = this.replaceProps(layout.puckData, node, next);

    await this.prisma.pageLayout.update({
      where: { id: layout.id },
      data: { puckData: tree as Prisma.InputJsonValue },
    });

    // Trang công khai chạy ISR nên phải báo Next dựng lại, nếu không người đọc
    // vẫn thấy bản cũ tới cả tiếng.
    this.publicRevalidate.trigger([`page:${slug}`, 'sitemap']);

    return this.read(userId);
  }

  /** Nhân bản cây, thay props của đúng một khối (so sánh theo tham chiếu). */
  private replaceProps(
    root: unknown,
    target: PuckNode,
    props: Record<string, unknown>,
  ): unknown {
    if (Array.isArray(root)) {
      return root.map((c) => this.replaceProps(c, target, props));
    }
    if (!root || typeof root !== 'object') return root;
    if (root === target) return { ...(root as PuckNode), props };
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(root as Record<string, unknown>)) {
      out[k] =
        v && typeof v === 'object' ? this.replaceProps(v, target, props) : v;
    }
    return out;
  }

  /** Đổi ảnh chân dung. Ảnh đã được lưu vào uploads/ bởi tầng nhận tệp. */
  async setPhoto(userId: string, url: string) {
    return this.update(userId, { photo: url });
  }
}
