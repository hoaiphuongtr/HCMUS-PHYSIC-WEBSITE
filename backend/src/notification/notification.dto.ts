import { createZodDto } from 'nestjs-zod';
import {
  NotificationListResSchema,
  UnreadCountResSchema,
} from './notification.model';

export class NotificationListResDTO extends createZodDto(
  NotificationListResSchema,
) {}
export class UnreadCountResDTO extends createZodDto(UnreadCountResSchema) {}
