import { BilanArchetypeDTO } from '@/types/bilan';

interface ResolveArchetypeInput {
  interestsProfile: string[];
  mappedStrengths: string[];
  mappedTopValues: string[];
  mappedTopWorkConditions: string[];
}

type ArchetypeRule = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  score: (input: ResolveArchetypeInput) => number;
};

const ARCHETYPES: ArchetypeRule[] = [
  {
    id: 'human_catalyst',
    title: 'Le catalyseur humain',
    subtitle: 'Créer de l’impact en accompagnant les autres',
    description:
      'Tu t’épanouis dans des contextes où l’humain, l’écoute et la transmission sont centraux. Tu sais créer du lien et faire progresser les autres.',
    score: ({ interestsProfile, mappedTopValues, mappedStrengths }) =>
      (interestsProfile.includes('RIASEC_S') ? 3 : 0) +
      (mappedTopValues.includes('Sens') ? 2 : 0) +
      (mappedStrengths.includes('Communication') ? 1 : 0),
  },

  {
    id: 'creative_builder',
    title: 'Le bâtisseur créatif',
    subtitle: 'Imaginer et concrétiser des idées',
    description:
      'Tu es stimulé·e par la création, l’innovation et la liberté d’expression. Tu aimes transformer des idées en projets concrets.',
    score: ({ interestsProfile, mappedStrengths }) =>
      (interestsProfile.includes('RIASEC_A') ? 3 : 0) +
      (mappedStrengths.includes('Créativité') ? 2 : 0),
  },

  {
    id: 'analytical_expert',
    title: 'L’expert analytique',
    subtitle: 'Comprendre, structurer et résoudre',
    description:
      'Tu excelles dans l’analyse, la logique et la résolution de problèmes complexes. Tu apprécies les environnements structurés et techniques.',
    score: ({ interestsProfile, mappedStrengths }) =>
      (interestsProfile.includes('RIASEC_I') ? 3 : 0) +
      (mappedStrengths.includes('Analyse') ? 2 : 0),
  },

  {
    id: 'strategic_leader',
    title: 'Le leader stratégique',
    subtitle: 'Donner une direction et mobiliser',
    description:
      'Tu sais prendre de la hauteur, décider et fédérer autour d’une vision. Tu es à l’aise dans les rôles de pilotage et de coordination.',
    score: ({ interestsProfile, mappedStrengths, mappedTopValues }) =>
      (interestsProfile.includes('RIASEC_E') ? 3 : 0) +
      (mappedStrengths.includes('Management') ? 2 : 0) +
      (mappedTopValues.includes('Autonomie') ? 1 : 0),
  },

  {
    id: 'field_operator',
    title: 'L’acteur de terrain',
    subtitle: 'Agir concrètement et voir des résultats',
    description:
      'Tu préfères l’action au discours et apprécies les environnements dynamiques, concrets et opérationnels.',
    score: ({ interestsProfile, mappedTopWorkConditions }) =>
      (interestsProfile.includes('RIASEC_R') ? 3 : 0) +
      (mappedTopWorkConditions.includes('Activité physique') ? 2 : 0),
  },
];

export function resolveArchetype(
  input: ResolveArchetypeInput
): BilanArchetypeDTO {
  const ranked = ARCHETYPES.map((rule) => ({
    rule,
    score: rule.score(input),
  }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  if (ranked.length > 0) {
    const { id, title, subtitle, description } = ranked[0].rule;
    return { id, title, subtitle, description };
  }

  return {
    id: 'balanced_profile',
    title: 'Le profil polyvalent',
    subtitle: 'S’adapter à des contextes variés',
    description:
      'Tu disposes d’un équilibre de compétences qui te permet d’évoluer dans différents environnements professionnels.',
  };
}
