import { randomInt } from 'crypto';

export const generateOTP = () => {
  return String(randomInt(100000, 1000000));
};

const VIETNAMESE_MAP: Record<string, string> = {
  à: 'a',
  á: 'a',
  ả: 'a',
  ã: 'a',
  ạ: 'a',
  ă: 'a',
  ằ: 'a',
  ắ: 'a',
  ẳ: 'a',
  ẵ: 'a',
  ặ: 'a',
  â: 'a',
  ầ: 'a',
  ấ: 'a',
  ẩ: 'a',
  ẫ: 'a',
  ậ: 'a',
  è: 'e',
  é: 'e',
  ẻ: 'e',
  ẽ: 'e',
  ẹ: 'e',
  ê: 'e',
  ề: 'e',
  ế: 'e',
  ể: 'e',
  ễ: 'e',
  ệ: 'e',
  ì: 'i',
  í: 'i',
  ỉ: 'i',
  ĩ: 'i',
  ị: 'i',
  ò: 'o',
  ó: 'o',
  ỏ: 'o',
  õ: 'o',
  ọ: 'o',
  ô: 'o',
  ồ: 'o',
  ố: 'o',
  ổ: 'o',
  ỗ: 'o',
  ộ: 'o',
  ơ: 'o',
  ờ: 'o',
  ớ: 'o',
  ở: 'o',
  ỡ: 'o',
  ợ: 'o',
  ù: 'u',
  ú: 'u',
  ủ: 'u',
  ũ: 'u',
  ụ: 'u',
  ư: 'u',
  ừ: 'u',
  ứ: 'u',
  ử: 'u',
  ữ: 'u',
  ự: 'u',
  ỳ: 'y',
  ý: 'y',
  ỷ: 'y',
  ỹ: 'y',
  ỵ: 'y',
  đ: 'd',
  À: 'A',
  Á: 'A',
  Ả: 'A',
  Ã: 'A',
  Ạ: 'A',
  Ă: 'A',
  Ằ: 'A',
  Ắ: 'A',
  Ẳ: 'A',
  Ẵ: 'A',
  Ặ: 'A',
  Â: 'A',
  Ầ: 'A',
  Ấ: 'A',
  Ẩ: 'A',
  Ẫ: 'A',
  Ậ: 'A',
  È: 'E',
  É: 'E',
  Ẻ: 'E',
  Ẽ: 'E',
  Ẹ: 'E',
  Ê: 'E',
  Ề: 'E',
  Ế: 'E',
  Ể: 'E',
  Ễ: 'E',
  Ệ: 'E',
  Ì: 'I',
  Í: 'I',
  Ỉ: 'I',
  Ĩ: 'I',
  Ị: 'I',
  Ò: 'O',
  Ó: 'O',
  Ỏ: 'O',
  Õ: 'O',
  Ọ: 'O',
  Ô: 'O',
  Ồ: 'O',
  Ố: 'O',
  Ổ: 'O',
  Ỗ: 'O',
  Ộ: 'O',
  Ơ: 'O',
  Ờ: 'O',
  Ớ: 'O',
  Ở: 'O',
  Ỡ: 'O',
  Ợ: 'O',
  Ù: 'U',
  Ú: 'U',
  Ủ: 'U',
  Ũ: 'U',
  Ụ: 'U',
  Ư: 'U',
  Ừ: 'U',
  Ứ: 'U',
  Ử: 'U',
  Ữ: 'U',
  Ự: 'U',
  Ỳ: 'Y',
  Ý: 'Y',
  Ỷ: 'Y',
  Ỹ: 'Y',
  Ỵ: 'Y',
  Đ: 'D',
};

export function toSlug(text: string): string {
  return text
    .split('')
    .map((c) => VIETNAMESE_MAP[c] || c)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function toSlugPath(text: string): string {
  return text
    .split('/')
    .map((segment) => toSlug(segment))
    .filter(Boolean)
    .join('/');
}

// --- Department-scoped access ------------------------------------------------
// The main faculty ("Khoa Vật lý") — its content is faculty-wide (no URL prefix)
// and managed by the văn phòng khoa admin. Untagged (null) content is treated the same.
export const FACULTY_DEPT_ID = 'dept_legacy_1';

/**
 * Prisma `where` fragment restricting content to what this user may SEE/LIST by
 * department. Returns `undefined` for super-admin (no restriction).
 *  - Faculty admin (dept = faculty) or dept-less admin → faculty content + untagged.
 *  - Bộ-môn admin → only their department.
 */
export function departmentScopeWhere(
  roleName: string,
  departmentId: string | null | undefined,
): { departmentId: string } | { OR: { departmentId: string | null }[] } | undefined {
  if (roleName === 'SUPER_ADMIN') return undefined;
  if (!departmentId || departmentId === FACULTY_DEPT_ID) {
    return { OR: [{ departmentId: FACULTY_DEPT_ID }, { departmentId: null }] };
  }
  return { departmentId };
}

/**
 * Read scope for media: a bộ-môn admin sees their own department's media PLUS
 * shared faculty/untagged media (so shared assets stay usable in the picker).
 * Mutation is still gated by canAccessDepartment (own department only).
 */
export function mediaScopeWhere(
  roleName: string,
  departmentId: string | null | undefined,
): { OR: { departmentId: string | null }[] } | undefined {
  if (roleName === 'SUPER_ADMIN') return undefined;
  const ors: { departmentId: string | null }[] = [
    { departmentId: FACULTY_DEPT_ID },
    { departmentId: null },
  ];
  if (departmentId && departmentId !== FACULTY_DEPT_ID) {
    ors.unshift({ departmentId });
  }
  return { OR: ors };
}

/** Whether a user may MUTATE content owned by `contentDept`. */
export function canAccessDepartment(
  roleName: string,
  userDept: string | null | undefined,
  contentDept: string | null | undefined,
): boolean {
  if (roleName === 'SUPER_ADMIN') return true;
  if (!userDept || userDept === FACULTY_DEPT_ID) {
    return !contentDept || contentDept === FACULTY_DEPT_ID;
  }
  return contentDept === userDept;
}
