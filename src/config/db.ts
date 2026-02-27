import mongoose from 'mongoose';

import { env } from '@/config/env';

const dbName = env.NODE_ENV === 'test' ? env.MONGODB_DB_TEST : env.MONGODB_DB;

const baseUri = env.MONGODB_URI.endsWith('/')
  ? env.MONGODB_URI.slice(0, -1)
  : env.MONGODB_URI;
const uri = `${baseUri}/${dbName}`;

export const connectDB = async (): Promise<void> => {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri);
    console.log(`✅ MongoDB connecté à "${dbName}"`);
  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB :', error);
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.connection.close();
  console.log('🛑 Deconnexion MongoDB');
};
