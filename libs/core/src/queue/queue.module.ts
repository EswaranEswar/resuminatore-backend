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
        const nodeEnv = (
          config.get<string>('NODE_ENV') || 'development'
        ).toLowerCase();

        let connection:
          | { host?: string; port?: number; password?: string }
          | { url: string };

        const url = config.get<string>('REDIS_URL');
        const host = config.get<string>('REDIS_HOST');
        const port = config.get<number>('REDIS_PORT');
        const password = config.get<string>('REDIS_PASSWORD');

        if (url) {
          console.log(`[BullMQ] Connecting via URL (${nodeEnv} mode)`);
          connection = { url };
        } else if (host && port) {
          console.log(
            `[BullMQ] Connecting to Redis at ${host}:${port} (${nodeEnv} mode)`,
          );
          connection = {
            host,
            port,
            password,
          };
        } else {
          throw new Error(
            'Redis configuration missing for BullMQ! Provide REDIS_URL or (REDIS_HOST and REDIS_PORT) in .env',
          );
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
