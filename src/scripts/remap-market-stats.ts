import dotenv from 'dotenv';

import { connectDB, disconnectDB } from '@/config/db';
import { RomeMarketStat } from '@/models/RomeMarketStat';
import { mapMarketIndicator } from '@/services/market/mapper';
import { MarketIndicatorResponse } from '@/services/market/types';

dotenv.config({
  path: process.env.NODE_ENV === 'development' ? '.env.development' : '.env',
});

async function remapMarketStats() {
  const cursor = RomeMarketStat.find({ raw: { $exists: true } }).cursor();
  let processed = 0;
  let modified = 0;

  for await (const stat of cursor) {
    const raw = stat.raw as
      | {
          salary?: MarketIndicatorResponse;
          offers?: MarketIndicatorResponse;
          hires?: MarketIndicatorResponse;
          demanders?: MarketIndicatorResponse;
          tension?: MarketIndicatorResponse;
        }
      | undefined;

    await RomeMarketStat.updateOne(
      { _id: stat._id },
      {
        $set: {
          salary: mapMarketIndicator(raw?.salary),
          offers: mapMarketIndicator(raw?.offers),
          hires: mapMarketIndicator(raw?.hires),
          demanders: mapMarketIndicator(raw?.demanders),
          tension: mapMarketIndicator(raw?.tension),
        },
      }
    );

    processed += 1;
    modified += 1;

    if (processed % 250 === 0) {
      console.log(`[MARKET] Remapped ${processed} stats`);
    }
  }

  console.log(`[MARKET] Remap done: ${modified} stats updated`);
}

connectDB()
  .then(remapMarketStats)
  .then(disconnectDB)
  .catch(async (error) => {
    console.error('[MARKET] Remap failed', error);
    await disconnectDB().catch(() => undefined);
    process.exit(1);
  });
