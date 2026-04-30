import { RomeMetier } from '@/models/RomeMetier';

let counter = 0;

export function buildRomeMetier(overrides: Record<string, unknown> = {}) {
  counter += 1;
  const suffix = String(counter).padStart(4, '0');

  return {
    code: `T${suffix}`,
    label: `Métier test ${suffix}`,
    normalizedLabel: `metier test ${suffix}`,
    definition: 'Définition métier de test',
    domain: {
      code: 'M18',
      label: 'Tech',
      grandDomain: { code: 'M', label: "Support à l'entreprise" },
    },
    riasec: {
      major: 'I',
      minor: 'R',
      codes: ['RIASEC_I', 'RIASEC_R'],
    },
    appellations: [],
    skills: [{ label: 'analysis', source: 'metier', isMain: true }],
    knowledge: [],
    workContexts: [{ label: 'remote' }],
    themes: [{ label: 'web' }],
    sectors: [],
    nafDivisions: [],
    relatedJobs: [],
    transitions: {},
    isActive: true,
    ...overrides,
  };
}

export async function createRomeMetier(
  overrides: Record<string, unknown> = {}
) {
  return RomeMetier.create(buildRomeMetier(overrides));
}
