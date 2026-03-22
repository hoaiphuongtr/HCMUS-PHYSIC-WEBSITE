import { ConflictException, NotFoundException } from '@nestjs/common';

export const WidgetTypeExistsException = new ConflictException([
  { field: 'type', error: 'Widget with this type already exists' },
]);

export const WidgetNotFoundException = new NotFoundException([
  { field: 'id', error: 'Widget not found' },
]);
