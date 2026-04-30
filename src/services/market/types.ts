export interface MarketTokenResponse {
  access_token: string;
  expires_in?: number;
  token_type?: string;
}

export interface MarketIndicatorCriteria {
  codeTypeTerritoire: string;
  codeTerritoire: string;
  codeTypeActivite: 'ROME';
  codeActivite: string;
  codeTypePeriode: 'TRIMESTRE' | 'ANNEE';
  codeTypeNomenclature: string;
  dernierePeriode?: boolean;
  sansCaracteristiques?: boolean;
}

export interface MarketIndicatorResponse {
  datMaj?: string;
  codeIndicateur?: string;
  codeFamille?: string;
  libIndicateur?: string;
  libTerritoire?: string;
  listeValeursParPeriode?: MarketPeriodValue[];
  valeursParPeriode?: MarketPeriodValue[];
}

export interface MarketPeriodValue {
  datMaj?: string;
  codeTypeTerritoire?: string;
  codeTerritoire?: string;
  libTerritoire?: string;
  codeTypeActivite?: string;
  codeActivite?: string;
  libActivite?: string;
  codeNomenclature?: string;
  libNomenclature?: string;
  codeTypePeriode?: string;
  codePeriode?: string;
  libPeriode?: string;
  valeurPrincipaleNom?: string;
  valeurPrincipaleNombre?: number;
  valeurPrincipaleRang?: number;
  valeurPrincipaleMontant?: number;
  valeurPrincipaleTaux?: number;
  valeurPrincipaleDecimale?: number;
  valeurSecondaireNombre?: number;
  valeurSecondairePourcentage?: number;
  valeurSecondairePourcentage2?: number;
  valeurSecondaireTaux?: number;
  libPctParActivite?: string;
  listeValeurParCaract?: MarketCharacteristicValue[];
  salaireValeurMontant?: MarketSalaryValue[];
}

export interface MarketCharacteristicValue {
  codeTypeCaract?: string;
  codeCaract?: string;
  libCaract?: string;
  nombre?: number;
  pourcentage?: number;
  montant?: number;
  taux?: number;
}

export interface MarketSalaryValue {
  codeNomenclature?: string;
  libNomenclature?: string;
  valeurPrincipaleMontant?: number;
}
