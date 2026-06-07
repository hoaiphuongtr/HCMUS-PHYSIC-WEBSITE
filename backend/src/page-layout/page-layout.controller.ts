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
  SchedulePublishBodyDTO,
  PageLayoutResDTO,
  WidgetInstanceResDTO,
  PageLayoutMessageResDTO,
  PageLayoutVersionResDTO,
  PageLayoutVersionListResDTO,
  RollbackPageLayoutVersionBodyDTO,
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

  @Get('published')
  @IsPublic()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(TEN_MINUTES_MS)
  findAllPublished() {
    return this.pageLayoutService.findAllPublished();
  }

  @Get()
  @Roles(RoleName.Admin, RoleName.SuperAdmin)
  findAll(
    @ActiveUser('userId') userId: string,
    @ActiveUser('roleName') roleName: string,
  ) {
    return this.pageLayoutService.findAllForAdmin(userId, roleName);
  }

  @Get('slug/*slug')
  @IsPublic()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(TEN_MINUTES_MS)
  @ZodSerializerDto(PageLayoutResDTO)
  findBySlug(@Param('slug') slug: string | string[]) {
    const slugPath = Array.isArray(slug) ? slug.join('/') : slug;
    return this.pageLayoutService.findBySlug(slugPath);
  }

  @Get(':id')
  @Roles(RoleName.Admin, RoleName.SuperAdmin)
  @ZodSerializerDto(PageLayoutResDTO)
  findById(
    @Param('id') id: string,
    @ActiveUser('userId') userId: string,
    @ActiveUser('roleName') roleName: string,
  ) {
    return this.pageLayoutService.findByIdForAdmin(id, userId, roleName);
  }

  @Patch(':id')
  @Roles(RoleName.Admin, RoleName.SuperAdmin)
  @ZodSerializerDto(PageLayoutResDTO)
  update(
    @Param('id') id: string,
    @Body() body: UpdatePageLayoutBodyDTO,
    @ActiveUser('userId') userId: string,
    @ActiveUser('roleName') roleName: string,
  ) {
    return this.pageLayoutService.update(id, body, userId, roleName);
  }

  @Delete(':id')
  @Roles(RoleName.Admin, RoleName.SuperAdmin)
  @ZodSerializerDto(PageLayoutMessageResDTO)
  delete(
    @Param('id') id: string,
    @ActiveUser('userId') userId: string,
    @ActiveUser('roleName') roleName: string,
  ) {
    return this.pageLayoutService.delete(id, userId, roleName);
  }

  @Post(':id/duplicate')
  @Roles(RoleName.Admin, RoleName.SuperAdmin)
  @ZodSerializerDto(PageLayoutResDTO)
  duplicate(
    @Param('id') id: string,
    @Body() body: DuplicatePageLayoutBodyDTO,
    @ActiveUser('userId') userId: string,
    @ActiveUser('roleName') roleName: string,
  ) {
    return this.pageLayoutService.duplicate(id, userId, body, roleName);
  }

  @Put(':id/puck-data')
  @Roles(RoleName.Admin, RoleName.SuperAdmin)
  @ZodSerializerDto(PageLayoutResDTO)
  savePuckData(
    @Param('id') id: string,
    @Body() body: SavePuckDataBodyDTO,
    @ActiveUser('userId') userId: string,
    @ActiveUser('roleName') roleName: string,
  ) {
    return this.pageLayoutService.savePuckData(id, body, userId, roleName);
  }

  @Post(':id/publish')
  @Roles(RoleName.Admin, RoleName.SuperAdmin)
  @ZodSerializerDto(PageLayoutResDTO)
  publish(
    @Param('id') id: string,
    @ActiveUser('userId') userId: string,
    @ActiveUser('roleName') roleName: string,
  ) {
    return this.pageLayoutService.publish(id, userId, roleName);
  }

  @Post(':id/schedule-publish')
  @Roles(RoleName.Admin, RoleName.SuperAdmin)
  @ZodSerializerDto(PageLayoutResDTO)
  schedulePublish(
    @Param('id') id: string,
    @Body() body: SchedulePublishBodyDTO,
    @ActiveUser('userId') userId: string,
    @ActiveUser('roleName') roleName: string,
  ) {
    return this.pageLayoutService.schedulePublish(id, body, userId, roleName);
  }

  @Post(':id/unpublish')
  @Roles(RoleName.Admin, RoleName.SuperAdmin)
  @ZodSerializerDto(PageLayoutResDTO)
  unpublish(
    @Param('id') id: string,
    @ActiveUser('userId') userId: string,
    @ActiveUser('roleName') roleName: string,
  ) {
    return this.pageLayoutService.unpublish(id, userId, roleName);
  }

  @Post(':id/widgets')
  @Roles(RoleName.Admin, RoleName.SuperAdmin)
  @ZodSerializerDto(WidgetInstanceResDTO)
  addWidget(
    @Param('id') id: string,
    @Body() body: AddWidgetInstanceBodyDTO,
    @ActiveUser('userId') userId: string,
    @ActiveUser('roleName') roleName: string,
  ) {
    return this.pageLayoutService.addWidgetInstance(id, body, userId, roleName);
  }

  @Patch(':id/widgets/:instanceId')
  @Roles(RoleName.Admin, RoleName.SuperAdmin)
  @ZodSerializerDto(WidgetInstanceResDTO)
  updateWidget(
    @Param('id') id: string,
    @Param('instanceId') instanceId: string,
    @Body() body: UpdateWidgetInstanceBodyDTO,
    @ActiveUser('userId') userId: string,
    @ActiveUser('roleName') roleName: string,
  ) {
    return this.pageLayoutService.updateWidgetInstance(
      id,
      instanceId,
      body,
      userId,
      roleName,
    );
  }

  @Delete(':id/widgets/:instanceId')
  @Roles(RoleName.Admin, RoleName.SuperAdmin)
  @ZodSerializerDto(PageLayoutMessageResDTO)
  removeWidget(
    @Param('id') id: string,
    @Param('instanceId') instanceId: string,
    @ActiveUser('userId') userId: string,
    @ActiveUser('roleName') roleName: string,
  ) {
    return this.pageLayoutService.removeWidgetInstance(
      id,
      instanceId,
      userId,
      roleName,
    );
  }

  @Put(':id/widgets/reorder')
  @Roles(RoleName.Admin, RoleName.SuperAdmin)
  @ZodSerializerDto(PageLayoutResDTO)
  reorderWidgets(
    @Param('id') id: string,
    @Body() body: ReorderWidgetsBodyDTO,
    @ActiveUser('userId') userId: string,
    @ActiveUser('roleName') roleName: string,
  ) {
    return this.pageLayoutService.reorderWidgets(id, body, userId, roleName);
  }

  @Get(':id/versions')
  @Roles(RoleName.Admin, RoleName.SuperAdmin)
  @ZodSerializerDto(PageLayoutVersionListResDTO)
  listVersions(
    @Param('id') id: string,
    @ActiveUser('userId') userId: string,
    @ActiveUser('roleName') roleName: string,
  ) {
    return this.pageLayoutService.listVersions(id, userId, roleName);
  }

  @Get(':id/versions/:versionId')
  @Roles(RoleName.Admin, RoleName.SuperAdmin)
  @ZodSerializerDto(PageLayoutVersionResDTO)
  getVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @ActiveUser('userId') userId: string,
    @ActiveUser('roleName') roleName: string,
  ) {
    return this.pageLayoutService.getVersion(id, versionId, userId, roleName);
  }

  @Post(':id/versions/:versionId/rollback')
  @Roles(RoleName.Admin, RoleName.SuperAdmin)
  @ZodSerializerDto(PageLayoutResDTO)
  rollbackVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @Body() body: RollbackPageLayoutVersionBodyDTO,
    @ActiveUser('userId') userId: string,
    @ActiveUser('roleName') roleName: string,
  ) {
    return this.pageLayoutService.rollbackToVersion(
      id,
      versionId,
      userId,
      body,
      roleName,
    );
  }
}
