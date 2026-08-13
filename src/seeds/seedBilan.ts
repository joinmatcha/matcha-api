import { BilanQuestion } from '@/models/BilanQuestion';
import { BilanVersion } from '@/models/BilanVersion';
import {
  defaultBilanSeedVersion,
  getBilanQuestionSeedSet,
} from '@/seeds/bilanQuestionSets';

export interface SeedBilanOptions {
  version?: number;
}

async function ensureBilanQuestionVersionedIndexes() {
  const indexes = await BilanQuestion.collection.indexes();
  const hasLegacyCodeIndex = indexes.some((index) => index.name === 'code_1');

  if (hasLegacyCodeIndex) {
    await BilanQuestion.collection.dropIndex('code_1');
    console.log('ℹ️ Ancien index unique bilanquestions.code supprimé.');
  }

  await BilanQuestion.collection.createIndex(
    { version: 1, code: 1 },
    { unique: true }
  );
}

export const seedBilan = async (options: SeedBilanOptions = {}) => {
  const version = options.version ?? defaultBilanSeedVersion;
  const seedSet = getBilanQuestionSeedSet(version);

  await ensureBilanQuestionVersionedIndexes();

  await BilanQuestion.bulkWrite(
    seedSet.questions.map((question) => ({
      updateOne: {
        filter: { version, code: question.code },
        update: {
          $set: {
            ...question,
            version,
            isActive: question.isActive ?? true,
          },
        },
        upsert: true,
      },
    })),
    { ordered: false }
  );

  await BilanQuestion.updateMany(
    {
      version,
      code: { $nin: seedSet.questions.map((question) => question.code) },
      isActive: true,
    },
    { $set: { isActive: false } }
  );

  console.log(
    `✅ Questions de l'auto-évaluation v${version} synchronisées (${seedSet.questions.length} questions)`
  );

  await BilanVersion.updateMany(
    { version: { $ne: version }, isActive: true },
    { $set: { isActive: false, status: 'archived' } }
  );
  await BilanVersion.updateOne(
    { version },
    {
      $set: {
        version,
        title: seedSet.title,
        description: seedSet.description,
        isActive: true,
        status: 'active',
      },
    },
    { upsert: true }
  );

  console.log(`✅ Auto-évaluation professionnelle v${version} active`);
};
