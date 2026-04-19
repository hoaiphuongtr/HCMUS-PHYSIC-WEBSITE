import { ConflictException, NotFoundException } from '@nestjs/common';

export const PageLayoutSlugExistsException = new ConflictException([
  { field: 'slug', error: 'Page layout with this slug already exists' },
]);

export const slugExistsInStatusException = (
  status: 'published' | 'draft',
  name?: string,
) =>
  new ConflictException([
    {
      field: 'slug',
      error: `Slug này đã tồn tại ở layout ${status}${name ? ` "${name}"` : ''}`,
    },
  ]);

export const PageLayoutNotFoundException = new NotFoundException([
  { field: 'id', error: 'Page layout not found' },
]);

export const WidgetInstanceNotFoundException = new NotFoundException([
  { field: 'instanceId', error: 'Widget instance not found' },
]);
