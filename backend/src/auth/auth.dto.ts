import { createZodDto } from 'nestjs-zod';
import {
  LoginBodySchema,
  LoginResSchema,
  RefreshTokenBodySchema,
  RefreshTokenResSchema,
  RegisterBodySchema,
  CreateAdminBodySchema,
  UserResSchema,
} from './auth.model';

export class LoginBodyDTO extends createZodDto(LoginBodySchema) {}
export class LoginResDTO extends createZodDto(LoginResSchema) {}
export class RefreshTokenBodyDTO extends createZodDto(RefreshTokenBodySchema) {}
export class RefreshTokenResDTO extends createZodDto(RefreshTokenResSchema) {}
export class RegisterBodyDTO extends createZodDto(RegisterBodySchema) {}
export class CreateAdminBodyDTO extends createZodDto(CreateAdminBodySchema) {}
export class UserResDTO extends createZodDto(UserResSchema) {}
