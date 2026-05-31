import { Controller, Get, Query } from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import { AdminService } from './admin.service';
import { AdminListQueryDTO, AdminListResDTO } from './admin.dto';
import { Roles } from '../shared/decorators/roles.decorator';
import { RoleName } from '../shared/constants/role.constants';

@Controller('admins')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @Roles(RoleName.SuperAdmin)
  @ZodSerializerDto(AdminListResDTO)
  list(@Query() query: AdminListQueryDTO) {
    return this.adminService.list(query);
  }
}
