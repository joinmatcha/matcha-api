import dotenv from 'dotenv';

dotenv.config({
  path: process.env.NODE_ENV === 'development' ? '.env.development' : '.env',
});

import mongoose from 'mongoose';

import { connectDB } from '@/config/db';

async function resetSwipes() {
  await connectDB();

  const result = await mongoose.connection.collection('swipes').deleteMany({});
  console.log(`✅ ${result.deletedCount} swipe(s) supprimé(s)`);

  await mongoose.disconnect();
}

resetSwipes().catch((err) => {
  console.error('❌ Erreur :', err);
  process.exit(1);
});
