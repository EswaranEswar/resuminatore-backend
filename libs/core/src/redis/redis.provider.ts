import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';
import { constants } from '@app/shared';

export const RedisProvider: Provider = {
  provide: constants.REDIS_CLIENT,
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => {
    const url = configService.get<string>('REDIS_URL');
    const host = configService.get<string>('REDIS_HOST');
    const port = configService.get<number>('REDIS_PORT');
    const password = configService.get<string>('REDIS_PASSWORD');
    const nodeEnv = configService.get('NODE_ENV');

    const isDevelopment = !nodeEnv || nodeEnv === 'development';

    const options: RedisOptions = {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 200, 5000),
      enableReadyCheck: true,
    };

    let client: Redis;

    if (isDevelopment && host) {
      client = new Redis({
        host: host,
        password: password,
        port: port,
        ...options,
      });
    } else if (url) {
      client = new Redis(url, options);
    } else {
      throw new Error('Redis config missing. Set REDIS_HOST and REDIS_PORT');
    }

    client.on('connect', () => {
      console.log('Redis trying to connecting');
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
