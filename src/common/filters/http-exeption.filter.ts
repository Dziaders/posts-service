import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { EventsService } from '../../events/events.service';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly eventsService: EventsService) {}

  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message || message;
    }

    const errorResponse = {
      message,
      status,
      service: 'posts',
    };

    await this.eventsService.emitEvent('error', errorResponse);

    return response.status(status).json(errorResponse);
  }
}
