import dotenv from 'dotenv';

dotenv.config({
  path: process.env.NODE_ENV === 'development' ? '.env.development' : '.env',
});

(async () => {
  const { connectDB, disconnectDB } = await import('@/config/db');
  const { cleanupSeedUsers } = await import('@/seeds/demoUsageSeed');

  try {
    await connectDB();
    const result = await cleanupSeedUsers();
    console.log('✅ Matcha seed users cleaned successfully');
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors du cleanup seed users :', error);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
})();
