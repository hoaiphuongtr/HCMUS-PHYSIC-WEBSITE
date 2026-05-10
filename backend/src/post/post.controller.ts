import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { ZodSerializerDto } from 'nestjs-zod';
import { PostService } from './post.service';
import {
  CloneIntoLayoutBodyDTO,
  PostDraftResDTO,
  PostResDTO,
  UpsertPostBodyDTO,
} from './post.dto';
import { IsPublic } from '../shared/decorators/auth.decorator';
import { Roles } from '../shared/decorators/roles.decorator';
import { RoleName } from '../shared/constants/role.constants';
import { ActiveUser } from '../shared/decorators/active-user.decorator';

const PUBLIC_LIST_TTL_MS = 5 * 60 * 1000;

const parseLimit = (raw: string | undefined, fallback: number) => {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(Math.floor(n), 50);
};

@Controller('posts')
@Roles(RoleName.Admin, RoleName.SuperAdmin)
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get('public/latest')
  @IsPublic()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(PUBLIC_LIST_TTL_MS)
  listLatestPublic(@Query('limit') limit?: string) {
    return this.postService.listLatestPublic(parseLimit(limit, 4));
  }

  @Get('public/upcoming-events')
  @IsPublic()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(PUBLIC_LIST_TTL_MS)
  listUpcomingEventsPublic(@Query('limit') limit?: string) {
    return this.postService.listUpcomingEventsPublic(parseLimit(limit, 4));
  }

  @Get('public/list')
  @IsPublic()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(PUBLIC_LIST_TTL_MS)
  listPagedPublic(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('category') category?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = Math.max(1, Number(page) || 1);
    const sizeNum = Math.max(1, Math.min(48, Number(pageSize) || 12));
    return this.postService.listPagedPublic({
      page: pageNum,
      pageSize: sizeNum,
      category,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
      search,
    });
  }

  @Post()
  @ZodSerializerDto(PostResDTO)
  create(
    @Body() body: UpsertPostBodyDTO,
    @ActiveUser('userId') userId: string,
  ) {
    return this.postService.create(body, userId);
  }

  @Get()
  list() {
    return this.postService.list();
  }

  @Get(':id')
  @ZodSerializerDto(PostResDTO)
  findById(@Param('id') id: string) {
    return this.postService.findById(id);
  }

  @Patch(':id')
  @ZodSerializerDto(PostResDTO)
  update(@Param('id') id: string, @Body() body: UpsertPostBodyDTO) {
    return this.postService.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.postService.delete(id);
  }

  @Post(':id/clone-into-layout')
  @ZodSerializerDto(PostDraftResDTO)
  cloneIntoLayout(
    @Param('id') id: string,
    @Body() body: CloneIntoLayoutBodyDTO,
    @ActiveUser('userId') userId: string,
  ) {
    return this.postService.cloneIntoLayout(id, body, userId);
  }
}
