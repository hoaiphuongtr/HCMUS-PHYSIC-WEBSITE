import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { ZodSerializerDto } from 'nestjs-zod';

const TEN_MINUTES_MS = 600_000;
import { PageLayoutService } from './page-layout.service';
import {
  CreatePageLayoutBodyDTO,
  UpdatePageLayoutBodyDTO,
  AddWidgetInstanceBodyDTO,
  UpdateWidgetInstanceBodyDTO,
  ReorderWidgetsBodyDTO,
  DuplicatePageLayoutBodyDTO,
  SavePuckDataBodyDTO,
  PageLayoutResDTO,
  WidgetInstanceResDTO,
  PageLayoutMessageResDTO,
} from './page-layout.dto';
import { IsPublic } from '../shared/decorators/auth.decorator';
import { Roles } from '../shared/decorators/roles.decorator';
import { RoleName } from '../shared/constants/role.constants';
import { ActiveUser } from '../shared/decorators/active-user.decorator';

@Controller('page-layouts')
export class PageLayoutController {
  constructor(private readonly pageLayoutService: PageLayoutService) {}

  @Post()
  @Roles(RoleName.Admin, RoleName.SuperAdmin)
  @ZodSerializerDto(PageLayoutResDTO)
  create(
    @Body() body: CreatePageLayoutBodyDTO,
    @ActiveUser('userId') userId: string,
  ) {
    return this.pageLayoutService.create(body, userId);
  }

  @Get()
  @IsPublic()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(TEN_MINUTES_MS)
  findAll() {
    return this.pageLayoutService.findAll();
  }

  @Get(':id')
  @IsPublic()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(TEN_MINUTES_MS)
  @ZodSerializerDto(PageLayoutResDTO)
  findById(@Param('id') id: string) {
    return this.pageLayoutService.findById(id);
  }

  @Get('slug/:slug')
  @IsPublic()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(TEN_MINUTES_MS)
  @ZodSerializerDto(PageLayoutResDTO)
  findBySlug(@Param('slug') slug: string) {
    return this.pageLayoutService.findBySlug(slug);
  }

  @Patch(':id')
  @Roles(RoleName.Admin, RoleName.SuperAdmin)
  @ZodSerializerDto(PageLayoutResDTO)
  update(@Param('id') id: string, @Body() body: UpdatePageLayoutBodyDTO) {
    return this.pageLayoutService.update(id, body);
  }

  @Delete(':id')
  @Roles(RoleName.Admin, RoleName.SuperAdmin)
  @ZodSerializerDto(PageLayoutMessageResDTO)
  delete(@Param('id') id: string) {
    return this.pageLayoutService.delete(id);
  }

  @Post(':id/duplicate')
  @Roles(RoleName.Admin, RoleName.SuperAdmin)
  @ZodSerializerDto(PageLayoutResDTO)
  duplicate(
    @Param('id') id: string,
    @Body() body: DuplicatePageLayoutBodyDTO,
    @ActiveUser('userId') userId: string,
  ) {
    return this.pageLayoutService.duplicate(id, userId, body);
  }

  @Put(':id/puck-data')
  @Roles(RoleName.Admin, RoleName.SuperAdmin)
  @ZodSerializerDto(PageLayoutResDTO)
  savePuckData(@Param('id') id: string, @Body() body: SavePuckDataBodyDTO) {
    return this.pageLayoutService.savePuckData(id, body);
  }

  @Post(':id/publish')
  @Roles(RoleName.Admin, RoleName.SuperAdmin)
  @ZodSerializerDto(PageLayoutResDTO)
  publish(@Param('id') id: string) {
    return this.pageLayoutService.publish(id);
  }

  @Post(':id/widgets')
  @Roles(RoleName.Admin, RoleName.SuperAdmin)
  @ZodSerializerDto(WidgetInstanceResDTO)
  addWidget(@Param('id') id: string, @Body() body: AddWidgetInstanceBodyDTO) {
    return this.pageLayoutService.addWidgetInstance(id, body);
  }

  @Patch(':id/widgets/:instanceId')
  @Roles(RoleName.Admin, RoleName.SuperAdmin)
  @ZodSerializerDto(WidgetInstanceResDTO)
  updateWidget(
    @Param('id') id: string,
    @Param('instanceId') instanceId: string,
    @Body() body: UpdateWidgetInstanceBodyDTO,
  ) {
    return this.pageLayoutService.updateWidgetInstance(id, instanceId, body);
  }

  @Delete(':id/widgets/:instanceId')
  @Roles(RoleName.Admin, RoleName.SuperAdmin)
  @ZodSerializerDto(PageLayoutMessageResDTO)
  removeWidget(
    @Param('id') id: string,
    @Param('instanceId') instanceId: string,
  ) {
    return this.pageLayoutService.removeWidgetInstance(id, instanceId);
  }

  @Put(':id/widgets/reorder')
  @Roles(RoleName.Admin, RoleName.SuperAdmin)
  @ZodSerializerDto(PageLayoutResDTO)
  reorderWidgets(@Param('id') id: string, @Body() body: ReorderWidgetsBodyDTO) {
    return this.pageLayoutService.reorderWidgets(id, body);
  }
}
