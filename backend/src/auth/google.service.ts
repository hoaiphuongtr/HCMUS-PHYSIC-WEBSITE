import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { v4 as uuidv4 } from 'uuid';
import envConfig from '../shared/config/config';
import { AuthRepository } from './auth.repo';
import { HashingService } from '../shared/services/hashing.service';
import { AuthService } from './auth.service';
import { GoogleAuthStateType } from './auth.model';
import { RoleName } from '../shared/constants/role.constants';

@Injectable()
export class GoogleService {
  private readonly oauth2Client: OAuth2Client;

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly hashingService: HashingService,
    private readonly authService: AuthService,
  ) {
    this.oauth2Client = new google.auth.OAuth2(
      envConfig.GOOGLE_CLIENT_ID,
      envConfig.GOOGLE_CLIENT_SECRET,
      envConfig.GOOGLE_REDIRECT_URI,
    );
  }

  getAuthorizationUrl({ userAgent, ip }: GoogleAuthStateType) {
    const state = Buffer.from(JSON.stringify({ userAgent, ip })).toString(
      'base64',
    );
    const scope = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ];
    const url = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope,
      state,
    });
    return { url };
  }

  async googleCallback({ code, state }: { code: string; state: string }) {
    let userAgent = 'Unknown';
    let ip = 'Unknown';
    try {
      if (state) {
        const clientInfo = JSON.parse(
          Buffer.from(state, 'base64').toString(),
        ) as GoogleAuthStateType;
        userAgent = clientInfo.userAgent;
        ip = clientInfo.ip;
      }
    } catch {
      // ignore state parsing errors
    }
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ auth: this.oauth2Client, version: 'v2' });
    const { data } = await oauth2.userinfo.get();
    if (!data.email) throw new Error('Cannot get user information from Google');
    let user = await this.authRepository.findUniqueUserByEmailButOmitPassword(
      data.email,
    );
    if (!user) {
      const randomPassword = uuidv4();
      const hashedPassword = await this.hashingService.hash(randomPassword);
      user = await this.authRepository.createUserFromGoogle({
        email: data.email,
        password: hashedPassword,
        firstName: data.given_name ?? '',
        lastName: data.family_name ?? '',
        avatarUrl: data.picture ?? null,
        googleId: data.id ?? '',
      });
    }
    return this.authService.generateTokens({
      userId: user!.id,
      roleName: user!.role as RoleName,
    });
  }
}
