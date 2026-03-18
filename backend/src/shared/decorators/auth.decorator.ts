import { SetMetadata } from '@nestjs/common';
import {
  AUTH_TYPE_KEY,
  AuthType,
  ConditionType,
} from '../constants/auth.constants';

export const Auth = (authType: AuthType[], condition?: ConditionType) => {
  const conditionOption = condition ?? ConditionType.And;
  return SetMetadata(AUTH_TYPE_KEY, { authType, conditionOption });
};

export type AuthDecoratorPayload = {
  authType: AuthType[];
  condition: ConditionType;
};

export const IsPublic = () => Auth([AuthType.None]);
