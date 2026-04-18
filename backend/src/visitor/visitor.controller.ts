import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { VisitorService } from './visitor.service';
import { TrackPostBodyDTO, TrackSlugBodyDTO } from './visitor.dto';
import { IsPublic } from '../shared/decorators/auth.decorator';

@Controller('visitor')
export class VisitorController {
  constructor(private readonly service: VisitorService) {}

  @Post('track-slug')
  @IsPublic()
  trackSlug(@Body() body: TrackSlugBodyDTO) {
    return this.service.trackSlug(body.visitorId, body.slug);
  }

  @Post('track-post')
  @IsPublic()
  trackPost(@Body() body: TrackPostBodyDTO) {
    return this.service.trackPost(body.visitorId, body.postId);
  }

  @Get(':visitorId/profile')
  @IsPublic()
  profile(@Param('visitorId') visitorId: string) {
    return this.service.getProfile(visitorId);
  }

  @Get(':visitorId/suggestions')
  @IsPublic()
  suggestions(
    @Param('visitorId') visitorId: string,
    @Query('limit') limit?: string,
  ) {
    const parsed = limit ? parseInt(limit, 10) : 6;
    return this.service.getSuggestions(
      visitorId,
      Number.isFinite(parsed) && parsed > 0 ? parsed : 6,
    );
  }
}
