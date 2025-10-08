import pino from 'pino';
import { config } from '../../config/environment';

export const logger = pino({
  level: config.logging.level,
  transport: config.server.env === 'development'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});
