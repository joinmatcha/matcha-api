import dotenv from 'dotenv';
import cron from 'node-cron';

import { connectDB, disconnectDB } from '@/config/db';
import { RomeSyncRun } from '@/models/RomeSyncRun';
import { RomeSyncProgress, RomeSyncService } from '@/services/rome/sync';

dotenv.config({
  path: process.env.NODE_ENV === 'development' ? '.env.development' : '.env',
});

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h${String(minutes).padStart(2, '0')}m${String(seconds).padStart(2, '0')}s`;
  }

  return `${minutes}m${String(seconds).padStart(2, '0')}s`;
}

function createProgressReporter() {
  let lastLogAt = 0;

  return (progress: RomeSyncProgress) => {
    const now = progress.at.getTime();
    const shouldLog =
      progress.step !== 'fetch_metiers' || now - lastLogAt >= 15_000;

    if (!shouldLog) return;
    lastLogAt = now;

    const elapsedMs = now - progress.startedAt.getTime();
    const fetched = progress.fetchedMetiers ?? 0;
    const total = progress.uniqueMetiers ?? 0;
    const percent = total > 0 ? Math.round((fetched / total) * 1000) / 10 : 0;
    const ratePerMinute = elapsedMs > 0 ? fetched / (elapsedMs / 60_000) : 0;
    const remaining = Math.max(total - fetched, 0);
    const etaMs =
      ratePerMinute > 0 ? (remaining / ratePerMinute) * 60_000 : undefined;

    if (progress.step === 'list_appellations') {
      console.log('[ROME] Listing appellations...');
      return;
    }

    if (progress.step === 'fetch_metiers') {
      console.log(
        `[ROME] ${fetched}/${total} metiers (${percent}%) | fiches ${progress.fetchedFiches ?? 0} | errors ${progress.errors ?? 0} | current ${progress.currentCode ?? '-'} | elapsed ${formatDuration(elapsedMs)} | eta ${etaMs ? formatDuration(etaMs) : '-'} | ${ratePerMinute.toFixed(1)} metiers/min`
      );
      return;
    }

    console.log(
      `[ROME] Step ${progress.step} | elapsed ${formatDuration(elapsedMs)} | metiers ${fetched}/${total} | errors ${progress.errors ?? 0}`
    );
  };
}

async function runOnce() {
  const result = await RomeSyncService.runSync({
    type: 'script',
    onProgress: createProgressReporter(),
  });
  const run = await RomeSyncRun.findById(result.runId).lean();

  console.log(
    `[ROME] Sync ${run?.status ?? result.status}: ${run?.upsertedMetiers ?? 0} created, ${run?.updatedMetiers ?? 0} updated, ${run?.deactivatedMetiers ?? 0} deactivated, ${run?.errors.length ?? 0} errors`
  );

  if (run?.status === 'failed') {
    process.exitCode = 1;
  }
}

async function start() {
  await connectDB();

  const isCronMode = process.argv.includes('--cron');

  if (!isCronMode) {
    await runOnce();
    await disconnectDB();
    return;
  }

  // 03:00 UTC on the first day of each month.
  cron.schedule('0 3 1 * *', async () => {
    console.log(`[ROME] Monthly sync started at ${new Date().toISOString()}`);
    await runOnce();
  });

  console.log('[ROME] Monthly sync scheduler started');
}

start().catch(async (error) => {
  console.error('[ROME] Sync failed', error);
  await disconnectDB().catch(() => undefined);
  process.exit(1);
});
