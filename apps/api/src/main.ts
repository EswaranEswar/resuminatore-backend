import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import { constants } from '@app/shared';
import { getRedisTransportOption } from '@app/core';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { ZodValidationPipe } from 'nestjs-zod';
import * as cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  app.use(cookieParser());

  const logger = app.get(Logger);
  app.useLogger(logger);

  app.useGlobalPipes(new ZodValidationPipe());

  const configService = app.get(ConfigService);

  const env = configService.get<string>('NODE_ENV') || '';
  logger.log(`Environment: ${env}`);

  const frontendUrl = configService.get<string>('FRONTEND_URL');
  logger.log(`Frontend URL: ${frontendUrl}`);

  app.use(helmet());
  logger.log(`CORS Origins: ${frontendUrl}`);

  const allowedOrigins = ['https://resuminatore.vercel.app', 'http://localhost:3003'];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  app.setGlobalPrefix(constants.API, {
    exclude: ['/'],
  });

  app.connectMicroservice(getRedisTransportOption(app.get(ConfigService)));
  await app.startAllMicroservices();

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);

  logger.log(`🚀 API running on http://localhost:${port}/${constants.API}`);
}
bootstrap();
