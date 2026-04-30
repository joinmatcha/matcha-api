import dotenv from 'dotenv';

import { connectDB, disconnectDB } from '@/config/db';
import {
  MarketStatsSyncService,
  MarketSyncProgress,
} from '@/services/market/sync';

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

function parseLimitArg() {
  const arg = process.argv.find((item) => item.startsWith('--limit='));
  if (!arg) return undefined;

  const limit = Number(arg.split('=')[1]);
  return Number.isFinite(limit) && limit > 0 ? limit : undefined;
}

function createProgressReporter() {
  let lastLogAt = 0;

  return (progress: MarketSyncProgress) => {
    const now = progress.at.getTime();
    const shouldLog =
      progress.step !== 'fetch_market_stats' || now - lastLogAt >= 10_000;

    if (!shouldLog) return;
    lastLogAt = now;

    const elapsedMs = now - progress.startedAt.getTime();
    const percent =
      progress.total > 0
        ? Math.round((progress.fetched / progress.total) * 1000) / 10
        : 0;
    const ratePerMinute =
      elapsedMs > 0 ? progress.fetched / (elapsedMs / 60_000) : 0;
    const remaining = Math.max(progress.total - progress.fetched, 0);
    const etaMs =
      ratePerMinute > 0 ? (remaining / ratePerMinute) * 60_000 : undefined;

    console.log(
      `[MARKET] ${progress.fetched}/${progress.total} metiers (${percent}%) | updated ${progress.updated} | errors ${progress.errors} | current ${progress.currentCode ?? '-'} | step ${progress.step} | elapsed ${formatDuration(elapsedMs)} | eta ${etaMs ? formatDuration(etaMs) : '-'}`
    );
  };
}

async function start() {
  await connectDB();

  const result = await MarketStatsSyncService.runSync({
    limit: parseLimitArg(),
    onProgress: createProgressReporter(),
  });

  console.log(
    `[MARKET] Sync ${result.status}: ${result.updated} updated, ${result.errors.length} errors`
  );

  if (result.errors.length > 0) {
    console.log('[MARKET] First errors:', result.errors.slice(0, 10));
  }

  await disconnectDB();
}

start().catch(async (error) => {
  console.error('[MARKET] Sync failed', error);
  await disconnectDB().catch(() => undefined);
  process.exit(1);
});
