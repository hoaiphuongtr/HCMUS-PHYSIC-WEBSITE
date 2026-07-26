import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  AUTH_TYPE_KEY,
  AuthType,
  ROLES_KEY,
  REQUEST_USER_KEY,
} from '../constants/auth.constants';
import { RoleName } from '../constants/role.constants';
import { AccessTokenPayload } from '../types/jwt.type';
import { AuthDecoratorPayload } from '../decorators/auth.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const authPayload = this.reflector.getAllAndOverride<
      AuthDecoratorPayload | undefined
    >(AUTH_TYPE_KEY, [context.getHandler(), context.getClass()]);
    if (authPayload?.authType?.includes(AuthType.None)) return true;

    const requiredRoles = this.reflector.getAllAndOverride<RoleName[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) return true;
    const request = context.switchToHttp().getRequest();
    const user: AccessTokenPayload = request[REQUEST_USER_KEY];
    if (!user) throw new ForbiddenException('Insufficient permissions');
    // The Khoa's super admin and the văn-phòng-khoa admin are one: a faculty-office
    // admin (no department, or the faculty department) satisfies SUPER_ADMIN gates.
    // Bộ-môn admins (a specific department) remain scoped to their own role.
    const FACULTY_DEPT_ID = 'dept_legacy_1';
    const isFacultyWide =
      user.roleName === RoleName.SuperAdmin ||
      !user.departmentId ||
      user.departmentId === FACULTY_DEPT_ID;
    const allowed =
      requiredRoles.includes(user.roleName) ||
      (isFacultyWide && requiredRoles.includes(RoleName.SuperAdmin));
    if (!allowed) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}
