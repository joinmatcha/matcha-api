import dotenv from 'dotenv';

dotenv.config({
  path: process.env.NODE_ENV === 'development' ? '.env.development' : '.env',
});

const parseVersion = async () => {
  const versionFlagIndex = process.argv.findIndex((arg) => arg === '--version');
  const arg = process.argv.find((item) => item.startsWith('--version='));
  const value =
    arg?.split('=')[1] ??
    (versionFlagIndex >= 0 ? process.argv[versionFlagIndex + 1] : undefined) ??
    process.env.WORK_STYLE_VERSION;
  const { workStyleSeedVersion } = await import('@/seeds/workStyleSeed');
  const version = value ? Number(value) : workStyleSeedVersion;

  if (!Number.isInteger(version) || version <= 0) {
    throw new Error(
      `Invalid work style seed version "${value}". Use --version=1, --version 1 or WORK_STYLE_VERSION=1.`
    );
  }

  return version;
};

async function seedWorkStyle() {
  const version = await parseVersion();
  const { seedWorkStyle: runSeedWorkStyle } =
    await import('@/seeds/seedWorkStyle');

  await runSeedWorkStyle({ version });
}

(async () => {
  const { connectDB, disconnectDB } = await import('@/config/db');

  try {
    await connectDB();
    await seedWorkStyle();
  } catch (error) {
    console.error('❌ Erreur lors du seed style professionnel :', error);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
})();
