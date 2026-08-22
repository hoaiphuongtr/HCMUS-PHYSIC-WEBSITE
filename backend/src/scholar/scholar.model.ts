import { z } from 'zod';

// ── Hằng dùng chung ─────────────────────────────────────────────────────────
export const PUBLICATION_STATUSES = [
  'SUBMITTED',
  'ACCEPTED',
  'IN_PRESS',
  'PUBLISHED',
  'RETRACTED',
] as const;

export const CLAIM_STATUSES = ['CONFIRMED', 'PENDING', 'REJECTED'] as const;

export const QUARTILES = ['Q1', 'Q2', 'Q3', 'Q4'] as const;

/** Quan hệ công tác với Khoa. Để trống = chưa khai, KHÔNG mặc định cơ hữu. */
export const AFFILIATION_TYPES = ['FULL_TIME', 'JOINT', 'VISITING'] as const;

/** Bậc đào tạo sau đại học giảng viên ĐANG theo học. */
export const GRAD_STUDY_LEVELS = ['MASTER', 'PHD', 'POSTDOC'] as const;

const OptionalText = (max: number) => z.string().max(max).nullish();

// ── Lý lịch khoa học ────────────────────────────────────────────────────────
export const NameVariantResSchema = z.object({
  id: z.string(),
  raw: z.string(),
  normalized: z.string(),
  isPrimary: z.boolean(),
});

export const ScholarProfileResSchema = z.object({
  id: z.string(),
  userId: z.string(),
  orcid: z.string().nullable(),
  scopusAuthorId: z.string().nullable(),
  researcherId: z.string().nullable(),
  googleScholarId: z.string().nullable(),
  researchGateUrl: z.string().nullable(),
  staffPageSlug: z.string().nullable(),
  showOnWeb: z.boolean(),
  lastOrcidSyncAt: z.date().nullable(),

  affiliationType: z.enum(AFFILIATION_TYPES).nullable(),
  homeInstitution: z.string().nullable(),

  gradStudyLevel: z.enum(GRAD_STUDY_LEVELS).nullable(),
  gradStudyField: z.string().nullable(),
  gradStudyInstitution: z.string().nullable(),
  gradStudyCountry: z.string().nullable(),
  gradStudyStartYear: z.number().int().nullable(),
  gradStudyEndYear: z.number().int().nullable(),
  gradStudyFullTime: z.boolean(),
  gradStudyNote: z.string().nullable(),

  nameVariants: z.array(NameVariantResSchema),
});
export type ScholarProfileResType = z.infer<typeof ScholarProfileResSchema>;

export const UpdateScholarProfileBodySchema = z.object({
  // ORCID luôn có dạng 0000-0000-0000-000X; sai dạng thì chặn ngay, vì đây là
  // khoá dùng để khớp tác giả — sai một ký tự là khớp nhầm người.
  orcid: z
    .string()
    .regex(
      /^\d{4}-\d{4}-\d{4}-\d{3}[\dXx]$/,
      'ORCID phải có dạng 0000-0000-0000-0000',
    )
    .nullish(),
  scopusAuthorId: OptionalText(40),
  researcherId: OptionalText(40),
  googleScholarId: OptionalText(40),
  researchGateUrl: z.string().url().max(300).nullish(),
  staffPageSlug: OptionalText(300),
  showOnWeb: z.boolean().optional(),

  // ── Quan hệ công tác ──────────────────────────────────────────────────────
  affiliationType: z.enum(AFFILIATION_TYPES).nullish(),
  /** Đơn vị công tác chính — chỉ có nghĩa với kiêm nhiệm và thỉnh giảng. */
  homeInstitution: OptionalText(300),

  // ── Đang học sau đại học ──────────────────────────────────────────────────
  // Đặt gradStudyLevel = null để xoá cả khối (đã học xong, hoặc khai nhầm).
  gradStudyLevel: z.enum(GRAD_STUDY_LEVELS).nullish(),
  gradStudyField: OptionalText(200),
  gradStudyInstitution: OptionalText(300),
  gradStudyCountry: OptionalText(100),
  gradStudyStartYear: z.number().int().min(1950).max(2200).nullish(),
  /** Năm DỰ KIẾN hoàn thành. */
  gradStudyEndYear: z.number().int().min(1950).max(2200).nullish(),
  gradStudyFullTime: z.boolean().optional(),
  gradStudyNote: OptionalText(1000),
});
export type UpdateScholarProfileBodyType = z.infer<
  typeof UpdateScholarProfileBodySchema
>;

/** Bộ tên thường dùng khi đăng báo — thay cả danh sách trong một lần gọi. */
export const SetNameVariantsBodySchema = z.object({
  variants: z.array(z.string().min(2).max(200)).max(30),
  primary: z.string().max(200).optional(),
});
export type SetNameVariantsBodyType = z.infer<typeof SetNameVariantsBodySchema>;

// ── Tra cứu ─────────────────────────────────────────────────────────────────
export const ResolvedAuthorSchema = z.object({
  family: z.string().nullish(),
  given: z.string().nullish(),
  name: z.string().nullish(),
  orcid: z.string().nullish(),
  sequence: z.enum(['first', 'additional']).nullish(),
  affiliation: z.string().nullish(),
});

export const ResolvedWorkSchema = z.object({
  doi: z.string().nullish(),
  arxivId: z.string().nullish(),
  isbn: z.string().nullish(),
  issn: z.string().nullish(),
  type: z.string(),
  title: z.string(),
  containerTitle: z.string().nullish(),
  volume: z.string().nullish(),
  issue: z.string().nullish(),
  pages: z.string().nullish(),
  publisher: z.string().nullish(),
  url: z.string().nullish(),
  publishedYear: z.number().int().nullish(),
  publishedMonth: z.number().int().min(1).max(12).nullish(),
  acceptedYear: z.number().int().nullish(),
  acceptedMonth: z.number().int().min(1).max(12).nullish(),
  authors: z.array(ResolvedAuthorSchema),
  source: z.string(),
});

/** Gợi ý "người này trong Khoa có mặt trong danh sách tác giả". */
export const AuthorSuggestionSchema = z.object({
  authorIndex: z.number().int(),
  userId: z.string(),
  displayName: z.string(),
  email: z.string(),
  reason: z.enum(['orcid', 'variant', 'loose']),
  /** Gợi ý này chính là người đang gọi — giao diện tick sẵn "tôi là người này". */
  isMe: z.boolean(),
});

export const ResolvePreviewResSchema = z.object({
  work: ResolvedWorkSchema.nullable(),
  /** Bài đã có sẵn trong CSDL (trùng DOI) — để không tạo bản thứ hai. */
  existingPublicationId: z.string().nullable(),
  suggestions: z.array(AuthorSuggestionSchema),
});

export const ResolveBodySchema = z.object({
  input: z.string().min(3).max(2000),
});
export type ResolveBodyType = z.infer<typeof ResolveBodySchema>;

/** Nhập từ file .bib / .ris / CSL-JSON — gửi nội dung file dạng chữ. */
export const ImportFileBodySchema = z.object({
  content: z.string().min(3).max(2_000_000),
  filename: z.string().max(300).optional(),
});
export type ImportFileBodyType = z.infer<typeof ImportFileBodySchema>;

export const ImportPreviewResSchema = z.object({
  items: z.array(
    z.object({
      work: ResolvedWorkSchema,
      existingPublicationId: z.string().nullable(),
      suggestions: z.array(AuthorSuggestionSchema),
    }),
  ),
  skipped: z.number().int(),
});

export const OrcidImportBodySchema = z.object({
  /** Bỏ trống thì lấy ORCID trong hồ sơ của chính người gọi. */
  orcid: z
    .string()
    .regex(/^\d{4}-\d{4}-\d{4}-\d{3}[\dXx]$/)
    .optional(),
  limit: z.number().int().min(1).max(300).optional(),
});
export type OrcidImportBodyType = z.infer<typeof OrcidImportBodySchema>;

// ── Công trình ──────────────────────────────────────────────────────────────
/** Vai trò của chính người gọi trong bài — quyết định giờ quy đổi ở ACADsoom. */
export const MyAuthorshipSchema = z.object({
  authorIndex: z.number().int().min(-1).default(-1),
  isFirst: z.boolean().default(false),
  isCorresponding: z.boolean().default(false),
  isLast: z.boolean().default(false),
  sharePercent: z.number().int().min(1).max(100).nullish(),
  showOnWeb: z.boolean().default(true),
});

export const PublicationAuthorResSchema = z.object({
  id: z.string(),
  userId: z.string(),
  displayName: z.string(),
  email: z.string(),
  authorIndex: z.number().int(),
  isFirst: z.boolean(),
  isCorresponding: z.boolean(),
  isLast: z.boolean(),
  sharePercent: z.number().int().nullable(),
  claimStatus: z.enum(CLAIM_STATUSES),
  invitedBy: z.string().nullable(),
  respondedAt: z.date().nullable(),
  showOnWeb: z.boolean(),
});

export const PublicationResSchema = z.object({
  id: z.string(),
  doi: z.string().nullable(),
  arxivId: z.string().nullable(),
  isbn: z.string().nullable(),
  issn: z.string().nullable(),
  type: z.string(),
  title: z.string(),
  containerTitle: z.string().nullable(),
  volume: z.string().nullable(),
  issue: z.string().nullable(),
  pages: z.string().nullable(),
  publisher: z.string().nullable(),
  url: z.string().nullable(),
  status: z.enum(PUBLICATION_STATUSES),
  publishedYear: z.number().int().nullable(),
  publishedMonth: z.number().int().nullable(),
  acceptedYear: z.number().int().nullable(),
  acceptedMonth: z.number().int().nullable(),
  countYear: z.number().int().nullable(),
  authorsRaw: z.array(ResolvedAuthorSchema),
  source: z.string(),
  catalogCode: z.string().nullable(),
  quartile: z.string().nullable(),
  classifiedBy: z.string().nullable(),
  classifiedAt: z.date().nullable(),
  satellite: z.boolean(),
  reprint: z.boolean(),
  fromProject: z.boolean(),
  stage: z.number().int(),
  totalAuthors: z.number().int(),
  schoolAuthors: z.number().int(),
  mainAuthorAtSchool: z.boolean(),
  createdBy: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  authors: z.array(PublicationAuthorResSchema),
  /** Suy ra cho người đang gọi, để giao diện không phải tự dò. */
  isClassified: z.boolean(),
  myClaimStatus: z.enum(CLAIM_STATUSES).nullable(),
});
export type PublicationResType = z.infer<typeof PublicationResSchema>;

export const PublicationListResSchema = z.object({
  items: z.array(PublicationResSchema),
  total: z.number().int(),
  /** Số bài chưa phân loại — giao diện phải nêu bật, vì chúng KHÔNG được tính. */
  unclassified: z.number().int(),
});

const YearNum = z.number().int().min(1900).max(2200);
const MonthNum = z.number().int().min(1).max(12);

export const CreatePublicationBodySchema = z.object({
  work: ResolvedWorkSchema,
  /** Mặc định PUBLISHED — phần lớn bài được khai sau khi đã in. */
  status: z.enum(PUBLICATION_STATUSES).default('PUBLISHED'),
  publishedYear: YearNum.nullish(),
  publishedMonth: MonthNum.nullish(),
  acceptedYear: YearNum.nullish(),
  acceptedMonth: MonthNum.nullish(),
  me: MyAuthorshipSchema,
  /** Đồng tác giả trong Khoa — họ sẽ ở PENDING cho tới khi tự xác nhận. */
  coAuthorUserIds: z.array(z.string()).max(50).default([]),
  totalAuthors: z.number().int().min(1).max(2000).optional(),
});
export type CreatePublicationBodyType = z.infer<
  typeof CreatePublicationBodySchema
>;

export const UpdatePublicationBodySchema = z.object({
  title: z.string().min(1).max(1000).optional(),
  containerTitle: OptionalText(500),
  volume: OptionalText(50),
  issue: OptionalText(50),
  pages: OptionalText(50),
  publisher: OptionalText(300),
  url: z.string().max(1000).nullish(),
  issn: OptionalText(20),
  status: z.enum(PUBLICATION_STATUSES).optional(),
  publishedYear: YearNum.nullish(),
  publishedMonth: MonthNum.nullish(),
  acceptedYear: YearNum.nullish(),
  acceptedMonth: MonthNum.nullish(),

  // Phân loại — tác giả tự chọn. Đặt null để đưa bài về "chưa phân loại".
  catalogCode: OptionalText(20),
  quartile: z.enum(QUARTILES).nullish(),

  satellite: z.boolean().optional(),
  reprint: z.boolean().optional(),
  fromProject: z.boolean().optional(),
  stage: z.number().int().min(0).max(2).optional(),

  totalAuthors: z.number().int().min(1).max(2000).optional(),
  /** Kể cả đồng tác giả là sinh viên/học viên thuộc Trường mà không có tài khoản.
   *  Hệ thống luôn nâng lên ít nhất bằng số tác giả đã xác nhận. */
  schoolAuthors: z.number().int().min(1).max(2000).optional(),
  mainAuthorAtSchool: z.boolean().optional(),

  me: MyAuthorshipSchema.partial().optional(),
  coAuthorUserIds: z.array(z.string()).max(50).optional(),
});
export type UpdatePublicationBodyType = z.infer<
  typeof UpdatePublicationBodySchema
>;

export const ListPublicationsQuerySchema = z.object({
  year: z.coerce.number().int().min(1900).max(2200).optional(),
  status: z.enum(PUBLICATION_STATUSES).optional(),
  /** "unclassified" = chưa chọn mã Phụ lục 2. */
  filter: z.enum(['all', 'unclassified', 'classified', 'pending']).optional(),
  q: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListPublicationsQueryType = z.infer<
  typeof ListPublicationsQuerySchema
>;

// ── Xác nhận tác giả ────────────────────────────────────────────────────────
export const ClaimResponseBodySchema = z.object({
  accept: z.boolean(),
  authorship: MyAuthorshipSchema.partial().optional(),
});
export type ClaimResponseBodyType = z.infer<typeof ClaimResponseBodySchema>;

export const PendingClaimListResSchema = z.array(
  z.object({
    publicationId: z.string(),
    title: z.string(),
    containerTitle: z.string().nullable(),
    year: z.number().int().nullable(),
    doi: z.string().nullable(),
    invitedBy: z.string().nullable(),
    invitedByName: z.string().nullable(),
    authorsRaw: z.array(ResolvedAuthorSchema),
    suggestedAuthorIndex: z.number().int(),
  }),
);

// ── API tích hợp cho ACADsoom ───────────────────────────────────────────────
/**
 * Chỉ trả DỮ KIỆN, không trả giờ quy đổi: hệ số là quy định của Trường/Khoa và
 * đã cài ở ACADsoom (src/lib/nv2Hours.js). Trả giờ ở đây là có hai nơi cùng
 * quy đổi, sửa định mức phải sửa hai chỗ.
 *
 * Và chỉ trả bài ĐÃ PHÂN LOẠI: bài chưa chọn mã Phụ lục 2 không tồn tại đối với
 * ACADsoom, nên "không chỉnh thì không được tính" là ràng buộc dữ liệu chứ
 * không phải lời nhắc trên giao diện.
 */
export const IntegrationPublicationResSchema = z.object({
  items: z.array(
    z.object({
      publicationId: z.string(),
      doi: z.string().nullable(),
      title: z.string(),
      venue: z.string().nullable(),
      url: z.string().nullable(),
      status: z.enum(PUBLICATION_STATUSES),
      countYear: z.number().int().nullable(),
      publishedYear: z.number().int().nullable(),
      publishedMonth: z.number().int().nullable(),
      acceptedYear: z.number().int().nullable(),
      acceptedMonth: z.number().int().nullable(),

      catalogCode: z.string(),
      quartile: z.string().nullable(),

      satellite: z.boolean(),
      reprint: z.boolean(),
      fromProject: z.boolean(),
      stage: z.number().int(),

      totalAuthors: z.number().int(),
      schoolAuthors: z.number().int(),
      mainAuthorAtSchool: z.boolean(),
      isMainAuthor: z.boolean(),
      sharePercent: z.number().int().nullable(),
    }),
  ),
});

export const IntegrationQuerySchema = z.object({
  email: z.string().email().optional(),
  from: z.coerce.number().int().min(1900).max(2200).optional(),
  to: z.coerce.number().int().min(1900).max(2200).optional(),
});
export type IntegrationQueryType = z.infer<typeof IntegrationQuerySchema>;

// ── Thống kê ────────────────────────────────────────────────────────────────
export const StatsResSchema = z.object({
  byYear: z.array(
    z.object({
      year: z.number().int().nullable(),
      total: z.number().int(),
      classified: z.number().int(),
    }),
  ),
  byQuartile: z.array(
    z.object({ quartile: z.string().nullable(), count: z.number().int() }),
  ),
  byStatus: z.array(
    z.object({ status: z.enum(PUBLICATION_STATUSES), count: z.number().int() }),
  ),
});

// ── Trang nhân sự trên web Khoa ─────────────────────────────────────────────
// Giảng viên sửa trang của CHÍNH MÌNH từ app. Không có tham số chỉ định trang
// khác — quyền chặn ở tầng dữ liệu qua ScholarProfile.staffPageSlug.
const EntrySchema = z.object({
  title: z.string().min(1).max(300),
  desc: z.string().max(2000).optional(),
});

const ExtraSchema = z.object({
  section: z.string().min(1).max(120),
  title: z.string().min(1).max(300),
  desc: z.string().max(2000).optional(),
});

const StaffPubSchema = z.object({
  year: z.string().max(10).optional(),
  title: z.string().min(1).max(1000),
  meta: z.string().max(1000).optional(),
  url: z.string().max(1000).optional(),
});

export const StaffPageResSchema = z.object({
  slug: z.string(),
  layoutId: z.string(),
  photo: z.string(),
  eyebrow: z.string(),
  name: z.string(),
  intro: z.string(),
  research: z.array(EntrySchema),
  teaching: z.array(EntrySchema),
  extras: z.array(ExtraSchema),
  publications: z.array(StaffPubSchema),
  /** Nội dung cũ từ đợt migration — CHỈ ĐỌC, hiển thị để người dùng tự chép sang. */
  legacyHtml: z.string(),
});

export const UpdateStaffPageBodySchema = z.object({
  photo: z.string().max(1000).nullish(),
  eyebrow: z.string().max(200).nullish(),
  intro: z.string().max(5000).nullish(),
  research: z.array(EntrySchema).max(50).optional(),
  teaching: z.array(EntrySchema).max(50).optional(),
  extras: z.array(ExtraSchema).max(50).optional(),
  publications: z.array(StaffPubSchema).max(300).optional(),
});
export type UpdateStaffPageBodyType = z.infer<typeof UpdateStaffPageBodySchema>;
