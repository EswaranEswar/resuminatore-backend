import { Module } from '@nestjs/common';
import { MongodbLibModule } from './mongodb/mongodb.module';
import { UtilsModule } from '@app/utils';
import { LoggerModule } from 'nestjs-pino';
import { pinoLoggerConfig } from './logger/pino-logger.config';
import { RedisModule } from './redis/redis.module';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [
    MongodbLibModule,
    UtilsModule,
    RedisModule,
    LoggerModule.forRoot(pinoLoggerConfig),
    QueueModule,
  ],
  exports: [
    MongodbLibModule, 
    UtilsModule, 
    LoggerModule, 
    RedisModule, 
    QueueModule
  ],
})
export class CoreModule {}
