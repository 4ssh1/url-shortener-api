import pino, { LoggerOptions } from 'pino';
import { config } from '@/config';

const pinoOptions: LoggerOptions = {
  level: config.nodeEnv === 'development' ? 'debug' : 'info',
};

// --- Development: Local Pretty Printing ---
if (config.nodeEnv === 'development') {
  pinoOptions.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'd mmmm yyyy h:MM:ss TT',
      ignore: 'hostname,pid',
    },
  };
} 

// --- Production: Remote Telemetry (Logtail) ---
else {
  pinoOptions.transport = {
    target: '@logtail/pino',
    options: {
      sourceToken: config.logtailToken, // Store this in your config/env!
    },
  };
}

const logger = pino(pinoOptions);

export default logger;