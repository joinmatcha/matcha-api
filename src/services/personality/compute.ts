import PersonalityTest from '@/models/PersonalityTest';
import User from '@/models/User';
import { refreshRecommendationProfile } from '@/services/jobs/profileMatching';
import { getActivePersonalityVersion } from '@/services/personality/version';

interface Answer {
  questionId: string;
  value: number; // -2 à +2
}

type PersonalityDimension = 'EI' | 'SN' | 'TF' | 'JP';

type DimensionInsight = {
  key: PersonalityDimension;
  label: string;
  preference: string;
  score: number;
  intensity: 'léger' | 'marqué' | 'fort';
  description: string;
};

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
  suggestedSectors?: string[];
}

const DIMENSION_READINGS: Record<
  PersonalityDimension,
  {
    label: string;
    negativePreference: string;
    positivePreference: string;
    negativeDescription: string;
    positiveDescription: string;
    balancedDescription: string;
    negativeWorkPreference: string;
    positiveWorkPreference: string;
  }
> = {
  EI: {
    label: 'Énergie relationnelle',
    negativePreference: 'Concentration individuelle',
    positivePreference: 'Interaction et échange',
    negativeDescription:
      'Tu sembles mieux récupérer dans des temps calmes, avec de la profondeur et peu d’interruptions.',
    positiveDescription:
      'Tu sembles gagner de l’énergie dans l’échange, la discussion et les environnements vivants.',
    balancedDescription:
      'Tu peux alterner entre temps d’échange et temps de concentration selon le contexte.',
    negativeWorkPreference:
      'Prévoir des plages de concentration sans interruption.',
    positiveWorkPreference:
      'Favoriser les rôles avec échanges réguliers et visibilité.',
  },
  SN: {
    label: 'Lecture de l’information',
    negativePreference: 'Concepts et possibilités',
    positivePreference: 'Faits et concret',
    negativeDescription:
      'Tu sembles à l’aise pour relier des idées, anticiper des scénarios et explorer des pistes nouvelles.',
    positiveDescription:
      'Tu sembles préférer les informations concrètes, observables et directement exploitables.',
    balancedDescription:
      'Tu peux passer du concret à la projection sans préférence très tranchée.',
    negativeWorkPreference:
      'Chercher des missions avec analyse, stratégie ou conception.',
    positiveWorkPreference:
      'Chercher des missions avec cadre concret, terrain ou exécution.',
  },
  TF: {
    label: 'Mode de décision',
    negativePreference: 'Impact humain',
    positivePreference: 'Logique et critères',
    negativeDescription:
      'Tu sembles décider en tenant fortement compte des personnes, du sens et de l’impact relationnel.',
    positiveDescription:
      'Tu sembles décider avec des critères logiques, une recherche de cohérence et de clarté.',
    balancedDescription:
      'Tu sembles équilibrer critères rationnels et attention aux personnes.',
    negativeWorkPreference:
      'Valoriser les environnements où l’utilité humaine est visible.',
    positiveWorkPreference:
      'Valoriser les environnements avec objectifs et critères nets.',
  },
  JP: {
    label: 'Organisation du travail',
    negativePreference: 'Souplesse et adaptation',
    positivePreference: 'Structure et planification',
    negativeDescription:
      'Tu sembles fonctionner avec souplesse, adaptation et capacité à avancer quand le cadre bouge.',
    positiveDescription:
      'Tu sembles préférer anticiper, organiser et travailler dans un cadre lisible.',
    balancedDescription:
      'Tu peux t’adapter tout en ayant besoin d’un minimum de repères.',
    negativeWorkPreference:
      'Garder de la marge de manœuvre dans les méthodes et priorités.',
    positiveWorkPreference:
      'Privilégier les postes avec priorités, rituels et responsabilités claires.',
  },
};

function intensityFromScore(score: number): DimensionInsight['intensity'] {
  const absolute = Math.abs(score);
  if (absolute >= 8) return 'fort';
  if (absolute >= 4) return 'marqué';
  return 'léger';
}

function buildDimensionInsights(
  scores: Record<PersonalityDimension, number>
): DimensionInsight[] {
  return (Object.keys(DIMENSION_READINGS) as PersonalityDimension[]).map(
    (key) => {
      const score = scores[key];
      const reading = DIMENSION_READINGS[key];
      const isBalanced = Math.abs(score) < 2;
      const isPositive = score >= 0;

      return {
        key,
        label: reading.label,
        preference: isBalanced
          ? 'Équilibre'
          : isPositive
            ? reading.positivePreference
            : reading.negativePreference,
        score,
        intensity: intensityFromScore(score),
        description: isBalanced
          ? reading.balancedDescription
          : isPositive
            ? reading.positiveDescription
            : reading.negativeDescription,
      };
    }
  );
}

function buildWorkPreferences(scores: Record<PersonalityDimension, number>) {
  return (Object.keys(DIMENSION_READINGS) as PersonalityDimension[])
    .map((key) => {
      const reading = DIMENSION_READINGS[key];
      return scores[key] >= 0
        ? reading.positiveWorkPreference
        : reading.negativeWorkPreference;
    })
    .slice(0, 4);
}

export async function computePersonality(userId: string, answers: Answer[]) {
  const version = await getActivePersonalityVersion();
  if (!version) throw new Error('Aucun test actif trouvé.');

  // Initialisation des dimensions principales
  const scores: Record<PersonalityDimension, number> = {
    EI: 0,
    SN: 0,
    TF: 0,
    JP: 0,
  };

  const questionsById = new Map<string, TemplateQuestion>(
    (version.questions as TemplateQuestion[]).map((q) => [q.id, q])
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
  const profile = (version.profiles as TemplateProfile[]).find(
    (p) => p.key === type
  );
  const dimensionInsights = buildDimensionInsights(scores);
  const workPreferences = buildWorkPreferences(scores);

  // Sauvegarde du test complet
  const test = await PersonalityTest.create({
    userId,
    templateId: version.id,
    templateVersion: version.version,
    answers,

    type,
    result: profile?.label ?? 'Profil neutre',

    description: profile?.description ?? '',
    traits: profile?.strengths ?? [],
    weaknesses: profile?.weaknesses ?? [],
    suggestedSectors: profile?.suggestedSectors ?? [],
    dimensionInsights,
    workPreferences,

    scoreBreakdown: scores,
  });

  await User.findByIdAndUpdate(userId, { personalityTestId: test._id });
  await refreshRecommendationProfile(userId);

  // Retourne un résumé structuré
  return {
    testId: test._id,
    type,
    label: profile?.label ?? 'Profil neutre',
    description: profile?.description,
    strengths: profile?.strengths ?? [],
    weaknesses: profile?.weaknesses ?? [],
    suggestedSectors: profile?.suggestedSectors ?? [],
    dimensionInsights,
    workPreferences,
    scoreBreakdown: scores,
  };
}
