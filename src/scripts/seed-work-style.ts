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
  const { WorkStyleQuestion } = await import('@/models/WorkStyleQuestion');
  const { WorkStyleVersion } = await import('@/models/WorkStyleVersion');
  const { workStyleProfiles, workStyleQuestions } =
    await import('@/seeds/workStyleSeed');

  await WorkStyleVersion.updateMany(
    { version: { $ne: version }, isActive: true },
    { $set: { isActive: false, status: 'archived' } }
  );

  const versionDoc = await WorkStyleVersion.findOneAndUpdate(
    { version },
    {
      $set: {
        title: `Style professionnel v${version}`,
        summary:
          'Test court pour identifier les environnements de travail qui correspondent le mieux à l’utilisateur.',
        isActive: true,
        status: 'active',
        profiles: workStyleProfiles,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const existingQuestions = await WorkStyleQuestion.countDocuments({ version });
  if (existingQuestions === 0) {
    await WorkStyleQuestion.insertMany(
      workStyleQuestions.map((question) => ({
        ...question,
        version,
        versionId: versionDoc._id,
      }))
    );
  } else {
    await WorkStyleQuestion.updateMany(
      { version },
      { $set: { versionId: versionDoc._id } }
    );
  }

  console.log(
    `✅ Style professionnel v${version} actif avec ${await WorkStyleQuestion.countDocuments(
      { version }
    )} questions.`
  );
}

(async () => {
  const { connectDB, disconnectDB } = await import('@/config/db');

  try {
    await connectDB();
    await seedWorkStyle();
  } catch (error) {
    console.error('❌ Erreur lors du seed style professionnel :', error);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
})();
