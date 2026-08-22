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
import { ADMIN_ROLES, RoleName } from '../constants/role.constants';
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
    const request = context.switchToHttp().getRequest();
    const user: AccessTokenPayload = request[REQUEST_USER_KEY];
    if (!user) throw new ForbiddenException('Insufficient permissions');

    // Route không ghi @Roles = route của trang quản trị. Mặc định CHẶN mọi vai trò
    // ngoài admin — nếu để "đã đăng nhập là qua" thì thêm bất kỳ vai trò ngoài nào
    // (LECTURER) cũng mở toang hàng trăm route cũ chưa từng gắn @Roles.
    if (!requiredRoles) {
      if (!ADMIN_ROLES.includes(user.roleName)) {
        throw new ForbiddenException('Insufficient permissions');
      }
      return true;
    }

    // The Khoa's super admin and the văn-phòng-khoa admin are one: a faculty-office
    // admin (no department, or the faculty department) satisfies SUPER_ADMIN gates.
    // Bộ-môn admins (a specific department) remain scoped to their own role.
    // Chỉ áp dụng cho vai trò admin: một tài khoản ngoài không gắn bộ môn KHÔNG
    // được thừa hưởng quyền toàn Khoa.
    const FACULTY_DEPT_ID = 'dept_legacy_1';
    const isFacultyWide =
      ADMIN_ROLES.includes(user.roleName) &&
      (user.roleName === RoleName.SuperAdmin ||
        !user.departmentId ||
        user.departmentId === FACULTY_DEPT_ID);
    const allowed =
      requiredRoles.includes(user.roleName) ||
      (isFacultyWide && requiredRoles.includes(RoleName.SuperAdmin));
    if (!allowed) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}
