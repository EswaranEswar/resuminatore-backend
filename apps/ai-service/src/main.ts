import { NestFactory } from '@nestjs/core';
import { AiModule } from './ai.module';
import { MicroserviceOptions } from '@nestjs/microservices';
import { getRedisTransportOption } from '@app/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AiModule, {
      bufferLogs: true,
    });

    const logger = app.get(Logger);
    app.useLogger(logger);

    const transportOption = getRedisTransportOption(app.get(ConfigService));
    app.connectMicroservice<MicroserviceOptions>(
      transportOption as MicroserviceOptions,
      {
        inheritAppConfig: true,
      },
    );
    await app.startAllMicroservices();

    const port = Number(app.get(ConfigService).get<number>('AI_SERVICE_PORT'));
    await app.listen(port);

    logger.log(`AI microservice is running on: http://localhost:${port}`);
    logger.log(`🔌 AI microservice connected to Redis`);
  } catch (error) {
    console.error('Error during AI service bootstrap:', error);
  }
}
bootstrap();
