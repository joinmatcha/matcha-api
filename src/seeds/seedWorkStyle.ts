import { WorkStyleQuestion } from '@/models/WorkStyleQuestion';
import { WorkStyleVersion } from '@/models/WorkStyleVersion';
import { workStyleProfiles, workStyleQuestions } from '@/seeds/workStyleSeed';

export interface SeedWorkStyleOptions {
  version: number;
}

export async function seedWorkStyle({ version }: SeedWorkStyleOptions) {
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

  await WorkStyleQuestion.bulkWrite(
    workStyleQuestions.map((question) => ({
      updateOne: {
        filter: { version, code: question.code },
        update: {
          $set: {
            ...question,
            version,
            versionId: versionDoc._id,
            isActive: question.isActive ?? true,
          },
        },
        upsert: true,
      },
    })),
    { ordered: false }
  );

  await WorkStyleQuestion.updateMany(
    {
      version,
      code: { $nin: workStyleQuestions.map((question) => question.code) },
      isActive: true,
    },
    { $set: { isActive: false } }
  );

  const activeQuestionCount = await WorkStyleQuestion.countDocuments({
    version,
    isActive: true,
  });

  console.log(
    `✅ Style professionnel v${version} actif avec ${activeQuestionCount} questions.`
  );
}
