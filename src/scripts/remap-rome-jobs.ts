import dotenv from 'dotenv';

import { connectDB, disconnectDB } from '@/config/db';
import { RomeMetier } from '@/models/RomeMetier';
import { buildRomeMetierUpdate } from '@/services/rome/mapper';
import { RomeFicheMetierApi, RomeMetierApi } from '@/services/rome/types';

dotenv.config({
  path: process.env.NODE_ENV === 'development' ? '.env.development' : '.env',
});

async function remapRomeJobs() {
  const cursor = RomeMetier.find({
    'raw.metier': { $exists: true },
  })
    .select('code raw appellations')
    .cursor();

  let processed = 0;
  let modified = 0;
  const now = new Date();

  for await (const job of cursor) {
    const metier = job.raw?.metier as RomeMetierApi | undefined;
    if (!metier) continue;

    const ficheMetier = job.raw?.ficheMetier as RomeFicheMetierApi | undefined;
    const update = buildRomeMetierUpdate(metier, ficheMetier, [], now);

    await RomeMetier.updateOne({ _id: job._id }, { $set: update });

    processed += 1;
    modified += 1;

    if (processed % 100 === 0) {
      console.log(`[ROME] Remapped ${processed} metiers`);
    }
  }

  console.log(`[ROME] Remap done: ${modified} metiers updated`);
}

connectDB()
  .then(remapRomeJobs)
  .then(disconnectDB)
  .catch(async (error) => {
    console.error('[ROME] Remap failed', error);
    await disconnectDB().catch(() => undefined);
    process.exit(1);
  });
