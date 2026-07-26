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
import { CategoryService } from './category.service';
import {
  CategoryListResDTO,
  CategoryResDTO,
  CreateCategoryBodyDTO,
  UpdateCategoryBodyDTO,
} from './category.dto';
import { IsPublic } from '../shared/decorators/auth.decorator';
import { Roles } from '../shared/decorators/roles.decorator';
import { RoleName } from '../shared/constants/role.constants';
import { ActiveUser } from '../shared/decorators/active-user.decorator';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @IsPublic()
  @ZodSerializerDto(CategoryListResDTO)
  list() {
    return this.categoryService.list();
  }

  @Get(':id')
  @IsPublic()
  @ZodSerializerDto(CategoryResDTO)
  findById(@Param('id') id: string) {
    return this.categoryService.findById(id);
  }

  @Post()
  @Roles(RoleName.SuperAdmin)
  @ZodSerializerDto(CategoryResDTO)
  create(
    @Body() body: CreateCategoryBodyDTO,
    @ActiveUser('userId') userId: string,
  ) {
    return this.categoryService.create(body, userId);
  }

  @Patch(':id')
  @Roles(RoleName.SuperAdmin)
  @ZodSerializerDto(CategoryResDTO)
  update(@Param('id') id: string, @Body() body: UpdateCategoryBodyDTO) {
    return this.categoryService.update(id, body);
  }

  @Delete(':id')
  @Roles(RoleName.SuperAdmin)
  remove(@Param('id') id: string) {
    return this.categoryService.remove(id);
  }
}
