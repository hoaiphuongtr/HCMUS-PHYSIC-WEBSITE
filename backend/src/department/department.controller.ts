import { Body, Controller, Get, Post } from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import { DepartmentService } from './department.service';
import { CreateDepartmentBodyDTO, DepartmentResDTO } from './department.dto';
import { IsPublic } from '../shared/decorators/auth.decorator';
import { Roles } from '../shared/decorators/roles.decorator';
import { RoleName } from '../shared/constants/role.constants';

@Controller('departments')
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Post()
  @Roles(RoleName.SuperAdmin)
  @ZodSerializerDto(DepartmentResDTO)
  create(@Body() body: CreateDepartmentBodyDTO) {
    return this.departmentService.create(body);
  }

  @Get()
  @IsPublic()
  findAll() {
    return this.departmentService.findAll();
  }
}
