import { join } from 'path';
import { ExecutionContext, Module } from '@nestjs/common';
import { ClsModule, ClsService } from 'nestjs-cls';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {
  CoreModule,
  HttpExceptionFilter,
  LoggingInterceptor,
} from '@app/core';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guard/jwt-auth.guard';
import { ResumeModule } from './resume/resume.module';
import { ExportModule } from './export/export.module';
import { QueueAdminModule } from './queue-admin/queue-admin.module';
import { AiClientModule } from './ai-service/ai-client.module';
import { TemplateModule } from './template/template.module';
import { ServeStaticModule } from '@nestjs/serve-static';

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
    cls.set('req', req);
    if (req.session) {
      cls.set('session', req.session);
    } else if (!cls.get('session')) {
      cls.set('session', null);
    }
    if (response) {
      cls.set('res', response);
    }
  } catch (e) {
    console.error('[CLS SETUP ERROR]', e);
  }
};

@Module({
  imports: [
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
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ExportModule,
    ResumeModule,
    TemplateModule,
    UserModule,
    QueueAdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
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
