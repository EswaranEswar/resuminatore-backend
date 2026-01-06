import { ClientOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

export function getRedisTransportOption(
  configService: ConfigService,
): ClientOptions {
  const url = configService.get<string>('REDIS_URL');
  const host = configService.get<string>('REDIS_HOST');
  const port = Number(configService.get<string>('REDIS_PORT') ?? 6379);
  const password = configService.get<string>('REDIS_PASSWORD');

  const isTls =
    url?.startsWith('rediss://') ||
    configService.get('REDIS_TLS') === 'true';

  if (!url && !host) {
    throw new Error(
      'Redis transport misconfigured: set REDIS_URL or REDIS_HOST',
    );
  }

  const options: any = {
    lazyConnect: true,
    maxRetriesPerRequest: null,
    retryStrategy: (times: number) => Math.min(times * 200, 5000),
};

  if (url) {
    options.url = url;
  } else {
    options.host = host;
    options.port = port;
    if (password) options.password = password;
  }

  if (isTls) {
    options.tls = {
      rejectUnauthorized: false,
    };
  }

  return {
    transport: Transport.REDIS,
    options,
  };
}
