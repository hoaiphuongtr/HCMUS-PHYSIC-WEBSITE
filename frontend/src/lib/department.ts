// Client-side mirror of the backend department scope (backend/src/shared/helpers.ts).
// Backend is the source of truth / enforcement; this only hides affordances the user
// can't act on (e.g. shared faculty media a bộ-môn admin can see but not edit).
export const FACULTY_DEPT_ID = "dept_legacy_1";

/**
 * The Khoa's super admin and the văn-phòng-khoa admin are one: a SUPER_ADMIN, or any
 * admin with no department / the faculty department, has faculty-wide (full) access.
 * Only bộ-môn admins (a specific department) stay scoped.
 */
export function isFacultyWide(
  role: string | undefined,
  dept: string | null | undefined,
): boolean {
  return role === "SUPER_ADMIN" || !dept || dept === FACULTY_DEPT_ID;
}

/** Whether this user may mutate (edit/delete) content owned by `contentDept`. */
export function canMutateDepartment(
  role: string | undefined,
  userDept: string | null | undefined,
  contentDept: string | null | undefined,
): boolean {
  if (isFacultyWide(role, userDept)) return true;
  return contentDept === userDept;
}
