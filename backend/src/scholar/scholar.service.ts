import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PublicRevalidateService } from '../shared/services/public-revalidate.service';
import {
  matchAuthors,
  normalizeName,
  suggestNameVariants,
  type CandidateProfile,
} from './name-match';
import { parseBibliographyFile } from './resolve/bibliography';
import { ResolveService } from './resolve/resolve.service';
import {
  normalizeDoi,
  resolveCountYear,
  type ResolvedWork,
} from './resolve/work';
import {
  CannotResolveException,
  NoClaimException,
  NoOrcidException,
  NotAnAuthorException,
  NotEligibleRepresentativeException,
  OrcidTakenException,
  PublicationNotFoundException,
  TooFewAuthorsException,
} from './scholar.error';
import type {
  ClaimResponseBodyType,
  CreatePublicationBodyType,
  IntegrationQueryType,
  ListPublicationsQueryType,
  OrcidImportBodyType,
  SetNameVariantsBodyType,
  UpdatePublicationBodyType,
  UpdateScholarProfileBodyType,
} from './scholar.model';

type AuthorRow = {
  family?: string | null;
  given?: string | null;
  name?: string | null;
  orcid?: string | null;
  sequence?: 'first' | 'additional' | null;
  affiliation?: string | null;
};

/** Một chỗ khai báo duy nhất cho phần include, để kiểu suy ra được thay vì `any`. */
const AUTHOR_INCLUDE = {
  authors: {
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
    },
    orderBy: { authorIndex: 'asc' },
  },
} satisfies Prisma.PublicationInclude;

type PublicationWithAuthors = Prisma.PublicationGetPayload<{
  include: typeof AUTHOR_INCLUDE;
}>;

@Injectable()
export class ScholarService {
  private readonly logger = new Logger(ScholarService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly resolver: ResolveService,
    private readonly publicRevalidate: PublicRevalidateService,
  ) {}

  // ── Lý lịch khoa học ──────────────────────────────────────────────────────
  /** Tự tạo hồ sơ rỗng ở lần gọi đầu — giảng viên không phải bấm "tạo hồ sơ". */
  async getProfile(userId: string) {
    const existing = await this.prisma.scholarProfile.findUnique({
      where: { userId },
      include: { nameVariants: { orderBy: { isPrimary: 'desc' } } },
    });
    if (existing) return existing;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });
    const fullName = [user?.lastName, user?.firstName]
      .filter(Boolean)
      .join(' ');

    return this.prisma.scholarProfile.create({
      data: {
        userId,
        // Gợi sẵn các dạng tên hay dùng để người mới vào có cái mà bỏ bớt, thay
        // vì đối diện một danh sách trống.
        nameVariants: {
          create: suggestNameVariants(fullName).map((raw, i) => ({
            raw,
            normalized: normalizeName(raw),
            isPrimary: i === 0,
          })),
        },
      },
      include: { nameVariants: { orderBy: { isPrimary: 'desc' } } },
    });
  }

  async updateProfile(userId: string, body: UpdateScholarProfileBodyType) {
    await this.getProfile(userId);
    if (body.orcid) {
      const clash = await this.prisma.scholarProfile.findFirst({
        where: { orcid: body.orcid, userId: { not: userId } },
        select: { id: true },
      });
      if (clash) throw OrcidTakenException;
    }
    await this.prisma.scholarProfile.update({
      where: { userId },
      data: {
        orcid: body.orcid ?? undefined,
        scopusAuthorId: body.scopusAuthorId ?? undefined,
        researcherId: body.researcherId ?? undefined,
        googleScholarId: body.googleScholarId ?? undefined,
        researchGateUrl: body.researchGateUrl ?? undefined,
        staffPageSlug: body.staffPageSlug ?? undefined,
        showOnWeb: body.showOnWeb ?? undefined,
        // Từ đây trở xuống: `undefined` = không đụng tới, `null` = xoá đi. Phải
        // phân biệt "không gửi" với "gửi null", nên không dùng ?? được.
        affiliationType:
          body.affiliationType === undefined ? undefined : body.affiliationType,
        homeInstitution:
          body.homeInstitution === undefined ? undefined : body.homeInstitution,
        gradStudyLevel:
          body.gradStudyLevel === undefined ? undefined : body.gradStudyLevel,
        gradStudyField:
          body.gradStudyField === undefined ? undefined : body.gradStudyField,
        gradStudyInstitution:
          body.gradStudyInstitution === undefined
            ? undefined
            : body.gradStudyInstitution,
        gradStudyCountry:
          body.gradStudyCountry === undefined
            ? undefined
            : body.gradStudyCountry,
        gradStudyStartYear:
          body.gradStudyStartYear === undefined
            ? undefined
            : body.gradStudyStartYear,
        gradStudyEndYear:
          body.gradStudyEndYear === undefined
            ? undefined
            : body.gradStudyEndYear,
        gradStudyFullTime: body.gradStudyFullTime ?? undefined,
        gradStudyNote:
          body.gradStudyNote === undefined ? undefined : body.gradStudyNote,
      },
    });
    return this.getProfile(userId);
  }

  /** Thay cả bộ tên thường dùng — đơn giản hơn hẳn thêm/xoá từng dòng. */
  async setNameVariants(userId: string, body: SetNameVariantsBodyType) {
    const profile = await this.getProfile(userId);
    const primaryNorm = body.primary ? normalizeName(body.primary) : null;

    // Chuẩn hoá rồi khử trùng: hai cách gõ khác nhau của cùng một tên là một.
    const seen = new Map<string, string>();
    for (const raw of body.variants) {
      const norm = normalizeName(raw);
      if (norm.length >= 2 && !seen.has(norm)) seen.set(norm, raw.trim());
    }

    await this.prisma.$transaction([
      this.prisma.scholarNameVariant.deleteMany({
        where: { profileId: profile.id },
      }),
      this.prisma.scholarNameVariant.createMany({
        data: [...seen.entries()].map(([normalized, raw], i) => ({
          profileId: profile.id,
          raw,
          normalized,
          isPrimary: primaryNorm ? normalized === primaryNorm : i === 0,
        })),
      }),
    ]);
    return this.getProfile(userId);
  }

  // ── Tra cứu ───────────────────────────────────────────────────────────────
  async resolveOne(userId: string, input: string) {
    const work = await this.resolver.resolve(input);
    if (!work) throw CannotResolveException;
    return this.decorate(work, userId);
  }

  async importFile(userId: string, content: string) {
    const works = parseBibliographyFile(content);
    const items = [];
    for (const w of works) items.push(await this.decorate(w, userId));
    return {
      items,
      // Mục thiếu tiêu đề bị bộ đọc bỏ qua — báo số lượng để người dùng biết
      // file của họ không vào trọn vẹn.
      skipped: Math.max(0, countEntries(content) - works.length),
    };
  }

  async importFromOrcid(userId: string, body: OrcidImportBodyType) {
    const profile = await this.getProfile(userId);
    const orcid = body.orcid ?? profile.orcid;
    if (!orcid) throw NoOrcidException;

    const works = await this.resolver.byOrcid(orcid, body.limit ?? 100);
    const items = [];
    for (const w of works) items.push(await this.decorate(w, userId));

    await this.prisma.scholarProfile.update({
      where: { userId },
      data: { lastOrcidSyncAt: new Date() },
    });
    return { items, skipped: 0 };
  }

  /**
   * Gắn thêm hai thứ vào kết quả tra: bài này đã có trong CSDL chưa (trùng DOI),
   * và những ai trong Khoa có thể đang đứng tên trong đó.
   */
  private async decorate(work: ResolvedWork, userId: string) {
    const doi = normalizeDoi(work.doi);
    const existing = doi
      ? await this.prisma.publication.findFirst({
          where: { doi, deletedAt: null },
          select: { id: true },
        })
      : null;

    const candidates = await this.candidates();
    const byId = new Map(candidates.map((c) => [c.userId, c]));
    const matches = matchAuthors(work.authors ?? [], candidates);

    return {
      work,
      existingPublicationId: existing?.id ?? null,
      suggestions: matches.map((m) => ({
        ...m,
        displayName: byId.get(m.userId)?.displayName ?? '',
        email: byId.get(m.userId)?.email ?? '',
        isMe: m.userId === userId,
      })),
    };
  }

  /** Danh sách người có hồ sơ khoa học, dùng để dò tên tác giả. */
  private async candidates(): Promise<
    Array<CandidateProfile & { email: string }>
  > {
    const rows = await this.prisma.scholarProfile.findMany({
      where: { user: { isActive: true } },
      select: {
        userId: true,
        orcid: true,
        nameVariants: { select: { normalized: true } },
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });
    return rows.map((r) => ({
      userId: r.userId,
      orcid: r.orcid,
      normalizedVariants: r.nameVariants.map((v) => v.normalized),
      displayName: [r.user.lastName, r.user.firstName]
        .filter(Boolean)
        .join(' '),
      email: r.user.email,
    }));
  }

  // ── Công trình ────────────────────────────────────────────────────────────
  async create(userId: string, body: CreatePublicationBodyType) {
    const w = body.work;
    const doi = normalizeDoi(w.doi);

    // Bài đã có (đồng nghiệp khai trước) → KHÔNG tạo bản thứ hai, chỉ gắn thêm
    // người gọi vào bài đó. Đây là điểm mấu chốt: một bài dùng chung cho cả nhóm.
    if (doi) {
      const existing = await this.prisma.publication.findFirst({
        where: { doi, deletedAt: null },
        select: { id: true },
      });
      if (existing) {
        await this.attachSelf(existing.id, userId, body);
        // Bài đã có nhưng CHƯA phân loại (ví dụ do nhập hàng loạt từ trang nhân
        // sự) mà người khai có chọn mã — áp vào luôn, đừng bắt họ vào màn khác
        // chọn lại đúng thứ vừa chọn.
        if (body.catalogCode) {
          await this.prisma.publication.updateMany({
            where: { id: existing.id, catalogCode: null },
            data: {
              catalogCode: body.catalogCode,
              quartile: body.quartile ?? null,
              classifiedBy: userId,
              classifiedAt: new Date(),
            },
          });
        }
        await this.recount(existing.id);
        return this.findOne(existing.id, userId);
      }
    }

    const authorsRaw = (w.authors ?? []) as unknown as Prisma.InputJsonValue;
    const publishedYear = body.publishedYear ?? w.publishedYear ?? null;
    const acceptedYear = body.acceptedYear ?? w.acceptedYear ?? null;

    const created = await this.prisma.publication.create({
      data: {
        doi,
        arxivId: w.arxivId ?? null,
        isbn: w.isbn ?? null,
        issn: w.issn ?? null,
        type: w.type || 'journal-article',
        title: w.title,
        containerTitle: w.containerTitle ?? null,
        volume: w.volume ?? null,
        issue: w.issue ?? null,
        pages: w.pages ?? null,
        publisher: w.publisher ?? null,
        url: w.url ?? null,
        status: body.status,
        publishedYear,
        publishedMonth: body.publishedMonth ?? w.publishedMonth ?? null,
        acceptedYear,
        acceptedMonth: body.acceptedMonth ?? w.acceptedMonth ?? null,
        countYear: resolveCountYear({ publishedYear, acceptedYear }),
        authorsRaw,
        source: w.source || 'manual',
        raw: (w as { raw?: unknown }).raw as Prisma.InputJsonValue,
        totalAuthors: body.totalAuthors ?? Math.max(1, w.authors?.length ?? 1),
        // Phân loại chọn ngay lúc khai. Để trống vẫn lưu được, chỉ là bài đó
        // chưa lọt vào API tích hợp nên chưa tính KPI.
        catalogCode: body.catalogCode ?? null,
        quartile: body.quartile ?? null,
        classifiedBy: body.catalogCode ? userId : null,
        classifiedAt: body.catalogCode ? new Date() : null,
        satellite: body.satellite ?? false,
        reprint: body.reprint ?? false,
        fromProject: body.fromProject ?? false,
        stage: body.stage ?? 0,
        createdBy: userId,
      },
      select: { id: true },
    });

    await this.attachSelf(created.id, userId, body);
    await this.invite(created.id, userId, body.coAuthorUserIds ?? []);
    await this.recount(created.id);
    return this.findOne(created.id, userId);
  }

  /** Người tự khai được CONFIRMED ngay — họ đang nói về chính mình. */
  private async attachSelf(
    publicationId: string,
    userId: string,
    body: { me: CreatePublicationBodyType['me'] },
  ) {
    const me = body.me;
    this.assertRepresentative(me);
    await this.prisma.publicationAuthor.upsert({
      where: { publicationId_userId: { publicationId, userId } },
      create: {
        publicationId,
        userId,
        authorIndex: me.authorIndex ?? -1,
        isFirst: me.isFirst ?? false,
        isCorresponding: me.isCorresponding ?? false,
        isLast: me.isLast ?? false,
        sharePercent: me.sharePercent ?? null,
        showOnWeb: me.showOnWeb ?? true,
        claimStatus: 'CONFIRMED',
        respondedAt: new Date(),
      },
      update: {
        authorIndex: me.authorIndex ?? undefined,
        isFirst: me.isFirst ?? undefined,
        isCorresponding: me.isCorresponding ?? undefined,
        isLast: me.isLast ?? undefined,
        sharePercent: me.sharePercent ?? undefined,
        showOnWeb: me.showOnWeb ?? undefined,
        claimStatus: 'CONFIRMED',
        respondedAt: new Date(),
      },
    });
  }

  /**
   * Gắn tên đồng nghiệp vào bài → họ ở PENDING. Người khai KHÔNG thay mặt đồng
   * nghiệp xác nhận được: giờ NCKH là quyền lợi của từng người, phải chính chủ
   * bấm đồng ý.
   */
  private async invite(
    publicationId: string,
    invitedBy: string,
    userIds: string[],
  ) {
    const others = [...new Set(userIds)].filter((id) => id && id !== invitedBy);
    if (!others.length) return;
    await this.prisma.publicationAuthor.createMany({
      data: others.map((userId) => ({
        publicationId,
        userId,
        invitedBy,
        claimStatus: 'PENDING' as const,
      })),
      skipDuplicates: true,
    });
  }

  private assertRepresentative(me?: Partial<CreatePublicationBodyType['me']>) {
    if (!me?.sharePercent) return;
    if (!me.isFirst && !me.isCorresponding && !me.isLast) {
      throw NotEligibleRepresentativeException;
    }
  }

  /**
   * Cập nhật các con số suy ra được từ danh sách tác giả đã xác nhận.
   *
   *   schoolAuthors      — luôn ít nhất bằng số người đã xác nhận, nhưng có thể
   *                        cao hơn nếu bài còn sinh viên/học viên thuộc Trường
   *                        không có tài khoản. Vì vậy chỉ NÂNG, không hạ.
   *   mainAuthorAtSchool — true khi có người đã xác nhận giữ vai trò First,
   *                        Corresponding hoặc Last. Người dùng vẫn đặt tay được
   *                        (tác giả chính có thể là người ngoài hệ thống).
   */
  private async recount(publicationId: string) {
    const pub = await this.prisma.publication.findUnique({
      where: { id: publicationId },
      select: { schoolAuthors: true, totalAuthors: true },
    });
    if (!pub) return;

    const confirmed = await this.prisma.publicationAuthor.findMany({
      where: { publicationId, claimStatus: 'CONFIRMED' },
      select: { isFirst: true, isCorresponding: true, isLast: true },
    });
    const schoolAuthors = Math.max(pub.schoolAuthors, confirmed.length, 1);

    await this.prisma.publication.update({
      where: { id: publicationId },
      data: {
        schoolAuthors,
        totalAuthors: Math.max(pub.totalAuthors, schoolAuthors),
        mainAuthorAtSchool: confirmed.some(
          (a) => a.isFirst || a.isCorresponding || a.isLast,
        ),
      },
    });
  }

  async update(userId: string, id: string, body: UpdatePublicationBodyType) {
    await this.assertConfirmedAuthor(id, userId);
    const current = await this.prisma.publication.findUnique({
      where: { id },
      select: {
        publishedYear: true,
        acceptedYear: true,
        catalogCode: true,
        schoolAuthors: true,
      },
    });
    if (!current) throw PublicationNotFoundException;

    if (
      body.totalAuthors !== undefined &&
      body.totalAuthors < (body.schoolAuthors ?? current.schoolAuthors)
    ) {
      throw TooFewAuthorsException;
    }
    this.assertRepresentative(body.me);

    const publishedYear =
      body.publishedYear === undefined
        ? current.publishedYear
        : body.publishedYear;
    const acceptedYear =
      body.acceptedYear === undefined
        ? current.acceptedYear
        : body.acceptedYear;

    // Ghi lại ai phân loại và lúc nào — con số KPI phải truy được nguồn gốc.
    const classifying =
      body.catalogCode !== undefined &&
      body.catalogCode !== current.catalogCode;

    await this.prisma.publication.update({
      where: { id },
      data: {
        title: body.title ?? undefined,
        containerTitle: body.containerTitle ?? undefined,
        volume: body.volume ?? undefined,
        issue: body.issue ?? undefined,
        pages: body.pages ?? undefined,
        publisher: body.publisher ?? undefined,
        url: body.url ?? undefined,
        issn: body.issn ?? undefined,
        status: body.status ?? undefined,
        publishedYear,
        publishedMonth:
          body.publishedMonth === undefined ? undefined : body.publishedMonth,
        acceptedYear,
        acceptedMonth:
          body.acceptedMonth === undefined ? undefined : body.acceptedMonth,
        countYear: resolveCountYear({ publishedYear, acceptedYear }),
        catalogCode:
          body.catalogCode === undefined ? undefined : body.catalogCode,
        quartile: body.quartile === undefined ? undefined : body.quartile,
        classifiedBy: classifying ? userId : undefined,
        classifiedAt: classifying ? new Date() : undefined,
        satellite: body.satellite ?? undefined,
        reprint: body.reprint ?? undefined,
        fromProject: body.fromProject ?? undefined,
        stage: body.stage ?? undefined,
        totalAuthors: body.totalAuthors ?? undefined,
        schoolAuthors: body.schoolAuthors ?? undefined,
        mainAuthorAtSchool: body.mainAuthorAtSchool ?? undefined,
      },
    });

    if (body.me) await this.attachSelf(id, userId, { me: body.me as never });
    if (body.coAuthorUserIds)
      await this.invite(id, userId, body.coAuthorUserIds);
    if (body.mainAuthorAtSchool === undefined) await this.recount(id);

    await this.revalidateStaffPages(id);
    return this.findOne(id, userId);
  }

  /** Xoá mềm, và chỉ gỡ tên MÌNH nếu bài còn tác giả khác đã xác nhận. */
  async remove(userId: string, id: string) {
    await this.assertConfirmedAuthor(id, userId);
    const others = await this.prisma.publicationAuthor.count({
      where: {
        publicationId: id,
        claimStatus: 'CONFIRMED',
        userId: { not: userId },
      },
    });

    if (others > 0) {
      await this.prisma.publicationAuthor.updateMany({
        where: { publicationId: id, userId },
        data: { claimStatus: 'REJECTED', respondedAt: new Date() },
      });
      await this.recount(id);
    } else {
      await this.prisma.publication.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    }
    await this.revalidateStaffPages(id);
    return { removed: true, sharedWithOthers: others > 0 };
  }

  // ── Đọc ───────────────────────────────────────────────────────────────────
  async list(userId: string, query: ListPublicationsQueryType) {
    const where: Prisma.PublicationWhereInput = {
      deletedAt: null,
      authors: {
        some: {
          userId,
          claimStatus:
            query.filter === 'pending'
              ? 'PENDING'
              : { in: ['CONFIRMED', 'PENDING'] },
        },
      },
    };
    if (query.year) where.countYear = query.year;
    if (query.status) where.status = query.status;
    if (query.filter === 'unclassified') where.catalogCode = null;
    if (query.filter === 'classified') where.catalogCode = { not: null };
    if (query.q) {
      where.OR = [
        { title: { contains: query.q, mode: 'insensitive' } },
        { containerTitle: { contains: query.q, mode: 'insensitive' } },
        { doi: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    const [rows, total, unclassified] = await Promise.all([
      this.prisma.publication.findMany({
        where,
        include: this.authorInclude,
        orderBy: [{ countYear: 'desc' }, { createdAt: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.publication.count({ where }),
      this.prisma.publication.count({
        where: {
          deletedAt: null,
          catalogCode: null,
          authors: { some: { userId, claimStatus: 'CONFIRMED' } },
          ...(query.year ? { countYear: query.year } : {}),
        },
      }),
    ]);

    return {
      items: rows.map((r) => this.shape(r, userId)),
      total,
      unclassified,
    };
  }

  async findOne(id: string, userId: string) {
    const row = await this.prisma.publication.findFirst({
      where: { id, deletedAt: null },
      include: this.authorInclude,
    });
    if (!row) throw PublicationNotFoundException;
    return this.shape(row, userId);
  }

  private get authorInclude() {
    return AUTHOR_INCLUDE;
  }

  private shape(row: PublicationWithAuthors, userId: string) {
    const mine = row.authors.find((a) => a.userId === userId);
    return {
      ...row,
      authorsRaw: (row.authorsRaw ?? []) as AuthorRow[],
      isClassified: Boolean(row.catalogCode),
      myClaimStatus: mine?.claimStatus ?? null,
      authors: row.authors.map((a) => ({
        id: a.id,
        userId: a.userId,
        displayName: [a.user?.lastName, a.user?.firstName]
          .filter(Boolean)
          .join(' '),
        email: a.user?.email ?? '',
        authorIndex: a.authorIndex,
        isFirst: a.isFirst,
        isCorresponding: a.isCorresponding,
        isLast: a.isLast,
        sharePercent: a.sharePercent,
        claimStatus: a.claimStatus,
        invitedBy: a.invitedBy,
        respondedAt: a.respondedAt,
        showOnWeb: a.showOnWeb,
      })),
    };
  }

  private async assertConfirmedAuthor(publicationId: string, userId: string) {
    const row = await this.prisma.publicationAuthor.findUnique({
      where: { publicationId_userId: { publicationId, userId } },
      select: { claimStatus: true },
    });
    if (!row || row.claimStatus !== 'CONFIRMED') throw NotAnAuthorException;
  }

  // ── Xác nhận tác giả ──────────────────────────────────────────────────────
  /** "Có bài nào đang chờ bạn xác nhận không?" */
  async pendingClaims(userId: string) {
    const rows = await this.prisma.publicationAuthor.findMany({
      where: {
        userId,
        claimStatus: 'PENDING',
        publication: { deletedAt: null },
      },
      include: {
        publication: {
          select: {
            id: true,
            title: true,
            containerTitle: true,
            countYear: true,
            doi: true,
            authorsRaw: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const inviterIds = [
      ...new Set(rows.map((r) => r.invitedBy).filter(Boolean)),
    ];
    const inviters = await this.prisma.user.findMany({
      where: { id: { in: inviterIds as string[] } },
      select: { id: true, firstName: true, lastName: true },
    });
    const nameOf = new Map(
      inviters.map((u) => [
        u.id,
        [u.lastName, u.firstName].filter(Boolean).join(' '),
      ]),
    );

    // Gợi ý sẵn "bạn là tác giả thứ mấy" để người xác nhận chỉ phải bấm đồng ý.
    const me = await this.prisma.scholarProfile.findUnique({
      where: { userId },
      select: {
        orcid: true,
        nameVariants: { select: { normalized: true } },
        user: { select: { firstName: true, lastName: true } },
      },
    });
    const self: CandidateProfile[] = me
      ? [
          {
            userId,
            orcid: me.orcid,
            normalizedVariants: me.nameVariants.map((v) => v.normalized),
            displayName: [me.user.lastName, me.user.firstName]
              .filter(Boolean)
              .join(' '),
          },
        ]
      : [];

    return rows.map((r) => {
      const authors = (r.publication.authorsRaw ?? []) as AuthorRow[];
      const hit = self.length ? matchAuthors(authors, self)[0] : undefined;
      return {
        publicationId: r.publication.id,
        title: r.publication.title,
        containerTitle: r.publication.containerTitle,
        year: r.publication.countYear,
        doi: r.publication.doi,
        invitedBy: r.invitedBy,
        invitedByName: r.invitedBy ? (nameOf.get(r.invitedBy) ?? null) : null,
        authorsRaw: authors,
        suggestedAuthorIndex: hit?.authorIndex ?? r.authorIndex,
      };
    });
  }

  async respondToClaim(
    userId: string,
    publicationId: string,
    body: ClaimResponseBodyType,
  ) {
    const row = await this.prisma.publicationAuthor.findUnique({
      where: { publicationId_userId: { publicationId, userId } },
      select: { claimStatus: true },
    });
    if (!row) throw NoClaimException;

    const a = body.authorship ?? {};
    this.assertRepresentative(a);

    await this.prisma.publicationAuthor.update({
      where: { publicationId_userId: { publicationId, userId } },
      data: {
        claimStatus: body.accept ? 'CONFIRMED' : 'REJECTED',
        respondedAt: new Date(),
        authorIndex: body.accept ? (a.authorIndex ?? undefined) : undefined,
        isFirst: body.accept ? (a.isFirst ?? undefined) : false,
        isCorresponding: body.accept ? (a.isCorresponding ?? undefined) : false,
        isLast: body.accept ? (a.isLast ?? undefined) : false,
        sharePercent: body.accept ? (a.sharePercent ?? undefined) : null,
        showOnWeb: body.accept ? (a.showOnWeb ?? undefined) : false,
      },
    });
    await this.recount(publicationId);
    await this.revalidateStaffPages(publicationId);
    return this.findOne(publicationId, userId);
  }

  // ── Thống kê ──────────────────────────────────────────────────────────────
  async stats(userId?: string) {
    const scope: Prisma.PublicationWhereInput = {
      deletedAt: null,
      ...(userId
        ? { authors: { some: { userId, claimStatus: 'CONFIRMED' as const } } }
        : {}),
    };

    const [byYearRaw, byQuartileRaw, byStatusRaw, classifiedRaw] =
      await Promise.all([
        this.prisma.publication.groupBy({
          by: ['countYear'],
          where: scope,
          _count: { _all: true },
        }),
        this.prisma.publication.groupBy({
          by: ['quartile'],
          where: scope,
          _count: { _all: true },
        }),
        this.prisma.publication.groupBy({
          by: ['status'],
          where: scope,
          _count: { _all: true },
        }),
        this.prisma.publication.groupBy({
          by: ['countYear'],
          where: { ...scope, catalogCode: { not: null } },
          _count: { _all: true },
        }),
      ]);

    const classifiedByYear = new Map(
      classifiedRaw.map((r) => [r.countYear, r._count._all]),
    );

    return {
      byYear: byYearRaw
        .map((r) => ({
          year: r.countYear,
          total: r._count._all,
          classified: classifiedByYear.get(r.countYear) ?? 0,
        }))
        .sort((a, b) => (b.year ?? 0) - (a.year ?? 0)),
      byQuartile: byQuartileRaw.map((r) => ({
        quartile: r.quartile,
        count: r._count._all,
      })),
      byStatus: byStatusRaw.map((r) => ({
        status: r.status,
        count: r._count._all,
      })),
    };
  }

  // ── API tích hợp cho ACADsoom ─────────────────────────────────────────────
  /**
   * CHỈ trả bài đã phân loại và tác giả đã xác nhận. Không trả giờ quy đổi —
   * xem ghi chú ở IntegrationPublicationResSchema.
   */
  async integrationList(query: IntegrationQueryType) {
    const rows = await this.prisma.publicationAuthor.findMany({
      where: {
        claimStatus: 'CONFIRMED',
        ...(query.email ? { user: { email: query.email.toLowerCase() } } : {}),
        publication: {
          deletedAt: null,
          catalogCode: { not: null },
          ...(query.from || query.to
            ? {
                countYear: {
                  ...(query.from ? { gte: query.from } : {}),
                  ...(query.to ? { lte: query.to } : {}),
                },
              }
            : {}),
        },
      },
      include: { publication: true, user: { select: { email: true } } },
      orderBy: { publication: { countYear: 'desc' } },
    });

    return {
      items: rows.map((r) => {
        const p = r.publication;
        return {
          publicationId: p.id,
          doi: p.doi,
          title: p.title,
          venue: p.containerTitle,
          url: p.url,
          status: p.status,
          countYear: p.countYear,
          publishedYear: p.publishedYear,
          publishedMonth: p.publishedMonth,
          acceptedYear: p.acceptedYear,
          acceptedMonth: p.acceptedMonth,
          catalogCode: p.catalogCode as string,
          quartile: p.quartile,
          satellite: p.satellite,
          reprint: p.reprint,
          fromProject: p.fromProject,
          stage: p.stage,
          totalAuthors: p.totalAuthors,
          schoolAuthors: p.schoolAuthors,
          mainAuthorAtSchool: p.mainAuthorAtSchool,
          isMainAuthor: r.isFirst || r.isCorresponding || r.isLast,
          sharePercent: r.sharePercent,
        };
      }),
    };
  }

  // ── Trang nhân sự ─────────────────────────────────────────────────────────
  /**
   * Trang nhân sự chạy ISR nên phải báo Next dựng lại; cùng CSDL nên không có
   * bước đồng bộ nào khác. Hỏng thì bỏ qua — không để việc khai báo thất bại chỉ
   * vì webhook không gọi được.
   */
  private async revalidateStaffPages(publicationId: string) {
    try {
      const authors = await this.prisma.publicationAuthor.findMany({
        where: { publicationId, claimStatus: 'CONFIRMED' },
        select: {
          user: {
            select: { scholarProfile: { select: { staffPageSlug: true } } },
          },
        },
      });
      const tags = authors
        .map((a) => a.user.scholarProfile?.staffPageSlug)
        .filter((s): s is string => Boolean(s))
        .map((slug) => `page:${slug}`);
      if (tags.length) this.publicRevalidate.trigger([...new Set(tags)]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Không revalidate được trang nhân sự: ${msg}`);
    }
  }
}

/** Đếm thô số mục trong file thư mục, để báo bao nhiêu mục bị bỏ qua. */
function countEntries(content: string): number {
  const bib = content.match(/@\w+\s*\{/g)?.length ?? 0;
  const ris = content.match(/^\s*TY\s{2}-\s/gm)?.length ?? 0;
  return Math.max(bib, ris);
}
