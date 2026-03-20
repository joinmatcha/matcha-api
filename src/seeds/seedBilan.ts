import { BilanQuestion } from '@/models/BilanQuestion';
import { BilanVersion } from '@/models/BilanVersion';
import { bilanQuestions } from '@/seeds/bilanQuestions';

export const seedBilan = async () => {
  const version = 1;

  // Vérifier s'il existe déjà des questions actives de cette version
  const existing = await BilanQuestion.findOne({ version, isActive: true });

  if (existing) {
    console.log(`ℹ️ Bilan v${version} déjà existant, aucun seed nécessaire.`);
    return;
  }

  // Insert toutes les questions de la version
  await BilanQuestion.insertMany(bilanQuestions);
  await BilanVersion.updateOne(
    { version },
    {
      $setOnInsert: {
        version,
        title: `Bilan v${version}`,
        description: 'Version initiale du bilan de competences',
      },
      $set: {
        isActive: true,
        status: 'active',
      },
    },
    { upsert: true }
  );

  console.log(
    `✅ Bilan de compétences v${version} seedé avec succès (${bilanQuestions.length} questions)`
  );
};
