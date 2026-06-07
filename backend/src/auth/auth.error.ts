import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

export const InvalidEmailException = new UnauthorizedException([
  { field: 'email', error: 'Email does not exist' },
]);

export const InvalidPasswordException = new UnauthorizedException([
  { field: 'password', error: 'Invalid password' },
]);

export const InactiveAccountException = new UnauthorizedException([
  { field: 'email', error: 'Account is inactive' },
]);

export const EmailAlreadyExistsException = new ConflictException([
  { field: 'email', error: 'Email already exists' },
]);

export const DepartmentNotFoundException = new NotFoundException([
  { field: 'departmentId', error: 'Department not found' },
]);

export const InvalidOTPException = new UnauthorizedException([
  { field: 'code', error: 'Invalid OTP code' },
]);

export const ExpiredOTPException = new UnauthorizedException([
  { field: 'code', error: 'Expired OTP code' },
]);

export const CurrentPasswordMismatchException = new UnauthorizedException([
  { field: 'currentPassword', error: 'Mật khẩu hiện tại không đúng' },
]);

export const SamePasswordException = new ConflictException([
  { field: 'newPassword', error: 'Mật khẩu mới phải khác mật khẩu hiện tại' },
]);
