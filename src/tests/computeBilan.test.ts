import mongoose from 'mongoose';

import { BilanAnswerSet } from '@/models/BilanAnswerSet';
import { BilanCompetence } from '@/models/BilanCompetence';
import { BilanQuestion } from '@/models/BilanQuestion';
import { computeAndStoreBilan } from '@/services/bilan/computeBilan';

describe('computeBilan', () => {
  beforeEach(async () => {
    await BilanQuestion.deleteMany({});
    await BilanAnswerSet.deleteMany({});
    await BilanCompetence.deleteMany({});

    await BilanQuestion.create({
      code: 'C1',
      domain: 'competence',
      subdomain: 'analysis',
      question: 'Analyse',
      type: 'likert_1_5',
      version: 1,
      isActive: true,
    });
  });

  it('should compute & save bilan correctly', async () => {
    const userId = new mongoose.Types.ObjectId().toString();

    const answers = await BilanAnswerSet.create({
      user: userId,
      version: 1,
      answers: [{ questionCode: 'C1', valueNumber: 5 }],
    });

    const questions = await BilanQuestion.find({ version: 1 });

    const result = await computeAndStoreBilan(questions, answers);

    const plain = result.toObject();

    // Scores
    expect(plain.scores.competence.analysis).toBe(5);

    // Investigation
    expect(plain.investigation).toBeDefined();
    expect(plain.investigation.competence.strengths).toContain('analysis');

    // Conclusion
    expect(plain.conclusion).toBeDefined();
    expect(plain.conclusion.archetype).toBeDefined();
    expect(plain.conclusion.archetype.title).toBeDefined();
    expect(Array.isArray(plain.conclusion.keyStrengths)).toBe(true);

    const stored = await BilanCompetence.findOne({ user: userId });
    expect(stored).not.toBeNull();
    expect(stored!.scores.competence.analysis).toBe(5);
  });

  it('should classify competence as strength when score is high', async () => {
    const userId = new mongoose.Types.ObjectId().toString();

    const answers = await BilanAnswerSet.create({
      user: userId,
      version: 1,
      answers: [{ questionCode: 'C1', valueNumber: 4 }],
    });

    const questions = await BilanQuestion.find({ version: 1 });

    const result = await computeAndStoreBilan(questions, answers);

    expect(result.investigation.competence.strengths).toContain('analysis');
    expect(result.conclusion.keyStrengths.length).toBeGreaterThan(0);
  });

  it('should classify competence as axis to improve when score is low', async () => {
    const userId = new mongoose.Types.ObjectId().toString();

    const answers = await BilanAnswerSet.create({
      user: userId,
      version: 1,
      answers: [{ questionCode: 'C1', valueNumber: 1 }],
    });

    const questions = await BilanQuestion.find({ version: 1 });

    const result = await computeAndStoreBilan(questions, answers);

    expect(result.investigation.competence.toImprove).toContain('analysis');
  });
});
