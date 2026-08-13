import dotenv from 'dotenv';

dotenv.config({
  path: process.env.NODE_ENV === 'development' ? '.env.development' : '.env',
});

(async () => {
  const { connectDB, disconnectDB } = await import('@/config/db');
  const { seedPersonalityTest } = await import('@/seeds/seedPersonalityTest');

  try {
    await connectDB();
    await seedPersonalityTest();
    console.log('✅ Personality test seeded successfully');
  } catch (error) {
    console.error('❌ Erreur lors du seed personnalité :', error);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
})();
