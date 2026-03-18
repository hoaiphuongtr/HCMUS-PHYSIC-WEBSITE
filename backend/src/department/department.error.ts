import { ConflictException, NotFoundException } from '@nestjs/common';

export const DepartmentSlugExistsException = new ConflictException([
  { field: 'slug', error: 'Department with this slug already exists' },
]);

export const DepartmentNotFoundException = new NotFoundException([
  { field: 'id', error: 'Department not found' },
]);
