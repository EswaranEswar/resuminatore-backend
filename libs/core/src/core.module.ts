import { Module } from '@nestjs/common';
import { MongodbLibModule } from './mongodb/mongodb.module';
import { UtilsModule } from '@app/utils';
import { LoggerModule } from 'nestjs-pino';
import { pinoLoggerConfig } from './logger/pino-logger.config';
import { RedisModule } from './redis/redis.module';
import { QueueModule } from './queue/queue.module';
import { SystemBootstrapModule } from './bootstrap/system-bootstrap.module';

@Module({
  imports: [
    MongodbLibModule,
    UtilsModule,
    RedisModule,
    SystemBootstrapModule,
    LoggerModule.forRoot(pinoLoggerConfig),
    QueueModule,
  ],
  exports: [
    MongodbLibModule,
    UtilsModule,
    RedisModule,
    QueueModule,
    SystemBootstrapModule,
  ],
})
export class CoreModule {}
