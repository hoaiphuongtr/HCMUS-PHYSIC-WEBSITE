import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EventBusService } from '../shared/services/event-bus.service';
import { PublicRevalidateService } from '../shared/services/public-revalidate.service';
import {
  NoStaffPageException,
  StaffBlockAmbiguousException,
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

/**
 * Chuỗi trần — URL ảnh, năm. Khác `asText` vốn dành cho ô song ngữ. Gặp object
 * thì trả rỗng: dữ liệu sai hình dạng mà để lọt ra trang thành "[object Object]"
 * còn tệ hơn là bỏ trống.
 */
const asPlain = (v: unknown): string =>
  typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '';

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
    private readonly bus: EventBusService,
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

    // ĐÚNG MỘT khối, không phải "khối đầu tiên". Xem findStaffNodes().
    const nodes = this.findStaffNodes(layout.puckData);
    if (nodes.length === 0) throw StaffBlockNotFoundException;
    if (nodes.length > 1) {
      this.logger.warn(
        `staffPageSlug "${profile.staffPageSlug}" có ${nodes.length} khối hồ sơ — ` +
          `chặn sửa cho user ${userId} để khỏi ghi đè hồ sơ người khác.`,
      );
      throw StaffBlockAmbiguousException;
    }
    return { layout, node: nodes[0], slug: profile.staffPageSlug };
  }

  /**
   * TẤT CẢ khối hồ sơ trong trang, không phải khối đầu tiên.
   *
   * Bản đầu trả về khối đầu tiên tìm thấy. Đúng khi `staffPageSlug` trỏ vào
   * trang riêng của một người — mà hôm nay cả 82 hồ sơ đều vậy, đã kiểm. Nhưng
   * không có gì trong hệ thống buộc phải vậy: slug là ô chữ tự do, và trang
   * `…/nhan-su` (không có tên ai) là trang danh sách cả bộ môn. Trỏ nhầm vào đó
   * thì người này lặng lẽ đổi ảnh và tiểu sử của người đứng đầu danh sách.
   *
   * Đếm rồi chặn thì lỗi nổ ngay lúc mở trang, chứ không phải sau khi đã ghi đè
   * hồ sơ của đồng nghiệp — và không ai đi tìm nổi nguyên nhân.
   */
  private findStaffNodes(root: unknown): PuckNode[] {
    const found: PuckNode[] = [];
    const walk = (n: unknown) => {
      if (Array.isArray(n)) return n.forEach(walk);
      if (!n || typeof n !== 'object') return;
      const node = n as PuckNode;
      if (node.type && STAFF_TYPES.includes(node.type)) {
        found.push(node);
        // Khối hồ sơ không lồng trong khối hồ sơ — khỏi đi sâu thêm.
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
      photo: asPlain(p.photo),
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
        year: asPlain(e.year),
        title: asText(e.title),
        meta: asText(e.meta),
        url: asPlain(e.url),
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
    this.bus.emit('staff-page.changed', { userIds: [userId], key: slug });

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

  /**
   * Sinh danh sách công bố (và đề tài) trên trang TỪ CHÍNH cơ sở dữ liệu.
   *
   * Trước đây trang nhân sự giữ một danh sách gõ tay riêng — tức là bản sao thứ
   * hai của cùng dữ liệu, sớm muộn cũng lệch với mục "Công bố của tôi". Giờ nó
   * được sinh ra, và người dùng điều khiển bằng hai thứ:
   *   · cờ `showOnWeb` trên từng bài / từng đề tài
   *   · `fromYear` để giới hạn phạm vi (vd 5 năm gần nhất)
   *
   * Ghi đè hẳn danh sách cũ — đó là điểm mấu chốt, vì mục đích là bỏ bản chép
   * tay đi. Giao diện phải nói rõ điều này trước khi người dùng bấm.
   */
  async syncFromDatabase(
    userId: string,
    opts: { fromYear?: number | null; includeProjects?: boolean } = {},
  ) {
    const pubs = await this.prisma.publicationAuthor.findMany({
      where: {
        userId,
        claimStatus: 'CONFIRMED',
        showOnWeb: true,
        publication: {
          deletedAt: null,
          ...(opts.fromYear ? { countYear: { gte: opts.fromYear } } : {}),
        },
      },
      include: { publication: true },
    });

    const publications = pubs
      .map((r) => r.publication)
      .sort((a, b) => (b.countYear ?? 0) - (a.countYear ?? 0))
      .map((p) => ({
        year: p.countYear ? String(p.countYear) : '',
        title: p.title,
        // Dòng phụ dựng từ dữ liệu thư mục, không bắt người dùng gõ lại.
        meta: [
          p.containerTitle,
          p.volume ? `Tập ${p.volume}` : null,
          p.issue ? `số ${p.issue}` : null,
          p.pages ? `tr. ${p.pages}` : null,
          p.doi ? `DOI ${p.doi}` : null,
        ]
          .filter(Boolean)
          .join(', '),
        url: p.url ?? (p.doi ? `https://doi.org/${p.doi}` : ''),
      }));

    let projectEntries: Array<{
      section: string;
      title: string;
      desc: string;
    }> = [];
    if (opts.includeProjects) {
      const members = await this.prisma.projectMember.findMany({
        where: {
          userId,
          claimStatus: 'CONFIRMED',
          showOnWeb: true,
          project: {
            deletedAt: null,
            ...(opts.fromYear ? { startYear: { gte: opts.fromYear } } : {}),
          },
        },
        include: { project: true },
      });
      const roleVi = {
        LEAD: 'Chủ nhiệm',
        SECRETARY: 'Thư ký',
        MEMBER: 'Thành viên',
      };
      projectEntries = members
        .sort((a, b) => (b.project.startYear ?? 0) - (a.project.startYear ?? 0))
        .map((m) => ({
          section: 'Đề tài, dự án',
          title: m.project.title,
          desc: [
            m.project.code,
            m.project.funder,
            roleVi[m.role],
            m.project.startYear ? `từ ${m.project.startYear}` : null,
          ]
            .filter(Boolean)
            .join(' · '),
        }));
    }

    const { node, layout, slug } = await this.locate(userId);
    const prev = node.props ?? {};
    // Giữ nguyên các mục extras KHÁC do người dùng tự đặt; chỉ thay phần đề tài.
    const keptExtras = (
      (prev.extras ?? []) as Array<Record<string, unknown>>
    ).filter((e) => !/đề tài|de tai|project/i.test(asText(e.section)));

    const next: Record<string, unknown> = {
      ...prev,
      publications: publications.map((e) => ({
        year: e.year,
        title: toLocalized(e.title, null),
        meta: toLocalized(e.meta, null),
        url: e.url,
      })),
      ...(opts.includeProjects
        ? {
            extras: [
              ...keptExtras,
              ...projectEntries.map((e) => ({
                section: toLocalized(e.section, null),
                title: toLocalized(e.title, null),
                desc: toLocalized(e.desc, null),
              })),
            ],
          }
        : {}),
    };

    await this.prisma.pageLayout.update({
      where: { id: layout.id },
      data: {
        puckData: this.replaceProps(
          layout.puckData,
          node,
          next,
        ) as Prisma.InputJsonValue,
      },
    });
    this.publicRevalidate.trigger([`page:${slug}`, 'sitemap']);
    this.bus.emit('staff-page.changed', { userIds: [userId], key: slug });
    return this.read(userId);
  }

  /** Đổi ảnh chân dung. Ảnh đã được lưu vào uploads/ bởi tầng nhận tệp. */
  async setPhoto(userId: string, url: string) {
    return this.update(userId, { photo: url });
  }
}
