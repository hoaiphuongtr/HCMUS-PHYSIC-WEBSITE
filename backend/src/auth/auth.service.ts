import { Injectable } from '@nestjs/common';
import { HashingService } from '../shared/services/hashing.service';
import { TokenService } from '../shared/services/token.service';
import { AuthRepository } from './auth.repo';
import { LoginBodyType, RefreshTokenResType } from './auth.model';
import { RoleName } from '../shared/constants/role.constants';
import {
  InvalidEmailException,
  InvalidPasswordException,
  InactiveAccountException,
} from './auth.error';
import { CreateAccessTokenPayload } from '../shared/types/jwt.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly hashingService: HashingService,
    private readonly tokenService: TokenService,
    private readonly authRepository: AuthRepository,
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
    const tokens = await this.generateTokens({
      userId: user.id,
      roleName: user.role as RoleName,
    });
    return tokens;
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
