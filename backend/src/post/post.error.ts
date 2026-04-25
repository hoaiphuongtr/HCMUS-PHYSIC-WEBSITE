import { ConflictException, NotFoundException } from '@nestjs/common';

export const TemplateLayoutNotFoundException = new NotFoundException([
  { field: 'templateLayoutId', error: 'Template layout không tồn tại' },
]);

export const PostNotFoundException = new NotFoundException([
  { field: 'id', error: 'Không tìm thấy bài đăng' },
]);

export const PostSlugExistsException = new ConflictException([
  { field: 'slug', error: 'Slug này đã được sử dụng cho bài đăng khác' },
]);
