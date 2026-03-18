import { Body, Controller, Get, Post, Query, Req, Res } from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { GoogleService } from './google.service';
import {
  LoginBodyDTO,
  LoginResDTO,
  RefreshTokenBodyDTO,
  RefreshTokenResDTO,
  RegisterBodyDTO,
  CreateAdminBodyDTO,
  UserResDTO,
  SendOTPBodyDTO,
  ForgotPasswordBodyDTO,
  GetAuthorizationUrlResDTO,
  MessageResDTO,
} from './auth.dto';
import { IsPublic } from '../shared/decorators/auth.decorator';
import { Roles } from '../shared/decorators/roles.decorator';
import { RoleName } from '../shared/constants/role.constants';
import envConfig from '../shared/config/config';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly googleService: GoogleService,
  ) {}

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

  @Post('otp')
  @IsPublic()
  @ZodSerializerDto(MessageResDTO)
  sendOTP(@Body() body: SendOTPBodyDTO) {
    return this.authService.sendOTP(body);
  }

  @Post('forgot-password')
  @IsPublic()
  @ZodSerializerDto(MessageResDTO)
  forgotPassword(@Body() body: ForgotPasswordBodyDTO) {
    return this.authService.forgotPassword(body);
  }

  @Post('logout')
  @ZodSerializerDto(MessageResDTO)
  logout(@Body() body: RefreshTokenBodyDTO) {
    return this.authService.logout(body.refreshToken);
  }

  @Get('google-link')
  @IsPublic()
  @ZodSerializerDto(GetAuthorizationUrlResDTO)
  getGoogleAuthorizationUrl(@Req() req: Request) {
    return this.googleService.getAuthorizationUrl({
      userAgent: req.headers['user-agent'] ?? 'Unknown',
      ip: req.ip ?? 'Unknown',
    });
  }

  @Get('google/callback')
  @IsPublic()
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    try {
      const { accessToken, refreshToken } =
        await this.googleService.googleCallback({ code, state });
      return res.redirect(
        `${envConfig.GOOGLE_CLIENT_REDIRECT_URI}?accessToken=${accessToken}&refreshToken=${refreshToken}`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Google login failed';
      return res.redirect(
        `${envConfig.GOOGLE_CLIENT_REDIRECT_URI}?errorMessage=${encodeURIComponent(message)}`,
      );
    }
  }
}
