import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TokenService } from './services/token.service';
import { HashingService } from './services/hashing.service';

@Global()
@Module({
  imports: [JwtModule.register({})],
  providers: [TokenService, HashingService],
  exports: [TokenService, HashingService],
})
export class SharedModule {}
