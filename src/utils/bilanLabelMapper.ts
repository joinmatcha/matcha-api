import { BILAN_SUBDOMAIN_LABELS } from '@/constants/bilanLabels';

/**
 * Mappe des clés techniques vers des labels humains
 * (value, work_condition, competence, soft_skill, etc.)
 */
export const mapSubdomainsToLabels = (
  domain: string,
  values: string[],
): string[] =>
  values.map(
    (v) => BILAN_SUBDOMAIN_LABELS[domain]?.[v] ?? v.replace(/_/g, ' '),
  );
