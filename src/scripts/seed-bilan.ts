import dotenv from 'dotenv';

import {
  defaultBilanSeedVersion,
  getBilanQuestionSeedSet,
} from '@/seeds/bilanQuestionSets';

dotenv.config({
  path: process.env.NODE_ENV === 'development' ? '.env.development' : '.env',
});

function getVersionArg() {
  const versionFlagIndex = process.argv.findIndex((arg) => arg === '--version');
  const versionArg = process.argv.find((arg) => arg.startsWith('--version='));
  const rawVersion =
    versionArg?.split('=')[1] ??
    (versionFlagIndex >= 0 ? process.argv[versionFlagIndex + 1] : undefined) ??
    process.env.BILAN_VERSION ??
    undefined;

  if (!rawVersion) {
    return defaultBilanSeedVersion;
  }

  const version = Number(rawVersion);

  if (!Number.isInteger(version) || version <= 0) {
    throw new Error(
      `Invalid bilan seed version "${rawVersion}". Use --version=2, --version 2 or BILAN_VERSION=2.`
    );
  }

  return version;
}

(async () => {
  const { connectDB, disconnectDB } = await import('@/config/db');

  try {
    const version = getVersionArg();
    getBilanQuestionSeedSet(version);

    const { seedBilan } = await import('@/seeds/seedBilan');

    await connectDB();
    await seedBilan({ version });

    console.log(`🎉 Auto-évaluation v${version} seeded successfully`);
  } catch (err) {
    console.error('❌ Erreur lors du seed bilan :', err);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
})();
