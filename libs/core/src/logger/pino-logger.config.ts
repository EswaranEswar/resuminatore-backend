import { Params } from 'nestjs-pino';

export const getPinoLoggerConfig = (
  nodeEnv: string,
  pretty: boolean = false,
): Params => {
  const env = (nodeEnv || 'development').replace(/^["']|["']$/g, '').trim();
  const isDev = env === 'development';

  return {
    pinoHttp: {
      level: isDev ? 'debug' : 'info',

      ...((isDev || pretty) && {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            singleLine: false,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
      }),

      autoLogging: {
        ignore: (req) => req.url === '/health',
      },

      redact: {
        paths: ['req.headers.authorization', 'req.headers.cookie'],
        censor: '***',
      },

      customProps(req) {
        return {
          service: 'resuminatore-backend',
          requestId: req.id ?? req.headers['x-request-id'],
        };
      },

      serializers: {
        req(req) {
          return {
            method: req.method,
            url: req.url,
            requestId: req.id,
          };
        },
        res(res) {
          return { statusCode: res.statusCode };
        },
      },

      customLogLevel(req, res, err) {
        if (err) return 'error';
        if (res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
    },
  };
};
