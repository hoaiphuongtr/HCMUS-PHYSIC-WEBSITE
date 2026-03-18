import { Body, Controller, Post } from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import { AuthService } from './auth.service';
import {
  LoginBodyDTO,
  LoginResDTO,
  RefreshTokenBodyDTO,
  RefreshTokenResDTO,
  RegisterBodyDTO,
  CreateAdminBodyDTO,
  UserResDTO,
} from './auth.dto';
import { IsPublic } from '../shared/decorators/auth.decorator';
import { Roles } from '../shared/decorators/roles.decorator';
import { RoleName } from '../shared/constants/role.constants';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @IsPublic()
  @ZodSerializerDto(LoginResDTO)
  login(@Body() body: LoginBodyDTO) {
    return this.authService.login(body);
  }

  @Post('register')
  @IsPublic()
  @ZodSerializerDto(UserResDTO)
  register(@Body() body: RegisterBodyDTO) {
    return this.authService.register(body);
  }

  @Post('create-admin')
  @Roles(RoleName.SuperAdmin)
  @ZodSerializerDto(UserResDTO)
  createAdmin(@Body() body: CreateAdminBodyDTO) {
    return this.authService.createAdmin(body);
  }

  @Post('refresh-token')
  @IsPublic()
  @ZodSerializerDto(RefreshTokenResDTO)
  refreshToken(@Body() body: RefreshTokenBodyDTO) {
    return this.authService.refreshToken(body.refreshToken);
  }
}
