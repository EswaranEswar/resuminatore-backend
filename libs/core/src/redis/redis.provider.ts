import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';
import { constants } from '@app/shared';

export const RedisProvider: Provider = {
  provide: constants.REDIS_CLIENT,
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => {
    const envStr =
      configService.get<string>('NODE_ENV') ||
      process.env.NODE_ENV ||
      'development';
    const nodeEnv = envStr.toLowerCase().trim();

    const isDevelopment = nodeEnv === 'development';

    const baseOptions: RedisOptions = {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 200, 5000),
      enableReadyCheck: true,
      lazyConnect: true,
    };

    let client: Redis;

    const url = configService.get<string>('REDIS_URL');
    const host = configService.get<string>('REDIS_HOST');
    const port = configService.get<number>('REDIS_PORT');
    const password = configService.get<string>('REDIS_PASSWORD');

    if (url) {
      const isSsl =
        url.toLowerCase().startsWith('rediss://') || url.includes('upstash');
      console.log(
        `[Redis] Connecting via URL (${nodeEnv} mode, SSL: ${isSsl})`,
      );

      client = new Redis(url, {
        ...baseOptions,
        ...(isSsl && { tls: { rejectUnauthorized: false } }),
      });
    } else if (host && port) {
      console.log(
        `[Redis] Connecting to Redis at ${host}:${port} (${nodeEnv} mode)`,
      );
      client = new Redis({
        ...baseOptions,
        host,
        port,
        ...(password && { password }),
      });
    } else {
      throw new Error(
        `Redis configuration missing! Provide REDIS_URL or (REDIS_HOST and REDIS_PORT) in .env`,
      );
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
