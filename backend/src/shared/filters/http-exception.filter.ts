import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import { ZodValidationException } from 'nestjs-zod';
import { ZodError } from 'zod';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const statusCode = exception.getStatus();

    if (exception instanceof ZodValidationException) {
      const zodError = exception.getZodError() as ZodError;
      return response.status(statusCode).json({
        statusCode,
        message: zodError.issues.map((issue) => issue.message).join(', '),
        path: zodError.issues.flatMap((issue) => issue.path.map(String)),
      });
    }

    const exceptionResponse = exception.getResponse();
    const rawMessage =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any).message || exception.message;

    if (
      Array.isArray(rawMessage) &&
      rawMessage.length > 0 &&
      rawMessage[0]?.field &&
      rawMessage[0]?.error
    ) {
      return response.status(statusCode).json({
        statusCode,
        message: rawMessage.map((item) => item.error).join(', '),
        path: rawMessage.map((item) => item.field),
      });
    }

    return response.status(statusCode).json({
      statusCode,
      message: Array.isArray(rawMessage)
        ? rawMessage.join(', ')
        : String(rawMessage),
      path: [],
    });
  }
}
