import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY } from '../constants/auth.constants';
import { RoleName } from '../constants/role.constants';

export const Roles = (...roles: RoleName[]) => SetMetadata(ROLES_KEY, roles);
