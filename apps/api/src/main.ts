import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import { constants } from '@app/shared';
import { getRedisTransportOption } from '@app/core';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { ZodValidationPipe } from 'nestjs-zod';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule, { bufferLogs: true });

    app.use(cookieParser());

    const logger = app.get(Logger);
    app.useLogger(logger);

    app.useGlobalPipes(new ZodValidationPipe());

    const frontendUrl = app.get(ConfigService).get<string>('FRONTEND_URL');

    app.use(helmet());
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
    await app.listen(port, () => {
      logger.log(
        `🚀 Application is running on: http://localhost:${port}/${constants.API}`,
      );
    });
  } catch (error) {
    console.error('Error during bootstrap:', error);
  }
}
bootstrap();
