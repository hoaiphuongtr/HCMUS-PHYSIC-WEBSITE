import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { MediaRepository } from './media.repo';

@Module({
  controllers: [MediaController],
  providers: [MediaService, MediaRepository],
  exports: [MediaRepository],
})
export class MediaModule {}
