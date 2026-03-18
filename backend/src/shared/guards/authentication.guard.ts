import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  HttpException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  AUTH_TYPE_KEY,
  AuthType,
  ConditionType,
} from '../constants/auth.constants';
import { AccessTokenGuard } from './access-token.guard';
import { AuthDecoratorPayload } from '../decorators/auth.decorator';

@Injectable()
export class AuthenticationGuard implements CanActivate {
  private readonly authTypeGuardMap: Record<string, CanActivate>;

  constructor(
    private readonly reflector: Reflector,
    private readonly accessTokenGuard: AccessTokenGuard,
  ) {
    this.authTypeGuardMap = {
      [AuthType.Bearer]: this.accessTokenGuard,
      [AuthType.None]: { canActivate: () => true },
    };
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authTypeValue = this.getAuthTypeValue(context);
    const guards = authTypeValue.authType.map(
      (authType) => this.authTypeGuardMap[authType],
    );
    return authTypeValue.condition === ConditionType.And
      ? this.handleAndCondition(guards, context)
      : this.handleOrCondition(guards, context);
  }

  private getAuthTypeValue(context: ExecutionContext): AuthDecoratorPayload {
    return (
      this.reflector.getAllAndOverride<AuthDecoratorPayload | undefined>(
        AUTH_TYPE_KEY,
        [context.getHandler(), context.getClass()],
      ) ?? { authType: [AuthType.Bearer], condition: ConditionType.And }
    );
  }

  private async handleOrCondition(
    guards: CanActivate[],
    context: ExecutionContext,
  ) {
    let lastError: any = null;
    for (const guard of guards) {
      try {
        if (await guard.canActivate(context)) return true;
      } catch (error) {
        lastError = error;
      }
    }
    if (lastError instanceof HttpException) throw lastError;
    throw new UnauthorizedException();
  }

  private async handleAndCondition(
    guards: CanActivate[],
    context: ExecutionContext,
  ) {
    for (const guard of guards) {
      try {
        if (!(await guard.canActivate(context)))
          throw new UnauthorizedException();
      } catch (error) {
        if (error instanceof HttpException) throw error;
        throw new UnauthorizedException();
      }
    }
    return true;
  }
}
