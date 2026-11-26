import { Catch, HttpException, HttpStatus, Logger, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(error: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    if (error instanceof HttpException) {
      status = error.getStatus();
      const payload = error.getResponse();
      message = typeof payload === 'string' ? payload : (payload as { message?: string | string[] }).message || error.message;
    } else if (error && typeof error === 'object' && 'type' in error && error.type === 'entity.too.large') {
      status = HttpStatus.PAYLOAD_TOO_LARGE; message = 'Request body exceeds 64 KiB.';
    } else if (error && typeof error === 'object' && 'type' in error && error.type === 'entity.parse.failed') {
      status = HttpStatus.BAD_REQUEST; message = 'Invalid JSON body.';
    }
    if (status === HttpStatus.NOT_FOUND) message = 'Route not found.';
    if (status >= 500) { message = 'Internal server error'; this.logger.error(`Request failed (${error instanceof Error ? error.name : 'UnknownError'}).`); }
    response.status(status).json({ statusCode: status, message, path: request.path, timestamp: new Date().toISOString() });
  }
}
