import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { TokenService } from './services/token.service';
import { HashingService } from './services/hashing.service';
import { AuthenticationGuard } from './guards/authentication.guard';
import { AccessTokenGuard } from './guards/access-token.guard';
import { RolesGuard } from './guards/roles.guard';

const sharedServices = [TokenService, HashingService];

@Global()
@Module({
  imports: [JwtModule.register({})],
  providers: [
    ...sharedServices,
    AccessTokenGuard,
    {
      provide: APP_GUARD,
      useClass: AuthenticationGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: sharedServices,
})
export class SharedModule {}
