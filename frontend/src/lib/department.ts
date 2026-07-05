// Client-side mirror of the backend department scope (backend/src/shared/helpers.ts).
// Backend is the source of truth / enforcement; this only hides affordances the user
// can't act on (e.g. shared faculty media a bộ-môn admin can see but not edit).
export const FACULTY_DEPT_ID = "dept_legacy_1";

/** Whether this user may mutate (edit/delete) content owned by `contentDept`. */
export function canMutateDepartment(
  role: string | undefined,
  userDept: string | null | undefined,
  contentDept: string | null | undefined,
): boolean {
  if (role === "SUPER_ADMIN") return true;
  if (!userDept || userDept === FACULTY_DEPT_ID) {
    return !contentDept || contentDept === FACULTY_DEPT_ID;
  }
  return contentDept === userDept;
}
