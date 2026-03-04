import { ClientOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

export function getRedisTransportOption(
  configService: ConfigService,
): ClientOptions {
  const nodeEnv = (
    configService.get<string>('NODE_ENV') || 'development'
  ).toLowerCase();
  const isDevelopment = nodeEnv === 'development';

  const redisUrl = configService.get<string>('REDIS_URL');
  const host = configService.get<string>('REDIS_HOST');
  const port = Number(configService.get<string>('REDIS_PORT'));
  const password = configService.get<string>('REDIS_PASSWORD');

  if (redisUrl) {
    const isSsl =
      redisUrl.toLowerCase().startsWith('rediss://') ||
      redisUrl.includes('upstash');
    const parsed = new URL(redisUrl);
    return {
      transport: Transport.REDIS,
      options: {
        host: parsed.hostname,
        port: Number(parsed.port),
        password: decodeURIComponent(parsed.password),
        retryAttempts: 5,
        lazyConnect: true,
        ...(isSsl && {
          tls: {
            rejectUnauthorized: false,
          },
        }),
      },
    };
  } else if (host && port) {
    return {
      transport: Transport.REDIS,
      options: {
        host,
        port,
        password,
        retryAttempts: 3,
        lazyConnect: true,
      },
    };
  } else {
    throw new Error(
      'Redis configuration missing! Provide REDIS_URL or (REDIS_HOST and REDIS_PORT) in .env',
    );
  }
}
