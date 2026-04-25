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
import { PostService } from './post.service';
import {
  CloneIntoLayoutBodyDTO,
  PostDraftResDTO,
  PostResDTO,
  UpsertPostBodyDTO,
} from './post.dto';
import { Roles } from '../shared/decorators/roles.decorator';
import { RoleName } from '../shared/constants/role.constants';
import { ActiveUser } from '../shared/decorators/active-user.decorator';

@Controller('posts')
@Roles(RoleName.Admin, RoleName.SuperAdmin)
export class PostController {
  constructor(private readonly postService: PostService) {}

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
