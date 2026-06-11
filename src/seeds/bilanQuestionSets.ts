import type { BilanQuestionDocument } from '@/models/BilanQuestion';
import {
  bilanQuestionSeedVersion,
  bilanQuestions,
} from '@/seeds/bilanQuestions';

export interface BilanQuestionSeedSet {
  version: number;
  title: string;
  description: string;
  questions: Partial<BilanQuestionDocument>[];
}

const seedSets: Record<number, BilanQuestionSeedSet> = {
  [bilanQuestionSeedVersion]: {
    version: bilanQuestionSeedVersion,
    title: `Auto-évaluation professionnelle v${bilanQuestionSeedVersion}`,
    description:
      'Auto-évaluation courte renforcee : competences, interets, valeurs, conditions et faisabilite de reconversion',
    questions: bilanQuestions,
  },
};

export const defaultBilanSeedVersion = bilanQuestionSeedVersion;

export function getBilanQuestionSeedSet(version: number): BilanQuestionSeedSet {
  const seedSet = seedSets[version];

  if (!seedSet) {
    const availableVersions = Object.keys(seedSets).join(', ');
    throw new Error(
      `No seed data found for auto-évaluation version ${version}. Available versions: ${availableVersions}`
    );
  }

  return seedSet;
}
