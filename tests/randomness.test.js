/**
 * Distribution smoke tests for strategy and market selection.
 */

import {
  describe,
  test,
  expect,
} from '@jest/globals';
import {
  pickRandomStrategy,
  randomMarket,
  STRATEGIES,
} from '../lib/randomness.js';
import { SPOTIFY_MARKET_CODES } from '../lib/markets-data.js';

function countBuckets(iterations, picker) {
  const map = new Map();
  for (let i = 0; i < iterations; i += 1) {
    const key = picker();
    map.set(key, (map.get(key) || 0) + 1);
  }
  return map;
}

describe('randomness distribution', () => {
  test('strategy frequencies stay within 3x of expectation over 1000 draws', () => {
    const n = 1000;
    const buckets = countBuckets(n, pickRandomStrategy);
    const expected = n / 3;
    const keys = [
      STRATEGIES.STRATEGY_SEARCH,
      STRATEGIES.STRATEGY_RECOMMENDATIONS,
      STRATEGIES.STRATEGY_MARKET_SEARCH,
    ];
    keys.forEach((k) => {
      const c = buckets.get(k) || 0;
      expect(c).toBeLessThanOrEqual(expected * 3);
      expect(c).toBeGreaterThan(0);
    });
  });

  test('market codes stay within 3x of uniform expectation across the full list', () => {
    const n = 30000;
    const buckets = countBuckets(n, randomMarket);
    const expected = n / SPOTIFY_MARKET_CODES.length;
    SPOTIFY_MARKET_CODES.forEach((code) => {
      const c = buckets.get(code) || 0;
      expect(c).toBeLessThanOrEqual(Math.ceil(expected * 3));
    });
  });
});
