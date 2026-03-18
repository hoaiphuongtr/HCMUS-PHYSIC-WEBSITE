import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repo';
import { GoogleService } from './google.service';
import { DepartmentModule } from '../department/department.module';

@Module({
  imports: [DepartmentModule],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository, GoogleService],
  exports: [AuthService],
})
export class AuthModule {}
