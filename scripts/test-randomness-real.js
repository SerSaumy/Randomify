/**
 * Optional local distribution report for generated search queries.
 */

import { pickRandomStrategy, randomMarket } from '../lib/randomness.js';
import { buildRandomSearchQuery } from '../lib/track-picker.js';

const CALLS = 500;

async function main() {
  const strategyCounts = new Map();
  const marketCounts = new Map();

  for (let i = 0; i < CALLS; i += 1) {
    const s = pickRandomStrategy();
    strategyCounts.set(s, (strategyCounts.get(s) || 0) + 1);
    const m = randomMarket();
    marketCounts.set(m, (marketCounts.get(m) || 0) + 1);
  }

  console.log('Strategy spread (synthetic draws,', CALLS, 'samples)');
  [...strategyCounts.entries()].sort((a, b) => a[0].localeCompare(b[0])).forEach(([k, v]) => {
    console.log(`  ${k}: ${v}`);
  });

  console.log('\nMarket spread (synthetic draws, top 15 by count)');
  [...marketCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([k, v]) => {
      console.log(`  ${k}: ${v}`);
    });

  console.log('\nGenerated random search queries (', CALLS, ')');
  const queryCounts = new Map();
  for (let i = 0; i < CALLS; i += 1) {
    const query = buildRandomSearchQuery();
    queryCounts.set(query, (queryCounts.get(query) || 0) + 1);
  }
  const dupes = [...queryCounts.values()].filter((c) => c > 1).length;
  console.log('Unique queries:', queryCounts.size, 'duplicate queries in batch:', dupes);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
