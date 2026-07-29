import { Schema, Types, model } from 'mongoose';

const AnswerSchema = new Schema(
  {
    questionId: { type: String, required: true },
    value: { type: Number, required: true }, // -2 .. +2 (Likert)
  },
  { _id: false }
);

const DimensionInsightSchema = new Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    preference: { type: String, required: true },
    score: { type: Number, required: true },
    intensity: { type: String, required: true },
    description: { type: String, required: true },
  },
  { _id: false }
);

const PersonalityTestSchema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // lien vers la version de test (questions/profils) utilisée pour ce passage
    templateId: {
      type: Types.ObjectId,
      ref: 'PersonalityVersion',
      required: true,
      index: true,
    },

    // version du template au moment du test (pour audit/repro)
    templateVersion: { type: String, required: true },

    // réponses brutes
    answers: {
      type: [AnswerSchema],
      default: [],
      validate: [
        (arr: any[]) => Array.isArray(arr),
        'answers must be an array',
      ],
    },

    // résultat calculé
    type: { type: String, required: true, trim: true }, // e.g. ENTP
    result: { type: String, required: true, trim: true }, // e.g. "Innovateur" (label)
    description: { type: String },
    traits: { type: [String], default: [] }, // forces synthétiques
    weaknesses: { type: [String], default: [] },
    suggestedSectors: { type: [String], default: [] }, // jobs suggérés
    dimensionInsights: { type: [DimensionInsightSchema], default: [] },
    workPreferences: { type: [String], default: [] },

    // détails du scoring pour transparence & debug
    scoreBreakdown: {
      type: Map,
      of: Number, // { EI: 3, SN: -1, TF: 2, JP: -2 }
      default: {},
    },
  },
  { timestamps: true }
);

// éviter les doublons (un résultat par user et template actif, optionnel)
PersonalityTestSchema.index({ userId: 1, templateId: 1 }, { unique: true });

export default model('PersonalityTest', PersonalityTestSchema);
