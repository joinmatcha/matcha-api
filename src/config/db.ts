import mongoose from 'mongoose';

import { env } from '@/config/env';
import { logger } from '@/utils/logger';

const dbName = env.NODE_ENV === 'test' ? env.MONGODB_DB_TEST : env.MONGODB_DB;

const [uriBase, queryString] = env.MONGODB_URI.split('?');
const cleanBase = uriBase.endsWith('/') ? uriBase.slice(0, -1) : uriBase;
const uri = queryString
  ? `${cleanBase}/${dbName}?${queryString}`
  : `${cleanBase}/${dbName}`;

export const connectDB = async (): Promise<void> => {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri);
    logger.info('mongodb_connected', { dbName });
  } catch (error) {
    logger.error('mongodb_connection_failed', { dbName, error });
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.connection.close();
  logger.info('mongodb_disconnected', { dbName });
};
