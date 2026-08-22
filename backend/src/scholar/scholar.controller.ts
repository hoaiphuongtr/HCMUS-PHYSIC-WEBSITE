import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { ZodSerializerDto } from 'nestjs-zod';
import { ActiveUser } from '../shared/decorators/active-user.decorator';
import { Roles } from '../shared/decorators/roles.decorator';
import { RoleName } from '../shared/constants/role.constants';
import {
  ClaimResponseBodyDTO,
  CreatePublicationBodyDTO,
  ImportFileBodyDTO,
  ImportPreviewResDTO,
  ListPublicationsQueryDTO,
  OrcidImportBodyDTO,
  PendingClaimListResDTO,
  PublicationListResDTO,
  PublicationResDTO,
  ResolveBodyDTO,
  ResolvePreviewResDTO,
  ScholarProfileResDTO,
  SetNameVariantsBodyDTO,
  CreateProjectBodyDTO,
  ListProjectsQueryDTO,
  PendingProjectListResDTO,
  ProjectClaimBodyDTO,
  ProjectListResDTO,
  ProjectResDTO,
  StaffPageResDTO,
  UpdateProjectBodyDTO,
  StatsResDTO,
  UpdateStaffPageBodyDTO,
  UpdatePublicationBodyDTO,
  UpdateScholarProfileBodyDTO,
} from './scholar.dto';
import { ScholarService } from './scholar.service';
import { StaffPageService } from './staff-page.service';
import { ProjectService } from './project.service';
import { PhotoRequiredException } from './scholar.error';

// Cùng thư mục và cùng cách đặt tên với module media, để ảnh chân dung nằm chung
// kho với mọi tệp khác của web Khoa (uploads/ được mount ra ngoài container).
const UPLOADS_DIR = join(process.cwd(), 'uploads');
mkdirSync(UPLOADS_DIR, { recursive: true });

/**
 * API của app hồ sơ khoa học (profile.phys.hcmus.edu.vn).
 *
 * Mở cho cả LECTURER lẫn admin: giảng viên khai bài của mình, admin văn phòng
 * khoa cần xem để tổng hợp. Phân quyền chi tiết nằm ở service — mỗi người chỉ
 * đọc/sửa được công trình mà họ là tác giả ĐÃ XÁC NHẬN.
 */
@Controller('scholar')
@Roles(RoleName.Lecturer, RoleName.Admin, RoleName.SuperAdmin)
export class ScholarController {
  constructor(
    private readonly service: ScholarService,
    private readonly staffPage: StaffPageService,
    private readonly projects: ProjectService,
  ) {}

  // ── Lý lịch khoa học ──────────────────────────────────────────────────────
  @Get('me')
  @ZodSerializerDto(ScholarProfileResDTO)
  me(@ActiveUser('userId') userId: string) {
    return this.service.getProfile(userId);
  }

  @Patch('me')
  @ZodSerializerDto(ScholarProfileResDTO)
  updateMe(
    @ActiveUser('userId') userId: string,
    @Body() body: UpdateScholarProfileBodyDTO,
  ) {
    return this.service.updateProfile(userId, body);
  }

  /** Bộ tên thường dùng khi đăng báo — nền của việc khớp tác giả. */
  @Patch('me/name-variants')
  @ZodSerializerDto(ScholarProfileResDTO)
  setNameVariants(
    @ActiveUser('userId') userId: string,
    @Body() body: SetNameVariantsBodyDTO,
  ) {
    return this.service.setNameVariants(userId, body);
  }

  // ── Nhập liệu ─────────────────────────────────────────────────────────────
  /** Dán DOI / link / arXiv / ISBN → xem trước, chưa lưu gì. */
  @Post('resolve')
  @ZodSerializerDto(ResolvePreviewResDTO)
  resolve(@ActiveUser('userId') userId: string, @Body() body: ResolveBodyDTO) {
    return this.service.resolveOne(userId, body.input);
  }

  /** Nội dung file .bib / .ris / CSL-JSON xuất từ Mendeley, Zotero, EndNote. */
  @Post('import/file')
  @ZodSerializerDto(ImportPreviewResDTO)
  importFile(
    @ActiveUser('userId') userId: string,
    @Body() body: ImportFileBodyDTO,
  ) {
    return this.service.importFile(userId, body.content);
  }

  @Post('import/orcid')
  @ZodSerializerDto(ImportPreviewResDTO)
  importOrcid(
    @ActiveUser('userId') userId: string,
    @Body() body: OrcidImportBodyDTO,
  ) {
    return this.service.importFromOrcid(userId, body);
  }

  // ── Công trình ────────────────────────────────────────────────────────────
  @Get('publications')
  @ZodSerializerDto(PublicationListResDTO)
  list(
    @ActiveUser('userId') userId: string,
    @Query() query: ListPublicationsQueryDTO,
  ) {
    return this.service.list(userId, query);
  }

  @Get('publications/:id')
  @ZodSerializerDto(PublicationResDTO)
  findOne(@ActiveUser('userId') userId: string, @Param('id') id: string) {
    return this.service.findOne(id, userId);
  }

  /** Trùng DOI với bài đã có thì KHÔNG tạo bản mới — chỉ gắn thêm người gọi. */
  @Post('publications')
  @ZodSerializerDto(PublicationResDTO)
  create(
    @ActiveUser('userId') userId: string,
    @Body() body: CreatePublicationBodyDTO,
  ) {
    return this.service.create(userId, body);
  }

  @Patch('publications/:id')
  @ZodSerializerDto(PublicationResDTO)
  update(
    @ActiveUser('userId') userId: string,
    @Param('id') id: string,
    @Body() body: UpdatePublicationBodyDTO,
  ) {
    return this.service.update(userId, id, body);
  }

  @Delete('publications/:id')
  remove(@ActiveUser('userId') userId: string, @Param('id') id: string) {
    return this.service.remove(userId, id);
  }

  // ── Xác nhận tác giả ──────────────────────────────────────────────────────
  /** Bài do đồng nghiệp gắn tên bạn vào, đang chờ bạn trả lời. */
  @Get('claims/pending')
  @ZodSerializerDto(PendingClaimListResDTO)
  pendingClaims(@ActiveUser('userId') userId: string) {
    return this.service.pendingClaims(userId);
  }

  @Post('claims/:publicationId')
  @ZodSerializerDto(PublicationResDTO)
  respond(
    @ActiveUser('userId') userId: string,
    @Param('publicationId') publicationId: string,
    @Body() body: ClaimResponseBodyDTO,
  ) {
    return this.service.respondToClaim(userId, publicationId, body);
  }

  // ── Đề tài, dự án NCKH (Bảng 2) ───────────────────────────────────────────
  @Get('projects')
  @ZodSerializerDto(ProjectListResDTO)
  listProjects(
    @ActiveUser('userId') userId: string,
    @Query() query: ListProjectsQueryDTO,
  ) {
    return this.projects.list(userId, query);
  }

  @Get('projects/:id')
  @ZodSerializerDto(ProjectResDTO)
  findProject(@ActiveUser('userId') userId: string, @Param('id') id: string) {
    return this.projects.findOne(id, userId);
  }

  /** Người khai mặc định là chủ nhiệm; thành viên được gắn tên phải tự xác nhận. */
  @Post('projects')
  @ZodSerializerDto(ProjectResDTO)
  createProject(
    @ActiveUser('userId') userId: string,
    @Body() body: CreateProjectBodyDTO,
  ) {
    return this.projects.create(userId, body);
  }

  @Patch('projects/:id')
  @ZodSerializerDto(ProjectResDTO)
  updateProject(
    @ActiveUser('userId') userId: string,
    @Param('id') id: string,
    @Body() body: UpdateProjectBodyDTO,
  ) {
    return this.projects.update(userId, id, body);
  }

  @Delete('projects/:id')
  removeProject(@ActiveUser('userId') userId: string, @Param('id') id: string) {
    return this.projects.remove(userId, id);
  }

  @Get('project-claims/pending')
  @ZodSerializerDto(PendingProjectListResDTO)
  pendingProjects(@ActiveUser('userId') userId: string) {
    return this.projects.pending(userId);
  }

  @Post('project-claims/:projectId')
  @ZodSerializerDto(ProjectResDTO)
  respondProject(
    @ActiveUser('userId') userId: string,
    @Param('projectId') projectId: string,
    @Body() body: ProjectClaimBodyDTO,
  ) {
    return this.projects.respond(userId, projectId, body.accept, body.role);
  }

  // ── Trang nhân sự trên web Khoa ───────────────────────────────────────────
  /** Đọc nội dung trang nhân sự của CHÍNH người gọi. */
  @Get('me/staff-page')
  @ZodSerializerDto(StaffPageResDTO)
  readStaffPage(@ActiveUser('userId') userId: string) {
    return this.staffPage.read(userId);
  }

  /** Sửa nội dung trang đó. Trang công khai được dựng lại ngay sau khi ghi. */
  @Patch('me/staff-page')
  @ZodSerializerDto(StaffPageResDTO)
  updateStaffPage(
    @ActiveUser('userId') userId: string,
    @Body() body: UpdateStaffPageBodyDTO,
  ) {
    return this.staffPage.update(userId, body);
  }

  /**
   * Đổi ảnh chân dung. Cổng HẸP có chủ ý: module media chỉ mở cho quản trị, và
   * mở nó ra cho giảng viên nghĩa là họ duyệt lẫn xoá được toàn bộ kho ảnh của
   * Khoa. Ở đây chỉ làm đúng một việc — thay ảnh của chính mình.
   */
  @Post('me/staff-page/photo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOADS_DIR,
        filename: (_req, file, cb) =>
          cb(
            null,
            `${randomUUID()}${extname(file.originalname).toLowerCase()}`,
          ),
      }),
      limits: { fileSize: 8 * 1024 * 1024 },
      fileFilter: (_req, file, cb) =>
        file.mimetype.startsWith('image/')
          ? cb(null, true)
          : cb(PhotoRequiredException, false),
    }),
  )
  @ZodSerializerDto(StaffPageResDTO)
  uploadPhoto(
    @ActiveUser('userId') userId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file) throw PhotoRequiredException;
    return this.staffPage.setPhoto(userId, `/uploads/${file.filename}`);
  }

  // ── Thống kê ──────────────────────────────────────────────────────────────
  @Get('stats/me')
  @ZodSerializerDto(StatsResDTO)
  myStats(@ActiveUser('userId') userId: string) {
    return this.service.stats(userId);
  }

  /** Toàn Khoa — chỉ quản trị. */
  @Get('stats/faculty')
  @Roles(RoleName.Admin, RoleName.SuperAdmin)
  @ZodSerializerDto(StatsResDTO)
  facultyStats() {
    return this.service.stats();
  }
}
