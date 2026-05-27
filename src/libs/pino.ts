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
  // --- PRE-FLIGHT DIAGNOSTICS ---
  console.log(`[Logger Startup] Environment: ${config.nodeEnv}`);
  
  if (!config.logtailToken) {
    console.error('❌ CRITICAL LOGGER ERROR: config.logtailToken is missing or undefined!');
    console.error('❌ Logtail will throw "Unauthorized" errors. Check your Render Environment Variables for LOGTAIL_TOKEN.');
  } else {
    // Safely print just the first 4 characters to confirm it's actually loading the string
    const maskedToken = `${config.logtailToken.substring(0, 4)}...`;
    console.log(`✅ [Logger Startup] Logtail token found. Starts with: ${maskedToken}`);
  }

  pinoOptions.transport = {
    target: '@logtail/pino',
    options: {
      sourceToken: config.logtailToken,
    },
  };
}

const logger = pino(pinoOptions);

export default logger;