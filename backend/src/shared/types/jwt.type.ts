import { RoleName } from '../constants/role.constants';

export type CreateAccessTokenPayload = {
  userId: string;
  roleName: RoleName;
};

export type AccessTokenPayload = CreateAccessTokenPayload & {
  exp: number;
  iat: number;
};

export type CreateRefreshTokenPayload = {
  userId: string;
};

export type RefreshTokenPayload = CreateRefreshTokenPayload & {
  exp: number;
  iat: number;
};
