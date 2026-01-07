import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';
import { constants } from '@app/shared';

export const RedisProvider: Provider = {
  provide: constants.REDIS_CLIENT,
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => {
    const nodeEnv = configService.get<string>('NODE_ENV');
    const isDevelopment = nodeEnv === 'development';

    const baseOptions: RedisOptions = {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 200, 5000),
      enableReadyCheck: true,
      lazyConnect: true,
    };

    let client: Redis;

    if (isDevelopment) {
      const host = configService.get<string>('REDIS_HOST');
      const port = configService.get<number>('REDIS_PORT');
      const password = configService.get<string>('REDIS_PASSWORD');

      if (!host || !port) {
        throw new Error('REDIS_HOST and REDIS_PORT must be set in development');
      }

      console.log(`[Redis] Connecting to local Redis at ${host}:${port}`);

      client = new Redis({
        ...baseOptions,
        host,
        port,
        ...(password && { password }),
      });
    } else {
      const url = configService.get<string>('REDIS_URL');

      if (!url) {
        throw new Error('REDIS_URL is required in production');
      }

      console.log('[Redis] Connecting to Redis via URL (production mode)');

      client = new Redis(url, {
        ...baseOptions,
        tls: { rejectUnauthorized: false }, // 🔥 REQUIRED for Upstash
      });
    }

    client.on('connect', () => {
      console.log('Redis connected');
    });

    client.on('reconnecting', () => {
      console.log('Redis reconnecting');
    });

    client.on('error', (err) => {
      console.error('Redis connection error:', err.message);
    });

    return client;
  },
};
