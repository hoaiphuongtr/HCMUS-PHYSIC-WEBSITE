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
