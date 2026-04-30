import { RomeMetierDocument } from '@/models/RomeMetier';
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
    .populate<{ jobId: RomeMetierDocument }>({
      path: 'jobId',
      select: '_id label domain skills themes sectors workContexts',
      options: { lean: true },
    })
    .lean();

  const sectors = new Map<string, number>();
  const competences = new Map<string, number>();
  const tags = new Map<string, number>();
  const workConditions = new Map<string, number>();

  const recentLikes: { id: string; title: string; sector: string }[] = [];
  let totalLikes = 0;
  let totalDislikes = 0;

  for (const swipe of swipes) {
    const job = swipe.jobId as RomeMetierDocument;
    if (!job) continue;

    const weight = swipe.action === 'like' ? LIKE_WEIGHT : DISLIKE_WEIGHT;

    if (swipe.action === 'like') {
      totalLikes++;
      if (recentLikes.length < 10) {
        recentLikes.push({
          id: job._id.toString(),
          title: job.label,
          sector: job.domain?.label ?? job.domain?.grandDomain?.label ?? '',
        });
      }
    } else {
      totalDislikes++;
    }

    const sector = job.domain?.label ?? job.domain?.grandDomain?.label;
    if (sector) addScore(sectors, sector, weight);
    for (const skill of job.skills) addScore(competences, skill.label, weight);
    for (const theme of job.themes) {
      if (theme.label) addScore(tags, theme.label, weight);
    }
    for (const sectorItem of job.sectors) {
      if (sectorItem.label) addScore(tags, sectorItem.label, weight);
    }
    for (const context of job.workContexts) {
      addScore(workConditions, context.label, weight);
    }
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
