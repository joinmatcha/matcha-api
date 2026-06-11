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

  const existingQuestions = await BilanQuestion.countDocuments({ version });

  if (existingQuestions === 0) {
    await BilanQuestion.insertMany(
      seedSet.questions.map((question) => ({
        ...question,
        version,
      }))
    );
    console.log(
      `✅ Questions de l'auto-évaluation v${version} seedées (${seedSet.questions.length} questions)`
    );
  } else {
    console.log(
      `ℹ️ Questions de l'auto-évaluation v${version} déjà existantes.`
    );
  }

  await BilanVersion.updateMany(
    { version: { $ne: version }, isActive: true },
    { $set: { isActive: false, status: 'archived' } }
  );
  await BilanVersion.updateOne(
    { version },
    {
      $setOnInsert: {
        version,
        title: seedSet.title,
        description: seedSet.description,
      },
      $set: {
        isActive: true,
        status: 'active',
      },
    },
    { upsert: true }
  );

  console.log(`✅ Auto-évaluation professionnelle v${version} active`);
};
