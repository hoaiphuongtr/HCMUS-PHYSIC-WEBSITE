import type { ExecutionContext } from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { describe, expect, it } from 'vitest';
import {
  AUTH_TYPE_KEY,
  AuthType,
  ConditionType,
  REQUEST_USER_KEY,
  ROLES_KEY,
} from '../constants/auth.constants';
import { RoleName } from '../constants/role.constants';
import type { AccessTokenPayload } from '../types/jwt.type';
import { RolesGuard } from './roles.guard';

const FACULTY_DEPT_ID = 'dept_legacy_1';
const BOMON = 'dept_legacy_6';

type Case = {
  isPublic?: boolean;
  requiredRoles?: RoleName[];
  user?: Partial<AccessTokenPayload> | null;
};

function run({ isPublic, requiredRoles, user }: Case) {
  const reflector = {
    getAllAndOverride: (key: string) => {
      if (key === AUTH_TYPE_KEY) {
        return isPublic
          ? { authType: [AuthType.None], condition: ConditionType.And }
          : undefined;
      }
      if (key === ROLES_KEY) return requiredRoles;
      return undefined;
    },
  } as unknown as Reflector;

  const request: Record<string, unknown> = {};
  if (user !== undefined && user !== null) request[REQUEST_USER_KEY] = user;

  const context = {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;

  return new RolesGuard(reflector).canActivate(context);
}

describe('RolesGuard — route công khai', () => {
  it('@IsPublic() đi qua, không cần tài khoản', () => {
    expect(run({ isPublic: true, user: null })).toBe(true);
  });
});

describe('RolesGuard — route KHÔNG ghi @Roles (mặc định là trang quản trị)', () => {
  it('ADMIN đi qua', () => {
    expect(
      run({ user: { roleName: RoleName.Admin, departmentId: BOMON } }),
    ).toBe(true);
  });

  it('SUPER_ADMIN đi qua', () => {
    expect(
      run({ user: { roleName: RoleName.SuperAdmin, departmentId: null } }),
    ).toBe(true);
  });

  // Đây là lý do tồn tại của bản vá: trước khi có LECTURER, nhánh "không ghi
  // @Roles" trả true cho MỌI tài khoản đã đăng nhập. Thêm một vai trò ngoài vào
  // là mở toang hàng trăm route quản trị chưa từng gắn @Roles.
  it('LECTURER bị chặn', () => {
    expect(() =>
      run({ user: { roleName: RoleName.Lecturer, departmentId: null } }),
    ).toThrow(ForbiddenException);
  });

  it('không có tài khoản thì bị chặn', () => {
    expect(() => run({ user: null })).toThrow(ForbiddenException);
  });
});

describe('RolesGuard — quyền toàn Khoa chỉ dành cho admin', () => {
  it('admin văn phòng khoa (không gắn bộ môn) thoả cổng SUPER_ADMIN', () => {
    expect(
      run({
        requiredRoles: [RoleName.SuperAdmin],
        user: { roleName: RoleName.Admin, departmentId: null },
      }),
    ).toBe(true);
  });

  it('admin gắn đúng bộ môn Khoa cũng thoả cổng SUPER_ADMIN', () => {
    expect(
      run({
        requiredRoles: [RoleName.SuperAdmin],
        user: { roleName: RoleName.Admin, departmentId: FACULTY_DEPT_ID },
      }),
    ).toBe(true);
  });

  it('admin bộ môn KHÔNG thoả cổng SUPER_ADMIN', () => {
    expect(() =>
      run({
        requiredRoles: [RoleName.SuperAdmin],
        user: { roleName: RoleName.Admin, departmentId: BOMON },
      }),
    ).toThrow(ForbiddenException);
  });

  // Cái bẫy: giảng viên không gắn bộ môn từng thừa hưởng quyền toàn Khoa vì
  // điều kiện cũ chỉ xét `!user.departmentId`.
  it('LECTURER không gắn bộ môn KHÔNG thừa hưởng quyền toàn Khoa', () => {
    expect(() =>
      run({
        requiredRoles: [RoleName.SuperAdmin],
        user: { roleName: RoleName.Lecturer, departmentId: null },
      }),
    ).toThrow(ForbiddenException);
  });
});

describe('RolesGuard — route cấp quyền tường minh cho giảng viên', () => {
  it('LECTURER đi qua route ghi @Roles(Lecturer)', () => {
    expect(
      run({
        requiredRoles: [RoleName.Lecturer, RoleName.Admin, RoleName.SuperAdmin],
        user: { roleName: RoleName.Lecturer, departmentId: null },
      }),
    ).toBe(true);
  });

  it('admin cũng đi qua route đó', () => {
    expect(
      run({
        requiredRoles: [RoleName.Lecturer, RoleName.Admin, RoleName.SuperAdmin],
        user: { roleName: RoleName.Admin, departmentId: BOMON },
      }),
    ).toBe(true);
  });

  it('LECTURER bị chặn ở route chỉ cho admin', () => {
    expect(() =>
      run({
        requiredRoles: [RoleName.Admin, RoleName.SuperAdmin],
        user: { roleName: RoleName.Lecturer, departmentId: null },
      }),
    ).toThrow(ForbiddenException);
  });
});
