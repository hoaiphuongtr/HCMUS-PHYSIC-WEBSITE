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
import { StaticPageService } from './static-page.service';
import {
  StaticPageResDTO,
  StaticPageListResDTO,
  CreateStaticPageBodyDTO,
  UpdateStaticPageBodyDTO,
} from './static-page.dto';
import { IsPublic } from '../shared/decorators/auth.decorator';
import { Roles } from '../shared/decorators/roles.decorator';
import { RoleName } from '../shared/constants/role.constants';

@Controller('static-pages')
export class StaticPageController {
  constructor(private readonly service: StaticPageService) {}

  // Public: the site catch-all resolves a published static page by slug.
  @Get('slug/:slug')
  @IsPublic()
  @ZodSerializerDto(StaticPageResDTO)
  getBySlug(@Param('slug') slug: string) {
    return this.service.findPublishedBySlug(slug);
  }

  @Get()
  @Roles(RoleName.SuperAdmin)
  @ZodSerializerDto(StaticPageListResDTO)
  list() {
    return this.service.list();
  }

  @Get(':id')
  @Roles(RoleName.SuperAdmin)
  @ZodSerializerDto(StaticPageResDTO)
  getById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post()
  @Roles(RoleName.SuperAdmin)
  @ZodSerializerDto(StaticPageResDTO)
  create(@Body() body: CreateStaticPageBodyDTO) {
    return this.service.create(body);
  }

  @Patch(':id')
  @Roles(RoleName.SuperAdmin)
  @ZodSerializerDto(StaticPageResDTO)
  update(@Param('id') id: string, @Body() body: UpdateStaticPageBodyDTO) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @Roles(RoleName.SuperAdmin)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
