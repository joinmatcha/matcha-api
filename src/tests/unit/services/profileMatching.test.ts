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

  it('keeps partially compatible jobs below 100 when profile signals are broad', () => {
    const broadMatch = job({
      label: 'Agent commercial',
      domain: { label: 'Publicité' },
      riasec: { major: 'E', codes: ['RIASEC_E'] },
      skills: [
        {
          label: 'communication organisation négociation marketing',
          isMain: true,
        },
      ],
      workContexts: [
        {
          label: 'salarié secteur privé cdi cdd autonomie équipe',
        },
      ],
      themes: [{ label: 'Communication et marketing' }],
      transitions: { digital: true, ecological: true },
    });
    const broadSignals: JobScoringSignals = {
      interests: [
        signal('RIASEC_E', 3.6),
        signal('RIASEC_R', 2.4),
        signal('RIASEC_C', 1.2),
      ],
      sectors: [
        signal('Publicité', 3.6, ['Métiers likés']),
        signal('Communication et marketing', 2.8, ['Métiers likés']),
        signal('Production', 1.4),
        signal('Assurance', 1.2),
      ],
      skills: [
        signal('organisation', 5.5, ['Métiers likés']),
        signal('communication', 5, ['Métiers likés']),
        signal('marketing', 3.5, ['Métiers likés']),
        signal('rigueur', 3.5, ['Métiers likés']),
        signal('management', 2.4),
        signal('analyse', 1.8),
      ],
      workConditions: [
        signal('Salarié secteur privé CDI CDD', 4.5, ['Métiers likés']),
        signal('autonomie', 1.6),
        signal('terrain', 1.2),
      ],
    };

    expect(scoreJobForProfile(broadMatch, broadSignals).score).toBeLessThan(
      100
    );
  });

  it('requires more evidence than a RIASEC overlap alone', () => {
    const riasecOnly = job({
      label: 'Métier générique',
      domain: { label: 'Domaine neutre' },
      riasec: { major: 'E', codes: ['RIASEC_E'] },
      skills: [{ label: 'activité sans compétence profilée', isMain: true }],
      workContexts: [{ label: 'cadre standard' }],
      themes: [{ label: 'thème neutre' }],
    });
    const signals: JobScoringSignals = {
      interests: [signal('RIASEC_E', 3.6)],
      sectors: [signal('Publicité', 3.6)],
      skills: [signal('communication', 5)],
      workConditions: [signal('autonomie', 1.6)],
    };

    expect(scoreJobForProfile(riasecOnly, signals).score).toBe(0);
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
