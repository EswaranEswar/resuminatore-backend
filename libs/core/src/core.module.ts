import { Module } from '@nestjs/common';
import { MongodbLibModule } from './mongodb/mongodb.module';
import { UtilsModule } from '@app/utils';
import { LoggerModule } from 'nestjs-pino';
import { getPinoLoggerConfig } from './logger/pino-logger.config';
import { RedisModule } from './redis/redis.module';
import { QueueModule } from './queue/queue.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    MongodbLibModule,
    UtilsModule,
    RedisModule,
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const nodeEnv = config.get<string>('NODE_ENV') || 'development';
        const pretty = config.get<string>('LOG_PRETTY') === 'true';
        return getPinoLoggerConfig(nodeEnv, pretty);
      },
    }),
    QueueModule,
  ],
  exports: [
    MongodbLibModule,
    UtilsModule,
    LoggerModule,
    RedisModule,
    QueueModule,
  ],
})
export class CoreModule {}
