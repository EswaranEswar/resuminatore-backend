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
        const nodeEnv = config.get<string>('NODE_ENV') || 'development';
        const isDevelopment = nodeEnv === 'development';

        let connection:
          | { host?: string; port?: number; password?: string }
          | { url: string };

        if (isDevelopment) {
          // Development: Connect to local Redis
          const host = config.get<string>('REDIS_HOST');
          const port = config.get<number>('REDIS_PORT');
          const password = config.get<string>('REDIS_PASSWORD');

          console.log(`[BullMQ] Connecting to local Redis at ${host}:${port}`);

          connection = {
            host,
            port,
            password,
          };
        } else {
          // Production: Connect via URL
          const url = config.get<string>('REDIS_URL');

          if (!url) {
            throw new Error(
              'Redis URL is required in production for BullMQ. Set REDIS_URL environment variable.',
            );
          }

          console.log('[BullMQ] Connecting to Redis via URL (production mode)');
          connection = { url };
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
