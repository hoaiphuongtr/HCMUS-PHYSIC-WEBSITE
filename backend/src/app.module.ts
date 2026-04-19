import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { SentryModule } from '@sentry/nestjs/setup';
import { PrismaModule } from './prisma/prisma.module';
import { SharedModule } from './shared/shared.module';
import { AuthModule } from './auth/auth.module';
import { DepartmentModule } from './department/department.module';
import { WidgetModule } from './widget/widget.module';
import { PageLayoutModule } from './page-layout/page-layout.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { VisitorModule } from './visitor/visitor.module';
import { MediaModule } from './media/media.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CacheModule } from '@nestjs/cache-manager';
import KeyvRedis from '@keyv/redis';
import envConfig from './shared/config/config';

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: () => ({
        stores: [new KeyvRedis(envConfig.REDIS_URL)],
        ttl: 60_000,
        namespace: 'hcmus-physics',
      }),
    }),
    SentryModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    SharedModule,
    AuthModule,
    DepartmentModule,
    WidgetModule,
    PageLayoutModule,
    SubscriptionModule,
    VisitorModule,
    MediaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
