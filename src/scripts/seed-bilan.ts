import 'dotenv/config';

import { connectDB } from '@/config/db';
import { seedBilan } from '@/seeds/seedBilan';

(async () => {
  try {
    await connectDB();
    await seedBilan();

    console.log('🎉 Bilan seeded successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur lors du seed bilan :', err);
    process.exit(1);
  }
})();
