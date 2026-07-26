import { describe, it, expect } from 'vitest';
import {
  FACULTY_DEPT_ID,
  canAccessDepartment,
  departmentScopeWhere,
  mediaScopeWhere,
} from './helpers';

const BOMON = 'dept_legacy_6';

describe('departmentScopeWhere', () => {
  it('super-admin → no restriction', () => {
    expect(departmentScopeWhere('SUPER_ADMIN', BOMON)).toBeUndefined();
    expect(departmentScopeWhere('SUPER_ADMIN', null)).toBeUndefined();
  });
  it('faculty admin is faculty-wide → no restriction', () => {
    expect(departmentScopeWhere('ADMIN', FACULTY_DEPT_ID)).toBeUndefined();
  });
  it('dept-less admin is faculty-wide → no restriction', () => {
    expect(departmentScopeWhere('ADMIN', null)).toBeUndefined();
  });
  it('bộ-môn admin → only their department', () => {
    expect(departmentScopeWhere('ADMIN', BOMON)).toEqual({ departmentId: BOMON });
  });
});

describe('canAccessDepartment (mutation)', () => {
  it('super-admin → anything', () => {
    expect(canAccessDepartment('SUPER_ADMIN', BOMON, 'dept_legacy_3')).toBe(true);
  });
  it('bộ-môn admin → only own department', () => {
    expect(canAccessDepartment('ADMIN', BOMON, BOMON)).toBe(true);
    expect(canAccessDepartment('ADMIN', BOMON, 'dept_legacy_3')).toBe(false);
    expect(canAccessDepartment('ADMIN', BOMON, null)).toBe(false);
  });
  it('faculty admin is faculty-wide → anything', () => {
    expect(canAccessDepartment('ADMIN', FACULTY_DEPT_ID, FACULTY_DEPT_ID)).toBe(true);
    expect(canAccessDepartment('ADMIN', FACULTY_DEPT_ID, null)).toBe(true);
    expect(canAccessDepartment('ADMIN', FACULTY_DEPT_ID, BOMON)).toBe(true);
  });
});

describe('mediaScopeWhere (read = own + shared)', () => {
  it('bộ-môn admin → own dept + faculty + untagged', () => {
    expect(mediaScopeWhere('ADMIN', BOMON)).toEqual({
      OR: [
        { departmentId: BOMON },
        { departmentId: FACULTY_DEPT_ID },
        { departmentId: null },
      ],
    });
  });
  it('super-admin → no restriction', () => {
    expect(mediaScopeWhere('SUPER_ADMIN', BOMON)).toBeUndefined();
  });
});
