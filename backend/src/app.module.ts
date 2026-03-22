import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SentryModule } from '@sentry/nestjs/setup';
import { PrismaModule } from './prisma/prisma.module';
import { SharedModule } from './shared/shared.module';
import { AuthModule } from './auth/auth.module';
import { DepartmentModule } from './department/department.module';
import { WidgetModule } from './widget/widget.module';
import { PageLayoutModule } from './page-layout/page-layout.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    SharedModule,
    AuthModule,
    DepartmentModule,
    WidgetModule,
    PageLayoutModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
