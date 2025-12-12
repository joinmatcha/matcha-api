import 'dotenv/config';

import { connectDB } from '@/config/db';
import { seedJobs } from '@/seeds/seedJobs';

(async () => {
  await connectDB();
  await seedJobs();
  console.log('✅ Jobs seeded successfully');
  process.exit(0);
})();
