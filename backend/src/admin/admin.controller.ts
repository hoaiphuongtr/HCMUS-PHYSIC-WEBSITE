import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import { AdminService } from './admin.service';
import {
  AdminListQueryDTO,
  AdminListResDTO,
  AdminItemDTO,
  AdminMessageResDTO,
  ResetAdminPasswordBodyDTO,
  UpdateAdminProfileBodyDTO,
} from './admin.dto';
import { Roles } from '../shared/decorators/roles.decorator';
import { RoleName } from '../shared/constants/role.constants';

@Controller('admins')
@Roles(RoleName.SuperAdmin)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @ZodSerializerDto(AdminListResDTO)
  list(@Query() query: AdminListQueryDTO) {
    return this.adminService.list(query);
  }

  @Patch(':id/suspend')
  @ZodSerializerDto(AdminMessageResDTO)
  suspend(@Param('id') id: string) {
    return this.adminService.suspend(id);
  }

  @Patch(':id/restore')
  @ZodSerializerDto(AdminMessageResDTO)
  restore(@Param('id') id: string) {
    return this.adminService.restore(id);
  }

  @Post(':id/reset-password')
  @ZodSerializerDto(AdminMessageResDTO)
  resetPassword(
    @Param('id') id: string,
    @Body() body: ResetAdminPasswordBodyDTO,
  ) {
    return this.adminService.resetPassword(id, body);
  }

  /** Sửa hồ sơ tài khoản (Mục 10): ngạch/chức vụ/học vị/MSCB/đơn vị… */
  @Patch(':id/profile')
  @ZodSerializerDto(AdminItemDTO)
  updateProfile(
    @Param('id') id: string,
    @Body() body: UpdateAdminProfileBodyDTO,
  ) {
    return this.adminService.updateProfile(id, body);
  }
}
