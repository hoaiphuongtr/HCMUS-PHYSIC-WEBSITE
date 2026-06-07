import { ForbiddenException, NotFoundException } from '@nestjs/common';

export const AdminNotFoundException = new NotFoundException([
  { field: 'id', error: 'Admin not found' },
]);

export const CannotMutateSuperAdminException = new ForbiddenException([
  { field: 'id', error: 'Cannot modify a super-admin account' },
]);
