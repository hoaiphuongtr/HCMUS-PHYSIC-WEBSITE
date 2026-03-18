import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, REQUEST_USER_KEY } from '../constants/auth.constants';
import { RoleName } from '../constants/role.constants';
import { AccessTokenPayload } from '../types/jwt.type';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleName[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) return true;
    const request = context.switchToHttp().getRequest();
    const user: AccessTokenPayload = request[REQUEST_USER_KEY];
    if (!user || !requiredRoles.includes(user.roleName)) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}
