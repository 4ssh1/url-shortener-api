import mongoose from 'mongoose';
import { config } from '@/config';
import logger from './pino';

export const connectDB = async () => {
  try {
    if (mongoose.connection.readyState >= 1) {
      return;
    }

    await mongoose.connect(config.databaseUrl as string);
    logger.info({ database: 'MongoDB' }, 'Database connected successfully');
  } catch (error) {
    logger.error({ err: error }, 'Failed to connect to MongoDB');
    process.exit(1);
  }
};