import {
  MarketIndicatorSnapshot,
  MarketIndicatorValue,
} from '@/models/RomeMarketStat';
import {
  MarketCharacteristicValue,
  MarketIndicatorResponse,
  MarketPeriodValue,
  MarketSalaryValue,
} from '@/services/market/types';

const SALARY_LABELS: Record<string, string> = {
  SAL1: 'Salaire débutant',
  SAL2: 'Salaire expérimenté',
  SAL3: 'Salaire moyen',
};

function parseDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function periodRank(value: MarketPeriodValue): string {
  return value.codePeriode ?? value.datMaj ?? '';
}

function latestPeriods(values: MarketPeriodValue[] = []): MarketPeriodValue[] {
  const sortedPeriods = values.map(periodRank).filter(Boolean).sort();
  const latestPeriodCode = sortedPeriods[sortedPeriods.length - 1];

  if (!latestPeriodCode) return values;
  return values.filter((value) => periodRank(value) === latestPeriodCode);
}

function hasNumericValue(value: MarketIndicatorValue) {
  return [
    value.count,
    value.amount,
    value.rate,
    value.decimal,
    value.rank,
    value.percentage,
    value.secondaryCount,
    value.secondaryPercentage,
    value.secondaryRate,
  ].some((item) => item !== undefined);
}

function mapCharacteristicValue(
  period: MarketPeriodValue,
  characteristic: MarketCharacteristicValue
): MarketIndicatorValue {
  return {
    code: characteristic.codeCaract,
    label: characteristic.libCaract,
    periodCode: period.codePeriode,
    periodLabel: period.libPeriode,
    count: characteristic.nombre,
    amount: characteristic.montant,
    rate: characteristic.taux,
    percentage: characteristic.pourcentage,
  };
}

function mapPeriodValue(period: MarketPeriodValue): MarketIndicatorValue {
  return {
    code: period.codeNomenclature,
    label: period.libNomenclature,
    periodCode: period.codePeriode,
    periodLabel: period.libPeriode,
    name: period.valeurPrincipaleNom,
    count: period.valeurPrincipaleNombre,
    amount: period.valeurPrincipaleMontant,
    rate: period.valeurPrincipaleTaux,
    decimal: period.valeurPrincipaleDecimale,
    rank: period.valeurPrincipaleRang,
    secondaryCount: period.valeurSecondaireNombre,
    secondaryPercentage:
      period.valeurSecondairePourcentage ?? period.valeurSecondairePourcentage2,
    secondaryRate: period.valeurSecondaireTaux,
  };
}

function mapSalaryValue(
  period: MarketPeriodValue,
  salary: MarketSalaryValue
): MarketIndicatorValue {
  return {
    code: salary.codeNomenclature,
    label:
      salary.libNomenclature ??
      (salary.codeNomenclature
        ? SALARY_LABELS[salary.codeNomenclature]
        : undefined),
    periodCode: period.codePeriode,
    periodLabel: period.libPeriode,
    amount: salary.valeurPrincipaleMontant,
  };
}

export function mapMarketIndicator(
  response?: MarketIndicatorResponse
): MarketIndicatorSnapshot | undefined {
  if (!response) return undefined;

  const periods = latestPeriods(
    response.listeValeursParPeriode ?? response.valeursParPeriode ?? []
  );
  const firstPeriod = periods[0];
  const values = periods.flatMap((period) => {
    const salaryValues =
      period.salaireValeurMontant?.map((value) =>
        mapSalaryValue(period, value)
      ) ?? [];

    if (salaryValues.length > 0) {
      return salaryValues;
    }

    const characteristicValues =
      period.listeValeurParCaract?.map((value) =>
        mapCharacteristicValue(period, value)
      ) ?? [];

    return characteristicValues.length > 0
      ? characteristicValues
      : [mapPeriodValue(period)];
  });

  return {
    code: response.codeIndicateur,
    family: response.codeFamille,
    label: response.libIndicateur,
    updatedAt: parseDate(response.datMaj),
    periodCode: firstPeriod?.codePeriode,
    periodLabel: firstPeriod?.libPeriode,
    mainName: firstPeriod?.valeurPrincipaleNom,
    values: values.filter(hasNumericValue),
  };
}
