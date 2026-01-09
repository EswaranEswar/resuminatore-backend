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

  app.set('trust proxy', 1);

  app.use(cookieParser());

  const logger = app.get(Logger);
  app.useLogger(logger);

  app.useGlobalPipes(new ZodValidationPipe());

  const configService = app.get(ConfigService);

  const env = configService.get<string>('NODE_ENV');
  logger.log(`Environment: ${env}`);

  const frontendUrl = configService.get<string>('FRONTEND_URL');
  logger.log(`Frontend URL: ${frontendUrl}`);

  app.use(helmet());
  logger.log(`CORS Origins: ${frontendUrl}`);

  app.enableCors({
    origin: frontendUrl,
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
