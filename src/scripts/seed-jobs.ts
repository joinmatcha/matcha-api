import 'dotenv/config';

import { connectDB } from '@/config/db';
import { seedJobsV1 } from '@/seeds/seedJobs';
import { seedJobsV2 } from '@/seeds/seedJobsV2';

type SeedVersion = 'v1' | 'v2';

const SEEDERS: Record<SeedVersion, () => Promise<void>> = {
  v1: seedJobsV1,
  v2: seedJobsV2,
};

function getVersion(): SeedVersion {
  const arg = process.argv[2]?.toLowerCase();
  if (arg === 'v1' || arg === 'v2') return arg;
  return 'v2'; // default
}

(async () => {
  const version = getVersion();

  await connectDB();
  await SEEDERS[version]();

  console.log(`✅ Jobs seeded successfully (${version})`);
  process.exit(0);
})().catch((err) => {
  console.error('❌ Seed failed', err);
  process.exit(1);
});
