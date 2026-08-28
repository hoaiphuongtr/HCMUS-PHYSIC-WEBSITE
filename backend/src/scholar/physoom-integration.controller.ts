import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { createZodDto, ZodSerializerDto } from 'nestjs-zod';
import { z } from 'zod';
import { IsPublic } from '../shared/decorators/auth.decorator';
import { IntegrationQueryDTO, IntegrationStaffResDTO } from './scholar.dto';
import { PhysoomSecretGuard } from './physoom-secret.guard';
import { ScholarService } from './scholar.service';

/**
 * Body Physoom đẩy sang khi thêm user. Physoom CHỈ phát định danh (email + tên +
 * physoomId), KHÔNG phát chức vụ/vai trò — web Khoa tự giữ role.
 */
const PhysoomUserPushSchema = z.object({
  email: z.string().email(),
  name: z.string().optional().nullable(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  physoomId: z.string().optional().nullable(),
  teacherId: z.string().optional().nullable(),
});
export class PhysoomUserPushDTO extends createZodDto(PhysoomUserPushSchema) {}

/**
 * Kênh máy-với-máy cho Physoom (app xếp lịch phòng/giảng dạy).
 *
 * @IsPublic() tắt lớp xác thực bằng phiên đăng nhập; PhysoomSecretGuard chắn lại
 * bằng khoá bí mật riêng của Physoom (header x-physoom-secret / PHYSOOM_SYNC_SECRET).
 *
 * Tách hẳn khỏi controller ACADsoom để mỗi app một khoá độc lập.
 */
@Controller('integration/physoom')
@IsPublic()
@UseGuards(PhysoomSecretGuard)
export class PhysoomIntegrationController {
  constructor(private readonly service: ScholarService) {}

  /**
   * Physoom KÉO danh sách nhân sự về đồng bộ (tái dùng staffIntegrationList).
   * `since` → chế độ delta. Physoom chỉ lấy email + tên; các trường khác bỏ qua.
   */
  @Get('staff')
  @ZodSerializerDto(IntegrationStaffResDTO)
  staff(@Query() query: IntegrationQueryDTO) {
    return this.service.staffIntegrationList(query);
  }

  /** Physoom ĐẨY một user sang (thêm ở Physoom → thêm ở web Khoa). */
  @Post('users')
  upsertUser(@Body() body: PhysoomUserPushDTO) {
    return this.service.upsertUserFromPhysoom(body);
  }
}
