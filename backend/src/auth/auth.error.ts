import { UnauthorizedException } from '@nestjs/common';

export const InvalidEmailException = new UnauthorizedException([
  { field: 'email', error: 'Email does not exist' },
]);

export const InvalidPasswordException = new UnauthorizedException([
  { field: 'password', error: 'Invalid password' },
]);

export const InactiveAccountException = new UnauthorizedException([
  { field: 'email', error: 'Account is inactive' },
]);
