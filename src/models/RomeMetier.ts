import { Schema, Types, model } from 'mongoose';

export type RomeRiasecLetter = 'R' | 'I' | 'A' | 'S' | 'E' | 'C';

export interface RomeLabelCode {
  code?: string;
  label?: string;
}

export interface RomeMetierDocument {
  _id: Types.ObjectId;
  code: string;
  label: string;
  normalizedLabel: string;
  definition?: string;
  accessToJob?: string;
  domain?: {
    code?: string;
    label?: string;
    grandDomain?: RomeLabelCode;
  };
  riasec: {
    major?: RomeRiasecLetter;
    minor?: RomeRiasecLetter;
    codes: string[];
  };
  appellations: Array<{
    code: string;
    label: string;
    shortLabel?: string;
    classification?: string;
    isMain?: boolean;
  }>;
  skills: Array<{
    code?: string;
    label: string;
    type?: string;
    riasecMajor?: RomeRiasecLetter;
    riasecMinor?: RomeRiasecLetter;
    isMain?: boolean;
    source?: 'metier' | 'fiche';
    group?: RomeLabelCode;
  }>;
  knowledge: Array<{
    code?: string;
    label: string;
    category?: RomeLabelCode;
  }>;
  skillGroups: Array<{
    group?: RomeLabelCode;
    skills: Array<{
      code?: string;
      label: string;
      type?: string;
      riasecMajor?: RomeRiasecLetter;
      riasecMinor?: RomeRiasecLetter;
    }>;
  }>;
  knowledgeGroups: Array<{
    category?: RomeLabelCode;
    knowledge: Array<{
      code?: string;
      label: string;
      type?: string;
    }>;
  }>;
  workContexts: Array<{
    code?: string;
    label: string;
    category?: string;
  }>;
  themes: RomeLabelCode[];
  interests: Array<RomeLabelCode & { isMain?: boolean }>;
  trainingCodes: RomeLabelCode[];
  sectors: RomeLabelCode[];
  nafDivisions: RomeLabelCode[];
  relatedJobs: Array<RomeLabelCode & { relation: 'close' | 'possible' }>;
  transitions: {
    ecological?: boolean;
    digital?: boolean;
    demographic?: boolean;
    ecologicalDetail?: string;
  };
  isExecutive?: boolean;
  isRegulated?: boolean;
  isActive: boolean;
  lastSyncedAt?: Date;
  removedFromRomeAt?: Date;
  raw?: {
    metier?: unknown;
    ficheMetier?: unknown;
  };
  createdAt: Date;
  updatedAt: Date;
}

const LabelCodeSchema = new Schema(
  {
    code: { type: String, trim: true },
    label: { type: String, trim: true },
  },
  { _id: false }
);

const RomeMetierSchema = new Schema<RomeMetierDocument>(
  {
    code: { type: String, required: true, unique: true, trim: true },
    label: { type: String, required: true, trim: true, index: true },
    normalizedLabel: { type: String, required: true, trim: true, index: true },
    definition: { type: String, trim: true },
    accessToJob: { type: String, trim: true },
    domain: {
      code: { type: String, trim: true, index: true },
      label: { type: String, trim: true, index: true },
      grandDomain: LabelCodeSchema,
    },
    riasec: {
      major: {
        type: String,
        enum: ['R', 'I', 'A', 'S', 'E', 'C'],
        index: true,
      },
      minor: {
        type: String,
        enum: ['R', 'I', 'A', 'S', 'E', 'C'],
        index: true,
      },
      codes: { type: [String], default: [], index: true },
    },
    appellations: {
      type: [
        {
          code: { type: String, required: true, trim: true },
          label: { type: String, required: true, trim: true },
          shortLabel: { type: String, trim: true },
          classification: { type: String, trim: true },
          isMain: Boolean,
        },
      ],
      default: [],
    },
    skills: {
      type: [
        {
          code: { type: String, trim: true },
          label: { type: String, required: true, trim: true },
          type: { type: String, trim: true },
          riasecMajor: { type: String, enum: ['R', 'I', 'A', 'S', 'E', 'C'] },
          riasecMinor: { type: String, enum: ['R', 'I', 'A', 'S', 'E', 'C'] },
          isMain: Boolean,
          source: { type: String, enum: ['metier', 'fiche'] },
          group: LabelCodeSchema,
        },
      ],
      default: [],
      index: true,
    },
    knowledge: {
      type: [
        {
          code: { type: String, trim: true },
          label: { type: String, required: true, trim: true },
          category: LabelCodeSchema,
        },
      ],
      default: [],
    },
    skillGroups: {
      type: [
        {
          group: LabelCodeSchema,
          skills: {
            type: [
              {
                code: { type: String, trim: true },
                label: { type: String, required: true, trim: true },
                type: { type: String, trim: true },
                riasecMajor: {
                  type: String,
                  enum: ['R', 'I', 'A', 'S', 'E', 'C'],
                },
                riasecMinor: {
                  type: String,
                  enum: ['R', 'I', 'A', 'S', 'E', 'C'],
                },
              },
            ],
            default: [],
          },
        },
      ],
      default: [],
    },
    knowledgeGroups: {
      type: [
        {
          category: LabelCodeSchema,
          knowledge: {
            type: [
              {
                code: { type: String, trim: true },
                label: { type: String, required: true, trim: true },
                type: { type: String, trim: true },
              },
            ],
            default: [],
          },
        },
      ],
      default: [],
    },
    workContexts: {
      type: [
        {
          code: { type: String, trim: true },
          label: { type: String, required: true, trim: true },
          category: { type: String, trim: true, index: true },
        },
      ],
      default: [],
    },
    themes: { type: [LabelCodeSchema], default: [] },
    interests: {
      type: [
        {
          code: { type: String, trim: true },
          label: { type: String, trim: true },
          isMain: Boolean,
        },
      ],
      default: [],
    },
    trainingCodes: { type: [LabelCodeSchema], default: [] },
    sectors: { type: [LabelCodeSchema], default: [] },
    nafDivisions: { type: [LabelCodeSchema], default: [] },
    relatedJobs: {
      type: [
        {
          code: { type: String, trim: true },
          label: { type: String, trim: true },
          relation: {
            type: String,
            enum: ['close', 'possible'],
            required: true,
          },
        },
      ],
      default: [],
    },
    transitions: {
      ecological: Boolean,
      digital: Boolean,
      demographic: Boolean,
      ecologicalDetail: { type: String, trim: true },
    },
    isExecutive: Boolean,
    isRegulated: Boolean,
    isActive: { type: Boolean, default: true, index: true },
    lastSyncedAt: Date,
    removedFromRomeAt: Date,
    raw: {
      metier: Schema.Types.Mixed,
      ficheMetier: Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

RomeMetierSchema.index({
  label: 'text',
  normalizedLabel: 'text',
  'appellations.label': 'text',
  definition: 'text',
});
RomeMetierSchema.index({ isActive: 1, 'riasec.codes': 1 });
RomeMetierSchema.index({ isActive: 1, 'domain.label': 1 });

export const RomeMetier = model<RomeMetierDocument>(
  'RomeMetier',
  RomeMetierSchema
);
