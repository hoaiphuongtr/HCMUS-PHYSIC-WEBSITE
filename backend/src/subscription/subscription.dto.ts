import { createZodDto } from 'nestjs-zod';
import {
  CreateSubscriptionBodySchema,
  SubscriptionByEmailResSchema,
  SubscriptionResSchema,
} from './subscription.model';

export class CreateSubscriptionBodyDTO extends createZodDto(
  CreateSubscriptionBodySchema,
) {}
export class SubscriptionResDTO extends createZodDto(SubscriptionResSchema) {}
export class SubscriptionByEmailResDTO extends createZodDto(
  SubscriptionByEmailResSchema,
) {}
