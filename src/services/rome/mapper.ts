import { Types } from 'mongoose';

import { RomeMetierDocument } from '@/models/RomeMetier';
import {
  RomeAppellationApi,
  RomeCompetenceApi,
  RomeFicheMetierApi,
  RomeMetierApi,
  RomeReference,
  RomeRiasecLetter,
} from '@/services/rome/types';
import { compact, normalizeText, uniqBy } from '@/services/rome/utils';

type MetierUpdate = Omit<RomeMetierDocument, '_id' | 'createdAt' | 'updatedAt'>;

const RIASEC_PREFIX = 'RIASEC_';

type LabelCodeValue = { code?: string; label?: string };

function labelCode(ref?: RomeReference): LabelCodeValue | undefined {
  if (!ref) return undefined;
  return {
    code: ref.code,
    label: ref.libelle ?? ref.label,
  };
}

function isLabelCode(
  value: LabelCodeValue | undefined
): value is LabelCodeValue {
  return Boolean(value?.label);
}

function riasecCodes(
  major?: RomeRiasecLetter,
  minor?: RomeRiasecLetter
): string[] {
  return Array.from(
    new Set(
      compact([major, minor]).map((letter) => `${RIASEC_PREFIX}${letter}`)
    )
  );
}

function mapAppellation(appellation: RomeAppellationApi) {
  return {
    code: appellation.code,
    label: appellation.libelle,
    shortLabel: appellation.libelleCourt,
    classification: appellation.classification,
    isMain: appellation.classification === 'PRINCIPALE',
  };
}

function mapSkill(
  competence: RomeCompetenceApi,
  source: 'metier' | 'fiche',
  isMain: boolean,
  group?: RomeReference
) {
  if (!competence.libelle) return undefined;

  return {
    code: competence.code,
    label: competence.libelle,
    type: competence.type,
    riasecMajor: competence.riasecMajeur,
    riasecMinor: competence.riasecMineur,
    isMain,
    source,
    group: labelCode(group),
  };
}

function mapGroupedSkill(competence: RomeCompetenceApi) {
  if (!competence.libelle) return undefined;

  return {
    code: competence.code,
    label: competence.libelle,
    type: competence.type,
    riasecMajor: competence.riasecMajeur,
    riasecMinor: competence.riasecMineur,
  };
}

function sectorsFromMetier(metier: RomeMetierApi) {
  return (metier.secteursActivitesLies ?? [])
    .map((linked) => {
      const sector =
        linked.secteurActivite?.secteurActivite ?? linked.secteurActivite;
      return labelCode(sector);
    })
    .filter(isLabelCode);
}

export function buildRomeMetierUpdate(
  metier: RomeMetierApi,
  ficheMetier?: RomeFicheMetierApi,
  appellations: RomeAppellationApi[] = [],
  now = new Date()
): MetierUpdate {
  const major = metier.riasecMajeur;
  const minor = metier.riasecMineur;

  const metierSkills = [
    ...(metier.competencesMobiliseesPrincipales ?? []).map((skill) =>
      mapSkill(skill, 'metier', true)
    ),
    ...(metier.competencesMobiliseesEmergentes ?? []).map((skill) =>
      mapSkill(skill, 'metier', false)
    ),
    ...(metier.competencesMobilisees ?? []).map((skill) =>
      mapSkill(skill, 'metier', false)
    ),
  ];

  const ficheSkills =
    ficheMetier?.groupesCompetencesMobilisees?.flatMap((group) =>
      (group.competences ?? []).map((skill) =>
        mapSkill(skill, 'fiche', true, group.enjeu)
      )
    ) ?? [];

  const knowledge =
    ficheMetier?.groupesSavoirs?.flatMap((group) =>
      (group.savoirs ?? []).map((savoir) => ({
        code: savoir.code,
        label: savoir.libelle ?? savoir.label ?? '',
        category: labelCode(group.categorieSavoirs ?? group.categoriesSavoirs),
      }))
    ) ?? [];

  const skillGroups =
    ficheMetier?.groupesCompetencesMobilisees
      ?.map((group) => ({
        group: labelCode(group.enjeu),
        skills: compact((group.competences ?? []).map(mapGroupedSkill)),
      }))
      .filter((group) => group.skills.length > 0) ?? [];

  const knowledgeGroups =
    ficheMetier?.groupesSavoirs
      ?.map((group) => ({
        category: labelCode(group.categorieSavoirs ?? group.categoriesSavoirs),
        knowledge: (group.savoirs ?? [])
          .map((savoir) => ({
            code: savoir.code,
            label: savoir.libelle ?? savoir.label ?? '',
            type:
              typeof (savoir as { type?: unknown }).type === 'string'
                ? (savoir as { type: string }).type
                : undefined,
          }))
          .filter((savoir) => Boolean(savoir.label)),
      }))
      .filter((group) => group.knowledge.length > 0) ?? [];

  const mappedAppellations = uniqBy(
    [
      ...appellations,
      ...(metier.appellations ?? []),
      ...(metier.appellationsEnvisageables ?? []),
    ]
      .filter((appellation) => appellation.code && appellation.libelle)
      .map(mapAppellation),
    (appellation) => appellation.code
  );

  const skills = uniqBy(
    compact([...metierSkills, ...ficheSkills]),
    (skill) => `${skill.code ?? ''}:${skill.label}`
  );

  const relatedJobs = [
    ...(metier.metiersProches ?? []).map((job) => ({
      ...labelCode(job),
      relation: 'close' as const,
    })),
    ...(metier.metiersEnvisageables ?? []).map((job) => ({
      ...labelCode(job),
      relation: 'possible' as const,
    })),
  ].filter((job) => job.code || job.label);

  return {
    code: metier.code,
    label: metier.libelle,
    normalizedLabel: normalizeText(metier.libelle),
    definition: metier.definition,
    accessToJob: metier.accesEmploi,
    domain: {
      code: metier.domaineProfessionnel?.code,
      label: metier.domaineProfessionnel?.libelle,
      grandDomain: labelCode(metier.domaineProfessionnel?.grandDomaine),
    },
    riasec: {
      major,
      minor,
      codes: riasecCodes(major, minor),
    },
    appellations: mappedAppellations,
    skills,
    knowledge: uniqBy(
      knowledge.filter((item) => Boolean(item.label)),
      (item) => `${item.code ?? ''}:${item.label}`
    ),
    skillGroups,
    knowledgeGroups,
    workContexts: uniqBy(
      (metier.contextesTravail ?? [])
        .filter((context) => context.libelle)
        .map((context) => ({
          code: context.code,
          label: context.libelle as string,
          category: context.categorie,
        })),
      (context) => `${context.code ?? ''}:${context.label}`
    ),
    themes: uniqBy(
      (metier.themes ?? []).map(labelCode).filter(isLabelCode),
      (theme) => `${theme.code ?? ''}:${theme.label ?? ''}`
    ),
    interests: uniqBy(
      [
        ...(metier.centresInteretsLies ?? [])
          .map((linked) => {
            const interest = labelCode(linked.centreInteret);
            if (!interest) return undefined;
            return { ...interest, isMain: linked.principal };
          })
          .filter(Boolean),
        ...(metier.centresInterets ?? [])
          .map(labelCode)
          .filter(isLabelCode)
          .map((interest) => ({ ...interest, isMain: false })),
      ].filter(Boolean) as Array<LabelCodeValue & { isMain?: boolean }>,
      (interest) => `${interest.code ?? ''}:${interest.label ?? ''}`
    ),
    trainingCodes: uniqBy(
      (metier.formacodes ?? []).map(labelCode).filter(isLabelCode),
      (formacode) => `${formacode.code ?? ''}:${formacode.label ?? ''}`
    ),
    sectors: uniqBy(sectorsFromMetier(metier), (sector) => {
      return `${sector.code ?? ''}:${sector.label ?? ''}`;
    }),
    nafDivisions: uniqBy(
      (metier.divisionsNaf ?? []).map(labelCode).filter(isLabelCode),
      (division) => `${division.code ?? ''}:${division.label ?? ''}`
    ),
    relatedJobs: uniqBy(relatedJobs, (job) => `${job.relation}:${job.code}`),
    transitions: {
      ecological: metier.transitionEcologique,
      digital: metier.transitionNumerique,
      demographic: metier.transitionDemographique,
      ecologicalDetail: metier.transitionEcologiqueDetaillee,
    },
    isExecutive: metier.emploiCadre,
    isRegulated: metier.emploiReglemente,
    isActive: metier.obsolete !== true,
    lastSyncedAt: now,
    removedFromRomeAt: undefined,
    raw: {
      metier,
      ficheMetier,
    },
  };
}

export function buildRomeAppellationUpdate(
  appellation: RomeAppellationApi,
  metierIdByCode: Map<string, Types.ObjectId>,
  now = new Date()
) {
  const metier = appellation.metier;

  if (!metier?.code || !metier.libelle) {
    return undefined;
  }

  return {
    code: appellation.code,
    label: appellation.libelle,
    shortLabel: appellation.libelleCourt,
    normalizedLabel: normalizeText(appellation.libelle),
    metierCode: metier.code,
    metierLabel: metier.libelle,
    metierId: metierIdByCode.get(metier.code),
    classification: appellation.classification,
    isActive: true,
    lastSyncedAt: now,
    removedFromRomeAt: undefined,
    raw: appellation,
  };
}
