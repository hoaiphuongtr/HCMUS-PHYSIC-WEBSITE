import { Module } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { PageLayoutModule } from '../page-layout/page-layout.module';

@Module({
  imports: [PageLayoutModule],
  controllers: [PostController],
  providers: [PostService],
})
export class PostModule {}
