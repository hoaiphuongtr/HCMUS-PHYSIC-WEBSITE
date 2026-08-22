export enum RoleName {
  Admin = 'ADMIN',
  SuperAdmin = 'SUPER_ADMIN',
  // Giảng viên khai hồ sơ khoa học ở profile.phys.hcmus.edu.vn. KHÔNG phải người
  // dùng của trang quản trị: tài khoản này chỉ vào được những route ghi rõ
  // @Roles(RoleName.Lecturer). Xem RolesGuard.
  Lecturer = 'LECTURER',
}

/** Các vai trò được dùng trang quản trị. Mọi thứ ngoài danh sách này là người
 *  dùng ngoài, phải được cấp quyền từng route một. */
export const ADMIN_ROLES: RoleName[] = [RoleName.Admin, RoleName.SuperAdmin];
