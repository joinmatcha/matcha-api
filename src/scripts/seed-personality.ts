import dotenv from 'dotenv';

dotenv.config({
  path: process.env.NODE_ENV === 'development' ? '.env.development' : '.env',
});

import { connectDB } from '@/config/db';
import { seedPersonalityTest } from '@/seeds/seedPersonalityTest';

(async () => {
  await connectDB();
  await seedPersonalityTest();
  console.log('✅ Personality test seeded successfully');
  process.exit(0);
})();
