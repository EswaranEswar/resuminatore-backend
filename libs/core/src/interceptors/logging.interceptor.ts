import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { randomUUID } from 'crypto';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();

    const requestId = req.headers['x-request-id'] ?? randomUUID();
    req.id = requestId;

    const { method, url, ip } = req;
    const userId = req.user?.id ?? 'Guest';
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;

        console.log(
          JSON.stringify({
            level: 'info',
            type: 'http',
            requestId,
            method,
            url,
            statusCode: res.statusCode,
            duration,
            userId,
            ip,
          }),
        );
      }),
      catchError((error) => {
        const duration = Date.now() - start;

        console.error(
          JSON.stringify({
            level: 'error',
            type: 'http',
            requestId,
            method,
            url,
            statusCode: error.status ?? 500,
            duration,
            userId,
            error: error.message,
          }),
        );

        return throwError(() => error);
      }),
    );
  }
}
