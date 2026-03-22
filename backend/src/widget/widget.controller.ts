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
import { WidgetService } from './widget.service';
import {
  CreateWidgetBodyDTO,
  UpdateWidgetBodyDTO,
  WidgetResDTO,
} from './widget.dto';
import { IsPublic } from '../shared/decorators/auth.decorator';
import { Roles } from '../shared/decorators/roles.decorator';
import { RoleName } from '../shared/constants/role.constants';
import { WidgetCategory } from '../generated/prisma/client';

@Controller('widgets')
export class WidgetController {
  constructor(private readonly widgetService: WidgetService) {}

  @Post()
  @Roles(RoleName.Admin, RoleName.SuperAdmin)
  @ZodSerializerDto(WidgetResDTO)
  create(@Body() body: CreateWidgetBodyDTO) {
    return this.widgetService.create(body);
  }

  @Get()
  @IsPublic()
  findAll(
    @Query('category') category?: WidgetCategory,
    @Query('isActive') isActive?: string,
  ) {
    return this.widgetService.findAll({
      category,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  @Get(':id')
  @IsPublic()
  @ZodSerializerDto(WidgetResDTO)
  findById(@Param('id') id: string) {
    return this.widgetService.findById(id);
  }

  @Patch(':id')
  @Roles(RoleName.Admin, RoleName.SuperAdmin)
  @ZodSerializerDto(WidgetResDTO)
  update(@Param('id') id: string, @Body() body: UpdateWidgetBodyDTO) {
    return this.widgetService.update(id, body);
  }

  @Delete(':id')
  @Roles(RoleName.Admin, RoleName.SuperAdmin)
  @ZodSerializerDto(WidgetResDTO)
  remove(@Param('id') id: string) {
    return this.widgetService.remove(id);
  }
}
