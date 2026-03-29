/**
 * Builds randomized Spotify search query strings for DOM-driven playback flow.
 */

import {
  pickRandomStrategy,
  pickRandomGenreSeeds,
  mergeGenreSeeds,
  randomSearchQuery,
  STRATEGIES,
  randomInt,
} from './randomness.js';

function quoteIfNeeded(value) {
  return value.includes(' ') ? `"${value}"` : value;
}

/**
 * @param {string[]} genrePool
 * @returns {string}
 */
function buildGenreYearQuery(genrePool) {
  const seeds = pickRandomGenreSeeds(genrePool, 1);
  const genre = seeds[0] || 'indie';
  const start = 1960 + randomInt(60);
  const span = 3 + randomInt(8);
  const end = Math.min(2025, start + span);
  return `genre:${quoteIfNeeded(genre)} year:${start}-${end}`;
}

/**
 * Returns a search query string for URL navigation.
 * @returns {string}
 */
export function buildRandomSearchQuery() {
  const strategy = pickRandomStrategy();
  if (strategy === STRATEGIES.STRATEGY_RECOMMENDATIONS) {
    return buildGenreYearQuery(mergeGenreSeeds([]));
  }

  const base = randomSearchQuery().trim();
  if (strategy === STRATEGIES.STRATEGY_MARKET_SEARCH) {
    return `${base} year:${1980 + randomInt(45)}-${1985 + randomInt(40)}`.trim();
  }

  return base || 'a';
}
