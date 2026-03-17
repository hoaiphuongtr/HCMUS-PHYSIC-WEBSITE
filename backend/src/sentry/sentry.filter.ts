import { Catch } from '@nestjs/common';
import { SentryGlobalFilter } from '@sentry/nestjs/setup';

@Catch()
export class AllExceptionsFilter extends SentryGlobalFilter {}
