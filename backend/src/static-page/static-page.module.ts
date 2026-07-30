import { Module } from '@nestjs/common';
import { StaticPageController } from './static-page.controller';
import { StaticPageService } from './static-page.service';

@Module({
  controllers: [StaticPageController],
  providers: [StaticPageService],
})
export class StaticPageModule {}
