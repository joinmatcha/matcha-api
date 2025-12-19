import {
  COMPETENCE_LABELS,
  RIASEC_LABELS,
  SOFT_SKILL_LABELS,
  VALUE_LABELS,
  WORK_CONDITION_LABELS,
} from '@/constants/jobLabels';

export const mapJobLabels = {
  competences: (codes: string[]) => codes.map((c) => COMPETENCE_LABELS[c] ?? c),

  softSkills: (codes: string[]) => codes.map((c) => SOFT_SKILL_LABELS[c] ?? c),

  values: (codes: string[]) => codes.map((c) => VALUE_LABELS[c] ?? c),

  workConditions: (codes: string[]) =>
    codes.map((c) => WORK_CONDITION_LABELS[c] ?? c),

  riasec: (codes: string[]) => codes.map((c) => RIASEC_LABELS[c] ?? c),
};
