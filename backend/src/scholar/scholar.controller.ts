import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
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
  StatsResDTO,
  UpdatePublicationBodyDTO,
  UpdateScholarProfileBodyDTO,
} from './scholar.dto';
import { ScholarService } from './scholar.service';

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
  constructor(private readonly service: ScholarService) {}

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
