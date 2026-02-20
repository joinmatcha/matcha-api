import { JobDocument } from '@/models/Job';
import { Swipe } from '@/models/Swipe';

const LIKE_WEIGHT = 1;
const DISLIKE_WEIGHT = -0.5;

function addScore(map: Map<string, number>, key: string, weight: number) {
  map.set(key, (map.get(key) ?? 0) + weight);
}

function topEntries(map: Map<string, number>, limit: number) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .filter(([, score]) => score > 0)
    .slice(0, limit)
    .map(([key, score]) => ({ key, score: Math.round(score * 10) / 10 }));
}

export async function computePreferences(userId: string) {
  const swipes = await Swipe.find({ userId })
    .sort({ swipedAt: -1 })
    .populate<{ jobId: JobDocument }>('jobId');

  const sectors = new Map<string, number>();
  const competences = new Map<string, number>();
  const tags = new Map<string, number>();
  const workConditions = new Map<string, number>();

  const recentLikes: { id: string; title: string; sector: string }[] = [];
  let totalLikes = 0;
  let totalDislikes = 0;

  for (const swipe of swipes) {
    const job = swipe.jobId as JobDocument;
    if (!job) continue;

    const weight = swipe.action === 'like' ? LIKE_WEIGHT : DISLIKE_WEIGHT;

    if (swipe.action === 'like') {
      totalLikes++;
      if (recentLikes.length < 10) {
        recentLikes.push({
          id: job._id.toString(),
          title: job.title,
          sector: job.sector ?? '',
        });
      }
    } else {
      totalDislikes++;
    }

    if (job.sector) addScore(sectors, job.sector, weight);
    for (const c of job.competences) addScore(competences, c, weight);
    for (const t of job.tags) addScore(tags, t, weight);
    for (const w of job.workConditions) addScore(workConditions, w, weight);
  }

  return {
    totalLikes,
    totalDislikes,
    topSectors: topEntries(sectors, 5),
    topCompetences: topEntries(competences, 5),
    topTags: topEntries(tags, 5),
    topWorkConditions: topEntries(workConditions, 5),
    recentLikes,
  };
}
