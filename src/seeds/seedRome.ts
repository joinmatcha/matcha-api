import { Job } from '@/models/Job';

import { romeJobs } from './romeData';

export async function seedRome(): Promise<void> {
  const operations = romeJobs.map((rome) => ({
    updateOne: {
      filter: { externalId: rome.romeCode, source: 'rome' },
      update: {
        $set: {
          externalId: rome.romeCode,
          source: 'rome',
          lastSyncedAt: new Date(),
          isActive: true,
          title: rome.title,
          sector: rome.sector,
          description: rome.description,
          riasec: rome.riasec,
          competences: rome.competences,
          softSkills: rome.softSkills,
          values: rome.values,
          workConditions: rome.workConditions,
          tags: rome.tags,
          missions: rome.missions,
          dailyTasks: rome.dailyTasks,
          evolutionPaths: rome.evolutionPaths,
          salaryMin: rome.salaryMin,
          salaryMax: rome.salaryMax,
          growthOutlook: rome.growthOutlook,
        },
      },
      upsert: true,
    },
  }));

  const result = await Job.bulkWrite(operations);

  console.log(
    `✅ ROME seed terminé : ${result.upsertedCount} créés, ${result.modifiedCount} mis à jour`
  );
}
