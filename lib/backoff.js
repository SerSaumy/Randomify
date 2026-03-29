/**
 * Exponential backoff with full jitter for Spotify rate limits and transient errors.
 */

import { secureRandomUnit } from './randomness.js';

const BASE_MS = 500;
const MAX_MS = 32000;

/**
 * @param {number} attempt 0 based
 * @returns {number} milliseconds to wait
 */
export function computeBackoffMs(attempt) {
  const cap = Math.min(MAX_MS, BASE_MS * 2 ** attempt);
  return Math.floor(secureRandomUnit() * cap);
}

/**
 * @param {number} status HTTP status
 * @returns {boolean}
 */
export function isRetriableStatus(status) {
  return status === 429 || status === 503 || status === 502 || status === 504;
}
