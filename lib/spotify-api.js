/**
 * Spotify Web API helpers with response shaping for the extension.
 * All text fields should pass through sanitizeDisplayText before DOM use.
 */

import { computeBackoffMs, isRetriableStatus } from './backoff.js';

const API_BASE = 'https://api.spotify.com/v1';

/**
 * @param {string} str
 * @returns {string}
 */
export function sanitizeDisplayText(str) {
  if (typeof str !== 'string') {
    return '';
  }
  return str.replace(/[<>]/g, '').slice(0, 500);
}

/**
 * @param {string} token
 * @param {string} path with leading slash
 * @param {Record<string, string|number|undefined>} [query]
 * @param {object} [opts]
 * @param {typeof fetch} [opts.fetchImpl]
 * @param {number} [opts.maxAttempts]
 * @returns {Promise<Response>}
 */
export async function spotifyGet(token, path, query, opts = {}) {
  const fetchImpl = opts.fetchImpl || globalThis.fetch.bind(globalThis);
  const maxAttempts = opts.maxAttempts ?? 4;
  const u = new URL(`${API_BASE}${path}`);
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        u.searchParams.set(k, String(v));
      }
    });
  }
  let lastErr;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const res = await fetchImpl(u.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      return res;
    }
    if (isRetriableStatus(res.status) && attempt < maxAttempts - 1) {
      const wait = computeBackoffMs(attempt);
      await new Promise((resolve) => {
        setTimeout(resolve, wait);
      });
      lastErr = res;
      // eslint-disable-next-line no-continue
      continue;
    }
    return res;
  }
  return lastErr;
}

/**
 * @param {string} token
 * @param {string} path
 * @param {object} body
 * @param {object} [opts]
 * @param {Record<string, string|number|undefined>} [opts.query]
 * @returns {Promise<Response>}
 */
export async function spotifyPut(token, path, body, opts = {}) {
  const fetchImpl = opts.fetchImpl || globalThis.fetch.bind(globalThis);
  const maxAttempts = opts.maxAttempts ?? 4;
  const u = new URL(`${API_BASE}${path}`);
  if (opts.query) {
    Object.entries(opts.query).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        u.searchParams.set(k, String(v));
      }
    });
  }
  const url = u.toString();
  let lastRes;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const res = await fetchImpl(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    lastRes = res;
    if (res.ok) {
      return res;
    }
    if (isRetriableStatus(res.status) && attempt < maxAttempts - 1) {
      const wait = computeBackoffMs(attempt);
      await new Promise((resolve) => {
        setTimeout(resolve, wait);
      });
      // eslint-disable-next-line no-continue
      continue;
    }
    return res;
  }
  return lastRes;
}

/**
 * @param {Response} res
 * @returns {Promise<object|null>}
 */
export async function parseJsonSafe(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
