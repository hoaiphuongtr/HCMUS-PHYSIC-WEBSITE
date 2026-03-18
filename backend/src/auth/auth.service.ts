import { Injectable } from '@nestjs/common';
import { HashingService } from '../shared/services/hashing.service';
import { TokenService } from '../shared/services/token.service';
import { AuthRepository } from './auth.repo';
import {
  LoginBodyType,
  RefreshTokenResType,
  RegisterBodyType,
  CreateAdminBodyType,
} from './auth.model';
import { RoleName } from '../shared/constants/role.constants';
import {
  InvalidEmailException,
  InvalidPasswordException,
  InactiveAccountException,
  EmailAlreadyExistsException,
  DepartmentNotFoundException,
} from './auth.error';
import { CreateAccessTokenPayload } from '../shared/types/jwt.type';
import { DepartmentRepository } from '../department/department.repo';

@Injectable()
export class AuthService {
  constructor(
    private readonly hashingService: HashingService,
    private readonly tokenService: TokenService,
    private readonly authRepository: AuthRepository,
    private readonly departmentRepository: DepartmentRepository,
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
    const existing = await this.authRepository.findUniqueUserByEmail(
      body.email,
    );
    if (existing) throw EmailAlreadyExistsException;
    const hashedPassword = await this.hashingService.hash(body.password);
    return this.authRepository.createUser({
      email: body.email,
      password: hashedPassword,
      firstName: body.firstName,
      lastName: body.lastName,
      role: RoleName.User as any,
    });
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
}
