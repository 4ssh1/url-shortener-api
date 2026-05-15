import mongoose, { ConnectOptions } from 'mongoose';
import { config } from '@/config';
import logger from './pino';

const connectOptions: ConnectOptions = {
  serverApi: {
    version: '1',
    strict: true,
    deprecationErrors: true,
  }
};

export const connectDB = async () => {
  try {
    if (mongoose.connection.readyState >= 1) {
      return;
    }

    await mongoose.connect(config.databaseUrl as string, connectOptions);
    logger.info({ database: 'MongoDB' }, 'Database connected successfully');
  } catch (error) {
    logger.error({ err: error }, 'Failed to connect to MongoDB');
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    logger.info({ database: 'MongoDB' }, 'Database disconnected successfully');
  } catch (error) {
    logger.error({ err: error }, 'Failed to disconnect from MongoDB');
    process.exit(1);
  }
};