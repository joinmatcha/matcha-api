import dotenv from 'dotenv';

dotenv.config({
  path: process.env.NODE_ENV === 'development' ? '.env.development' : '.env',
});

(async () => {
  const { connectDB, disconnectDB } = await import('@/config/db');
  const { seedAnalytics } = await import('@/seeds/analyticsSeed');

  try {
    await connectDB();
    const result = await seedAnalytics();
    console.log(
      `✅ Matcha Insights seeded: ${result.events} events, ${result.users} users, ${result.bilans} bilans, ${result.workStyleResults} work style results.`
    );
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors du seed analytics :', error);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
})();
