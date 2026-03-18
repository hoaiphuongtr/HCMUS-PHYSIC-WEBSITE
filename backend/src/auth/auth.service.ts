import { Injectable } from '@nestjs/common';
import { addMilliseconds } from 'date-fns';
import ms, { type StringValue } from 'ms';
import { HashingService } from '../shared/services/hashing.service';
import { TokenService } from '../shared/services/token.service';
import { AuthRepository } from './auth.repo';
import {
  LoginBodyType,
  RefreshTokenResType,
  RegisterBodyType,
  CreateAdminBodyType,
  SendOTPBodyType,
  VerifyOTPBodyType,
  ForgotPasswordBodyType,
} from './auth.model';
import { RoleName } from '../shared/constants/role.constants';
import { VerificationMethod } from '../shared/constants/auth.constants';
import {
  InvalidEmailException,
  InvalidPasswordException,
  InactiveAccountException,
  EmailAlreadyExistsException,
  DepartmentNotFoundException,
  InvalidOTPException,
  ExpiredOTPException,
} from './auth.error';
import { CreateAccessTokenPayload } from '../shared/types/jwt.type';
import { DepartmentRepository } from '../department/department.repo';
import { EmailService } from '../shared/email/email.service';
import { generateOTP } from '../shared/helpers';
import envConfig from '../shared/config/config';
import { VerificationCodeType } from '../generated/prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly hashingService: HashingService,
    private readonly tokenService: TokenService,
    private readonly authRepository: AuthRepository,
    private readonly departmentRepository: DepartmentRepository,
    private readonly emailService: EmailService,
  ) {}

  async login(body: LoginBodyType) {
    const user = await this.authRepository.findUniqueUserByEmail(body.email);
    if (!user) throw InvalidEmailException;
    if (!user.isActive) throw InactiveAccountException;
    if (!user.password) throw InvalidPasswordException;
    const isPasswordMatch = await this.hashingService.compare(
      body.password,
      user.password,
    );
    if (!isPasswordMatch) throw InvalidPasswordException;
    return this.generateTokens({
      userId: user.id,
      roleName: user.role as RoleName,
    });
  }

  async register(body: RegisterBodyType) {
    await this.validateVerificationCode({
      email: body.email,
      code: body.code,
      type: VerificationMethod.Register,
    });
    const existing = await this.authRepository.findUniqueUserByEmail(
      body.email,
    );
    if (existing) throw EmailAlreadyExistsException;
    const hashedPassword = await this.hashingService.hash(body.password);
    const [user] = await Promise.all([
      this.authRepository.createUser({
        email: body.email,
        password: hashedPassword,
        firstName: body.firstName,
        lastName: body.lastName,
        role: RoleName.User as any,
      }),
      this.authRepository.deleteVerificationCode({
        email: body.email,
        type: VerificationCodeType.REGISTER,
      }),
    ]);
    return user;
  }

  async createAdmin(body: CreateAdminBodyType) {
    const existing = await this.authRepository.findUniqueUserByEmail(
      body.email,
    );
    if (existing) throw EmailAlreadyExistsException;
    if (body.departmentId) {
      const department = await this.departmentRepository.findById(
        body.departmentId,
      );
      if (!department) throw DepartmentNotFoundException;
    }
    const hashedPassword = await this.hashingService.hash(body.password);
    return this.authRepository.createUser({
      email: body.email,
      password: hashedPassword,
      firstName: body.firstName,
      lastName: body.lastName,
      role: RoleName.Admin as any,
      phone: body.phone,
      position: body.position,
      bio: body.bio,
      departmentId: body.departmentId,
    });
  }

  async sendOTP(body: SendOTPBodyType) {
    const user = await this.authRepository.findUniqueUserByEmail(body.email);
    if (user && body.type === VerificationMethod.Register)
      throw EmailAlreadyExistsException;
    if (!user && body.type === VerificationMethod.ForgotPassword)
      throw InvalidEmailException;
    const code = generateOTP();
    await this.authRepository.createVerificationCode({
      email: body.email,
      code,
      type: body.type as unknown as VerificationCodeType,
      expiresAt: addMilliseconds(
        new Date(),
        ms(envConfig.OTP_EXPIRES_IN as StringValue),
      ),
    });
    await this.emailService.sendOTP(body.email, code);
    return { message: 'Send OTP successfully' };
  }

  async verifyOTP(body: VerifyOTPBodyType) {
    await this.validateVerificationCode({
      email: body.email,
      code: body.code,
      type: body.type as unknown as VerificationMethod,
    });
    return { message: 'Verification code is valid' };
  }

  async validateVerificationCode({
    email,
    code,
    type,
  }: {
    email: string;
    code: string;
    type: VerificationMethod;
  }) {
    const existing = await this.authRepository.findVerificationCode({
      email,
      code,
      type: type as unknown as VerificationCodeType,
    });
    if (!existing || existing.code !== code) throw InvalidOTPException;
    if (new Date(existing.expiresAt) < new Date()) throw ExpiredOTPException;
    return existing;
  }

  async forgotPassword(body: ForgotPasswordBodyType) {
    const user = await this.authRepository.findUniqueUserByEmail(body.email);
    if (!user) throw InvalidEmailException;
    await this.validateVerificationCode({
      email: body.email,
      code: body.code,
      type: VerificationMethod.ForgotPassword,
    });
    const hashedNewPassword = await this.hashingService.hash(body.newPassword);
    await Promise.all([
      this.authRepository.updateUserPassword(body.email, hashedNewPassword),
      this.authRepository.deleteVerificationCode({
        email: body.email,
        type: VerificationCodeType.FORGOT_PASSWORD,
      }),
    ]);
    return { message: 'Change password successfully' };
  }

  async generateTokens(payload: CreateAccessTokenPayload) {
    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.signAccessToken(payload),
      this.tokenService.signRefreshToken({ userId: payload.userId }),
    ]);
    return { accessToken, refreshToken };
  }

  async refreshToken(refreshToken: string): Promise<RefreshTokenResType> {
    const decoded = await this.tokenService.verifyRefreshToken(refreshToken);
    const user = await this.authRepository.findUniqueUserById(decoded.userId);
    if (!user) throw InvalidEmailException;
    if (!user.isActive) throw InactiveAccountException;
    return this.generateTokens({
      userId: user.id,
      roleName: user.role as RoleName,
    });
  }

  async logout(refreshToken: string) {
    await this.tokenService.verifyRefreshToken(refreshToken);
    return { message: 'Logout successfully' };
  }
}
