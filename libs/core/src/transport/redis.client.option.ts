import { ClientOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';



export function getRedisTransportOption(
  configService: ConfigService,
): ClientOptions {
  const nodeEnv = configService.get<string>('NODE_ENV');
  const isDevelopment = nodeEnv === 'development';

  if (isDevelopment) {
    return {
      transport: Transport.REDIS,
      options: {
        host: configService.get<string>('REDIS_HOST'),
        port: Number(configService.get<string>('REDIS_PORT')),
        password: configService.get<string>('REDIS_PASSWORD'),
        retryAttempts: 0,
        lazyConnect: true,
      },
    };
  }

  const redisUrl = configService.get<string>('REDIS_URL');
  if (!redisUrl) {
    throw new Error('REDIS_URL is required in production');
  }

  const parsed = new URL(redisUrl);

  return {
    transport: Transport.REDIS,
    options: {
      host: parsed.hostname,
      port: Number(parsed.port),
      password: parsed.password,
      retryAttempts: 0,
      lazyConnect: true,
      tls: {
        rejectUnauthorized: false,
      },
    },
  };
}
