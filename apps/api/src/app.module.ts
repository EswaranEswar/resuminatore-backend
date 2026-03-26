import { join } from 'path';
import { ExecutionContext, Module } from '@nestjs/common';
import { ClsModule, ClsService } from 'nestjs-cls';
import { CoreModule, HttpExceptionFilter, LoggingInterceptor } from '@app/core';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthGuard } from './auth/guard/auth.guard';
import { ResumeModule } from './resume/resume.module';
import { ExportModule } from './export/export.module';
import { QueueAdminModule } from './queue-admin/queue-admin.module';
import { AiClientModule } from './ai-service/ai-client.module';
import { TemplateModule } from './template/template.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { SystemBootstrapModule } from '@app/core/bootstrap/system-bootstrap.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { HealthModule } from './health/health.module';

export const clsSetupHelper = (
  cls: ClsService,
  contextOrReq: ExecutionContext | any,
  res?: Response,
) => {
  try {
    let req: any;
    let response: any = res;
    if (contextOrReq?.switchToHttp) {
      const http = contextOrReq.switchToHttp();
      req = http.getRequest();
      response = http.getResponse();
    } else {
      req = contextOrReq;
    }

    if (!req) return;

    // Set basic request/response objects
    cls.set('req', req);
    if (response) {
      cls.set('res', response);
    }

    // Sync session and user if available
    if (req.session) {
      cls.set('session', req.session);
      if (req.session['user']) {
        cls.set('user', req.session['user']);
      }
    }
  } catch (e) {
    console.error('[CLS SETUP ERROR]', e);
  }
};

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', './.env', '../.env'],
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60 * 1000,
          limit: 100,
        },
      ],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'apps/api/public'),
      serveRoot: '/',
      serveStaticOptions: {
        setHeaders: (res) => {
          res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        },
      },
    }),
    AuthModule,
    SystemBootstrapModule,
    AiClientModule,
    CoreModule,
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        setup: (cls, req, res) => clsSetupHelper(cls, req, res),
      },
      guard: {
        mount: true,
        setup: (cls, context) => clsSetupHelper(cls, context),
      },
    }),
    ExportModule,
    HealthModule,
    ResumeModule,
    TemplateModule,
    UserModule,
    QueueAdminModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
