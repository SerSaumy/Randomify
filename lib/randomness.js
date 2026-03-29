/**
 * Multi layer random selection helpers used by the background worker.
 * Strategies are chosen with equal probability, then Layer 4 filters in the caller.
 */

import { SPOTIFY_MARKET_CODES } from './markets-data.js';
import { EXTRA_GENRE_SEEDS } from './genre-seeds-extra.js';
import { DEFAULT_SPOTIFY_GENRE_SEEDS } from './genre-seeds-default.js';

const STRATEGY_SEARCH = 'search';
const STRATEGY_RECOMMENDATIONS = 'recommendations';
const STRATEGY_MARKET_SEARCH = 'market_search';

/**
 * Cryptographic quality when available; falls back to Math.random for tests.
 * @returns {number} in [0, 1)
 */
export function secureRandomUnit() {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] / 2 ** 32;
  }
  return Math.random();
}

/**
 * @param {number} max exclusive
 * @returns {number} integer in [0, max)
 */
export function randomInt(max) {
  if (max <= 0) return 0;
  return Math.floor(secureRandomUnit() * max);
}

/**
 * @template T
 * @param {T[]} arr
 * @returns {T}
 */
export function pickUniform(arr) {
  if (!arr.length) {
    throw new Error('pickUniform: empty array');
  }
  return arr[randomInt(arr.length)];
}

/**
 * Layer 1: random 1 to 2 Unicode code points as search query.
 * @returns {string}
 */
export function randomSearchQuery() {
  const len = secureRandomUnit() < 0.5 ? 1 : 2;
  let out = '';
  for (let i = 0; i < len; i += 1) {
    const codePoint = 0x20 + randomInt(0x10fff0 - 0x20);
    out += String.fromCodePoint(codePoint);
  }
  return out;
}

/**
 * Random offset for search paging (Spotify caps offset; we stay within 0 to 1000).
 * @returns {number}
 */
export function randomSearchOffset() {
  return randomInt(1001);
}

/**
 * Merge API genre seeds with extras, dedupe, equal weight.
 * @param {string[]} apiSeeds
 * @returns {string[]}
 */
export function mergeGenreSeeds(apiSeeds) {
  const set = new Set([...DEFAULT_SPOTIFY_GENRE_SEEDS, ...EXTRA_GENRE_SEEDS, ...apiSeeds]);
  return [...set];
}

/**
 * @param {string[]} genreSeeds
 * @returns {string[]}
 */
export function pickRandomGenreSeeds(genreSeeds, count = 2) {
  const copy = [...genreSeeds];
  const out = [];
  const n = Math.min(count, copy.length);
  for (let i = 0; i < n; i += 1) {
    const idx = randomInt(copy.length);
    out.push(copy[idx]);
    copy.splice(idx, 1);
  }
  return out;
}

/**
 * @returns {string} ISO market code
 */
export function randomMarket() {
  return pickUniform(SPOTIFY_MARKET_CODES);
}

/**
 * @returns {typeof STRATEGY_SEARCH | typeof STRATEGY_RECOMMENDATIONS | typeof STRATEGY_MARKET_SEARCH}
 */
export function pickRandomStrategy() {
  const r = secureRandomUnit();
  if (r < 1 / 3) return STRATEGY_SEARCH;
  if (r < 2 / 3) return STRATEGY_RECOMMENDATIONS;
  return STRATEGY_MARKET_SEARCH;
}

export const STRATEGIES = {
  STRATEGY_SEARCH,
  STRATEGY_RECOMMENDATIONS,
  STRATEGY_MARKET_SEARCH,
};
