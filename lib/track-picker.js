/**
 * Chooses a random track using Layer 1 to 3 strategies with equal probability.
 * Layer 4 deduplication is applied by the caller using dedup.js.
 */

import {
  pickRandomStrategy,
  randomSearchOffset,
  randomMarket,
  pickRandomGenreSeeds,
  mergeGenreSeeds,
  randomSearchQuery,
  STRATEGIES,
} from './randomness.js';
import { spotifyGet, parseJsonSafe } from './spotify-api.js';

/**
 * @param {string} token
 * @param {typeof fetch} fetchImpl
 * @returns {Promise<string[]>}
 */
export async function fetchGenreSeedsFromApi(token, fetchImpl) {
  const res = await spotifyGet(token, '/recommendations/available-genre-seeds', undefined, { fetchImpl });
  const j = await parseJsonSafe(res);
  if (!res.ok || !j?.genres || !Array.isArray(j.genres)) {
    return [];
  }
  return j.genres;
}

/**
 * @param {object} track
 * @returns {{ uri: string, artistId: string|null, name: string }|null}
 */
function normalizeTrack(track) {
  if (!track?.uri || !track.uri.startsWith('spotify:track:')) {
    return null;
  }
  const name = typeof track.name === 'string' ? track.name : '';
  const artistId = track.artists?.[0]?.id || null;
  return { uri: track.uri, artistId, name };
}

/**
 * @param {object} json
 * @returns {{ uri: string, artistId: string|null, name: string }|null}
 */
function firstTrackFromSearch(json) {
  const items = json?.tracks?.items;
  if (!items?.length) {
    return null;
  }
  return normalizeTrack(items[0]);
}

/**
 * @param {object} json
 * @returns {{ uri: string, artistId: string|null, name: string }|null}
 */
function firstTrackFromRecommendations(json) {
  const tracks = json?.tracks;
  if (!tracks?.length) {
    return null;
  }
  return normalizeTrack(tracks[0]);
}

/**
 * @param {string} token
 * @param {string[]} mergedGenres
 * @param {typeof fetch} fetchImpl
 * @returns {Promise<object|null>}
 */
async function pickFromRecommendations(token, mergedGenres, fetchImpl) {
  const seeds = pickRandomGenreSeeds(mergedGenres, 3);
  if (!seeds.length) {
    return null;
  }
  const res = await spotifyGet(
    token,
    '/recommendations',
    {
      seed_genres: seeds.join(','),
      limit: 1,
    },
    { fetchImpl },
  );
  const j = await parseJsonSafe(res);
  if (!res.ok || !j) {
    return null;
  }
  return firstTrackFromRecommendations(j);
}

/**
 * @param {string} token
 * @param {string} q
 * @param {string|undefined} market
 * @param {typeof fetch} fetchImpl
 * @returns {Promise<object|null>}
 */
async function pickFromSearch(token, q, market, fetchImpl) {
  const offset = randomSearchOffset();
  const query = {
    q,
    type: 'track',
    limit: 1,
    offset,
  };
  if (market) {
    query.market = market;
  }
  const res = await spotifyGet(token, '/search', query, { fetchImpl });
  const j = await parseJsonSafe(res);
  if (!res.ok || !j) {
    return null;
  }
  return firstTrackFromSearch(j);
}

/**
 * Returns one candidate track or null if the API returned nothing usable.
 * @param {object} ctx
 * @param {string} ctx.token
 * @param {string[]} ctx.mergedGenres
 * @param {typeof fetch} [ctx.fetchImpl]
 * @returns {Promise<{ uri: string, artistId: string|null, name: string }|null>}
 */
export async function pickCandidateTrack(ctx) {
  const { token, mergedGenres, fetchImpl } = ctx;
  const strategy = pickRandomStrategy();

  if (strategy === STRATEGIES.STRATEGY_RECOMMENDATIONS) {
    const t = await pickFromRecommendations(token, mergedGenres, fetchImpl);
    return t;
  }

  const q = randomSearchQuery();
  if (strategy === STRATEGIES.STRATEGY_MARKET_SEARCH) {
    const m = randomMarket();
    return pickFromSearch(token, q, m, fetchImpl);
  }

  return pickFromSearch(token, q, undefined, fetchImpl);
}

/**
 * Builds merged genre list once per session refresh.
 * @param {string[]} apiGenres
 * @returns {string[]}
 */
export function buildMergedGenres(apiGenres) {
  return mergeGenreSeeds(apiGenres || []);
}
