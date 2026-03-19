import PersonalityTemplate from '@/models/PersonalityTemplate';
import PersonalityTest from '@/models/PersonalityTest';
import User from '@/models/User';

interface Answer {
  questionId: string;
  value: number; // -2 à +2
}

type PersonalityDimension = 'EI' | 'SN' | 'TF' | 'JP';

interface TemplateQuestion {
  id: string;
  dimension: PersonalityDimension;
}

interface TemplateProfile {
  key: string;
  label?: string;
  description?: string;
  strengths?: string[];
  weaknesses?: string[];
  recommendedJobs?: string[];
}

export async function computePersonality(userId: string, answers: Answer[]) {
  const template = await PersonalityTemplate.findOne({ isActive: true });
  if (!template) throw new Error('Aucun test actif trouvé.');

  // Initialisation des dimensions principales
  const scores: Record<PersonalityDimension, number> = {
    EI: 0,
    SN: 0,
    TF: 0,
    JP: 0,
  };

  const questionsById = new Map<string, TemplateQuestion>(
    (template.questions as unknown as TemplateQuestion[]).map((q) => [q.id, q])
  );

  // Calcul du score pour chaque dimension
  for (const ans of answers) {
    const question = questionsById.get(ans.questionId);
    if (question) {
      scores[question.dimension] += ans.value;
    }
  }

  // Détermination du type MBTI à partir du signe de chaque score
  const type =
    (scores.EI >= 0 ? 'E' : 'I') +
    (scores.SN >= 0 ? 'S' : 'N') +
    (scores.TF >= 0 ? 'T' : 'F') +
    (scores.JP >= 0 ? 'J' : 'P');

  // Recherche du profil associé
  const profile = (template.profiles as unknown as TemplateProfile[]).find(
    (p) => p.key === type
  );

  // Sauvegarde du test complet
  const test = await PersonalityTest.create({
    userId,
    templateId: template._id,
    templateVersion: template.version,
    answers,

    type,
    result: profile?.label ?? 'Profil neutre',

    description: profile?.description ?? '',
    traits: profile?.strengths ?? [],
    weaknesses: profile?.weaknesses ?? [],
    motivationProfile: profile?.recommendedJobs ?? [],

    scoreBreakdown: scores,
  });

  await User.findByIdAndUpdate(userId, { personalityTestId: test._id });

  // Retourne un résumé structuré
  return {
    testId: test._id,
    type,
    label: profile?.label ?? 'Profil neutre',
    description: profile?.description,
    strengths: profile?.strengths ?? [],
    weaknesses: profile?.weaknesses ?? [],
    recommendedJobs: profile?.recommendedJobs ?? [],
    scoreBreakdown: scores,
  };
}
