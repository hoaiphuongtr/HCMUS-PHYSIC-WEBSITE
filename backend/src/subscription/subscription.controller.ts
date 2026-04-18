import { Body, Controller, Delete, Get, Post, Query } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionBodyDTO } from './subscription.dto';
import { IsPublic } from '../shared/decorators/auth.decorator';
import { Roles } from '../shared/decorators/roles.decorator';
import { RoleName } from '../shared/constants/role.constants';

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly service: SubscriptionService) {}

  @Post()
  @IsPublic()
  create(@Body() body: CreateSubscriptionBodyDTO) {
    return this.service.create(body);
  }

  @Get('by-email')
  @IsPublic()
  findByEmail(@Query('email') email: string) {
    return this.service.findByEmail(email);
  }

  @Delete()
  @IsPublic()
  deleteByEmail(@Query('email') email: string) {
    return this.service.deleteByEmail(email);
  }

  @Get()
  @Roles(RoleName.Admin, RoleName.SuperAdmin)
  findAll() {
    return this.service.findAll();
  }
}
