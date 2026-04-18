import { NotFoundException } from '@nestjs/common';

export const SubscriptionNotFoundException = new NotFoundException([
  { field: 'email', error: 'Subscription not found' },
]);
