import { ConflictException, NotFoundException } from '@nestjs/common';

export const PageLayoutSlugExistsException = new ConflictException([
  { field: 'slug', error: 'Page layout with this slug already exists' },
]);

export const PageLayoutNotFoundException = new NotFoundException([
  { field: 'id', error: 'Page layout not found' },
]);

export const WidgetInstanceNotFoundException = new NotFoundException([
  { field: 'instanceId', error: 'Widget instance not found' },
]);
