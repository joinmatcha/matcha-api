export type RomeRiasecLetter = 'R' | 'I' | 'A' | 'S' | 'E' | 'C';

export interface RomeReference {
  code?: string;
  libelle?: string;
  label?: string;
  definition?: string;
}

export interface RomeAppellationApi {
  code: string;
  libelle: string;
  libelleCourt?: string;
  classification?: string;
  metier?: RomeMetierSummaryApi;
  [key: string]: unknown;
}

export interface RomeMetierSummaryApi {
  code: string;
  libelle: string;
  riasecMajeur?: RomeRiasecLetter;
  riasecMineur?: RomeRiasecLetter;
  domaineProfessionnel?: {
    code?: string;
    libelle?: string;
    grandDomaine?: RomeReference;
  };
  [key: string]: unknown;
}

export interface RomeMetierApi extends RomeMetierSummaryApi {
  definition?: string;
  accesEmploi?: string;
  label?: string;
  emploiCadre?: boolean;
  emploiReglemente?: boolean;
  transitionEcologique?: boolean;
  transitionNumerique?: boolean;
  transitionDemographique?: boolean;
  transitionEcologiqueDetaillee?: string;
  codeIsco?: string;
  appellations?: RomeAppellationApi[];
  appellationsEnvisageables?: RomeAppellationApi[];
  competencesMobiliseesPrincipales?: RomeCompetenceApi[];
  competencesMobiliseesEmergentes?: RomeCompetenceApi[];
  competencesMobilisees?: RomeCompetenceApi[];
  contextesTravail?: RomeWorkContextApi[];
  themes?: RomeReference[];
  centresInterets?: RomeReference[];
  centresInteretsLies?: Array<{
    centreInteret?: RomeReference;
    principal?: boolean;
  }>;
  formacodes?: RomeReference[];
  secteursActivitesLies?: Array<{
    secteurActivite?: RomeReference & { secteurActivite?: RomeReference };
    principal?: boolean;
  }>;
  divisionsNaf?: RomeReference[];
  metiersProches?: RomeMetierSummaryApi[];
  metiersEnvisageables?: RomeMetierSummaryApi[];
  obsolete?: boolean;
  [key: string]: unknown;
}

export interface RomeCompetenceApi {
  code?: string;
  codeOgr?: string;
  libelle?: string;
  type?: string;
  riasecMajeur?: RomeRiasecLetter;
  riasecMineur?: RomeRiasecLetter;
  [key: string]: unknown;
}

export interface RomeWorkContextApi {
  code?: string;
  libelle?: string;
  categorie?: string;
  [key: string]: unknown;
}

export interface RomeFicheMetierApi {
  code: string;
  metier?: RomeMetierSummaryApi;
  groupesCompetencesMobilisees?: Array<{
    enjeu?: RomeReference;
    competences?: RomeCompetenceApi[];
  }>;
  groupesSavoirs?: Array<{
    categorieSavoirs?: RomeReference;
    categoriesSavoirs?: RomeReference;
    savoirs?: RomeReference[];
  }>;
  [key: string]: unknown;
}

export interface RomeMappedMetier {
  code: string;
  metier: Record<string, unknown>;
  appellations: Array<Record<string, unknown>>;
}
