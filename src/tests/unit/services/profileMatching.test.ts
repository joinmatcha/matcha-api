import { Types } from 'mongoose';

import {
  JobScoringSignals,
  diversifyMatchedJobs,
  scoreJobForProfile,
} from '@/services/jobs/profileMatching';
import { buildRomeMetier } from '@/tests/helpers/rome';

const signal = (label: string, weight = 1, sources = ['test']) => ({
  key: label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase(),
  label,
  weight,
  sources,
});

const baseSignals = (): JobScoringSignals => ({
  sectors: [],
  interests: [signal('RIASEC_I', 2.4)],
  skills: [],
  workConditions: [],
});

const job = (overrides: Record<string, unknown>) =>
  buildRomeMetier({
    _id: new Types.ObjectId(),
    ...overrides,
  }) as any;

describe('profile matching scoring', () => {
  it('differentiates two profiles with the same RIASEC but different skills and environments', () => {
    const developer = job({
      label: 'Développeur web',
      domain: { label: 'Informatique' },
      riasec: { major: 'I', codes: ['RIASEC_I'] },
      skills: [{ label: 'analysis digital', isMain: true }],
      workContexts: [{ label: 'remote autonomie apprentissage' }],
      themes: [{ label: 'innovation' }],
    });
    const labResearcher = job({
      label: 'Technicien laboratoire',
      domain: { label: 'Recherche santé' },
      riasec: { major: 'I', codes: ['RIASEC_I'] },
      skills: [{ label: 'observation protocole qualité', isMain: true }],
      workContexts: [{ label: 'laboratoire structure contrôle' }],
      themes: [{ label: 'santé' }],
    });

    const digitalProfile: JobScoringSignals = {
      ...baseSignals(),
      sectors: [signal('Informatique', 1.8)],
      skills: [signal('analysis', 1.8), signal('digital', 1.6)],
      workConditions: [signal('remote', 1.4), signal('apprentissage', 1.2)],
    };
    const labProfile: JobScoringSignals = {
      ...baseSignals(),
      sectors: [signal('Recherche santé', 1.8)],
      skills: [signal('observation', 1.8), signal('qualité', 1.6)],
      workConditions: [signal('laboratoire', 1.4), signal('structure', 1.2)],
    };

    expect(scoreJobForProfile(developer, digitalProfile).score).toBeGreaterThan(
      scoreJobForProfile(labResearcher, digitalProfile).score
    );
    expect(scoreJobForProfile(labResearcher, labProfile).score).toBeGreaterThan(
      scoreJobForProfile(developer, labProfile).score
    );
  });

  it('lets swipe-derived sector signals change the ranking after the tests', () => {
    const productOwner = job({
      label: 'Product owner',
      domain: { label: 'Informatique' },
      riasec: { major: 'E', codes: ['RIASEC_E', 'RIASEC_I'] },
      skills: [{ label: 'coordination communication digital', isMain: true }],
      workContexts: [{ label: 'équipe autonomie projet' }],
      themes: [{ label: 'produit numérique' }],
    });
    const salesManager = job({
      label: 'Responsable commercial',
      domain: { label: 'Commerce' },
      riasec: { major: 'E', codes: ['RIASEC_E'] },
      skills: [{ label: 'communication négociation client', isMain: true }],
      workContexts: [{ label: 'client rythme équipe' }],
      themes: [{ label: 'vente' }],
    });

    const beforeSwipes: JobScoringSignals = {
      sectors: [],
      interests: [signal('RIASEC_E', 2.4)],
      skills: [signal('communication', 1.4)],
      workConditions: [signal('équipe', 1.2)],
    };
    const afterDigitalLikes: JobScoringSignals = {
      ...beforeSwipes,
      sectors: [signal('Informatique', 3, ['Métiers likés'])],
      skills: [
        ...beforeSwipes.skills,
        signal('digital', 2.5, ['Métiers likés']),
      ],
    };

    expect(
      scoreJobForProfile(salesManager, beforeSwipes).score
    ).toBeGreaterThan(0);
    expect(
      scoreJobForProfile(productOwner, afterDigitalLikes).score
    ).toBeGreaterThan(
      scoreJobForProfile(salesManager, afterDigitalLikes).score
    );
  });

  it('limits over-concentration in one sector when enough alternatives exist', () => {
    const ranked = [
      {
        id: '1',
        title: 'A',
        code: 'A',
        sector: 'Tech',
        score: 99,
        reasons: [],
      },
      {
        id: '2',
        title: 'B',
        code: 'B',
        sector: 'Tech',
        score: 98,
        reasons: [],
      },
      {
        id: '3',
        title: 'C',
        code: 'C',
        sector: 'Tech',
        score: 97,
        reasons: [],
      },
      {
        id: '4',
        title: 'D',
        code: 'D',
        sector: 'Santé',
        score: 80,
        reasons: [],
      },
      {
        id: '5',
        title: 'E',
        code: 'E',
        sector: 'Education',
        score: 79,
        reasons: [],
      },
    ];

    const result = diversifyMatchedJobs(ranked, 4);

    expect(result.map((item) => item.id)).toEqual(['1', '2', '4', '5']);
  });
});
