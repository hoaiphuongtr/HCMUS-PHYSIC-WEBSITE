import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import { TagService } from './tag.service';
import {
  TagListResDTO,
  TagResDTO,
  CreateTagBodyDTO,
  UpdateTagBodyDTO,
  MergeTagBodyDTO,
} from './tag.dto';
import { IsPublic } from '../shared/decorators/auth.decorator';
import { Roles } from '../shared/decorators/roles.decorator';
import { RoleName } from '../shared/constants/role.constants';

@Controller('tags')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Get()
  @IsPublic()
  @ZodSerializerDto(TagListResDTO)
  list() {
    return this.tagService.list();
  }

  @Post()
  @Roles(RoleName.SuperAdmin)
  @ZodSerializerDto(TagResDTO)
  create(@Body() body: CreateTagBodyDTO) {
    return this.tagService.create(body);
  }

  @Patch(':id')
  @Roles(RoleName.SuperAdmin)
  @ZodSerializerDto(TagResDTO)
  update(@Param('id') id: string, @Body() body: UpdateTagBodyDTO) {
    return this.tagService.update(id, body);
  }

  @Patch(':id/merge')
  @Roles(RoleName.SuperAdmin)
  @ZodSerializerDto(TagResDTO)
  merge(@Param('id') id: string, @Body() body: MergeTagBodyDTO) {
    return this.tagService.merge(id, body.targetId);
  }

  @Delete(':id')
  @Roles(RoleName.SuperAdmin)
  remove(@Param('id') id: string) {
    return this.tagService.remove(id);
  }
}
