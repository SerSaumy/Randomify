/**
 * Optional live API distribution report. Requires a valid access token.
 * Reads SPOTIFY_ACCESS_TOKEN from the environment, or tokens from server/data/tokens.json
 * after you complete OAuth. Does not ship tokens in the repository.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { pickRandomStrategy, randomMarket } from '../lib/randomness.js';
import { pickCandidateTrack, buildMergedGenres, fetchGenreSeedsFromApi } from '../lib/track-picker.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
dotenv.config({ path: path.join(root, '.env') });

const TOKEN_PATH = path.join(root, 'server', 'data', 'tokens.json');
const CALLS = 500;

function loadToken() {
  if (process.env.SPOTIFY_ACCESS_TOKEN) {
    return process.env.SPOTIFY_ACCESS_TOKEN;
  }
  try {
    const raw = fs.readFileSync(TOKEN_PATH, 'utf8');
    const j = JSON.parse(raw);
    return j.access_token;
  } catch {
    return null;
  }
}

async function main() {
  const token = loadToken();
  if (!token) {
    console.error('Set SPOTIFY_ACCESS_TOKEN or complete OAuth so server/data/tokens.json exists.');
    process.exit(1);
  }

  const apiGenres = await fetchGenreSeedsFromApi(token, globalThis.fetch.bind(globalThis));
  const merged = buildMergedGenres(apiGenres);

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

  console.log('\nLive pickCandidateTrack calls (', CALLS, ')');
  const uriCounts = new Map();
  for (let i = 0; i < CALLS; i += 1) {
    const t = await pickCandidateTrack({ token, mergedGenres: merged });
    if (t?.uri) {
      uriCounts.set(t.uri, (uriCounts.get(t.uri) || 0) + 1);
    }
  }
  const dupes = [...uriCounts.values()].filter((c) => c > 1).length;
  console.log('Unique tracks:', uriCounts.size, 'duplicate URIs in batch:', dupes);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
