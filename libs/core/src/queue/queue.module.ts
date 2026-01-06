import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueService } from './queue.service';
import { QueueEnum } from '@app/shared';

@Module({
  imports: [
    ConfigModule,
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const nodeEnv = config.get<string>('NODE_ENV');
        const isDev = !nodeEnv || nodeEnv === 'development';

        const connection = isDev
          ? {
              host: config.get<string>('REDIS_HOST'),
              port: config.get<number>('REDIS_PORT'),
              password: config.get<string>('REDIS_PASSWORD'),
            }
          : {
              url: config.get<string>('REDIS_URL'),
            };

        if (!connection) {
          throw new Error('Redis configuration missing');
        }

        return {
          connection,
          defaultJobOptions: {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 2000,
            },
            removeOnComplete: 50,
            removeOnFail: 50,
          },
        };
      },
    }),

    BullModule.registerQueue({
      name: QueueEnum.enum.email,
    }),
  ],
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}
