/**
 * Service worker (Chrome) or background page (Firefox): token lifecycle,
 * Spotify API orchestration, and deduplication persistence.
 */

import { refreshTokensInExtension } from '../../lib/token-refresh.js';
import {
  spotifyGet,
  spotifyPut,
  parseJsonSafe,
  sanitizeDisplayText,
} from '../../lib/spotify-api.js';
import {
  pickCandidateTrack,
  fetchGenreSeedsFromApi,
  buildMergedGenres,
} from '../../lib/track-picker.js';
import {
  createEmptyDedupState,
  shouldRejectSelection,
  recordSuccessfulPlay,
} from '../../lib/dedup.js';

const STORAGE_KEYS = {
  clientId: 'sts_client_id',
  accessToken: 'sts_access_token',
  refreshToken: 'sts_refresh_token',
  expiresAt: 'sts_expires_at',
  dedup: 'sts_dedup_state',
  genreSeeds: 'sts_genre_seeds',
  genreSeedsAt: 'sts_genre_seeds_at',
};

const SESSION_URLS = [
  'http://127.0.0.1:8888/api/session',
  'http://localhost:8888/api/session',
];

const TOKEN_SKEW_MS = 60 * 1000;

function getApi() {
  return globalThis.browser || globalThis.chrome;
}

/**
 * @returns {Promise<object>}
 */
async function loadStorage() {
  return new Promise((resolve) => {
    getApi().storage.local.get(null, resolve);
  });
}

/**
 * @param {object} patch
 */
async function saveStorage(patch) {
  return new Promise((resolve) => {
    getApi().storage.local.set(patch, resolve);
  });
}

/**
 * @param {object} raw
 * @returns {object}
 */
function parseDedup(raw) {
  if (!raw || typeof raw !== 'object') {
    return createEmptyDedupState();
  }
  return {
    blockedUris: Array.isArray(raw.blockedUris) ? raw.blockedUris : [],
    playLog: Array.isArray(raw.playLog) ? raw.playLog : [],
    lastArtistId: raw.lastArtistId || null,
  };
}

/**
 * @returns {Promise<string>}
 */
async function getValidAccessToken() {
  const s = await loadStorage();
  const clientId = s[STORAGE_KEYS.clientId];
  const refreshToken = s[STORAGE_KEYS.refreshToken];
  const accessToken = s[STORAGE_KEYS.accessToken];
  const expiresAt = s[STORAGE_KEYS.expiresAt] || 0;

  if (!clientId || !refreshToken) {
    throw new Error('Not connected. Import a session from the local token server using the extension popup.');
  }

  if (accessToken && Date.now() < expiresAt - TOKEN_SKEW_MS) {
    return accessToken;
  }

  const data = await refreshTokensInExtension({
    clientId,
    refreshToken,
  });
  const nextAccess = data.access_token;
  const nextRefresh = data.refresh_token || refreshToken;
  const nextExpires = Date.now() + (data.expires_in * 1000);
  await saveStorage({
    [STORAGE_KEYS.accessToken]: nextAccess,
    [STORAGE_KEYS.refreshToken]: nextRefresh,
    [STORAGE_KEYS.expiresAt]: nextExpires,
  });
  return nextAccess;
}

/**
 * @param {string} token
 * @returns {Promise<{ premium: boolean, product: string }>}
 */
async function fetchProduct(token) {
  const res = await spotifyGet(token, '/me', undefined, {});
  const j = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(j?.error?.message || 'Could not read your Spotify profile.');
  }
  const product = j.product || 'free';
  return { premium: product === 'premium', product };
}

/**
 * @param {string} token
 * @returns {Promise<string|null>}
 */
async function resolveDeviceId(token) {
  const res = await spotifyGet(token, '/me/player/devices', undefined, {});
  const j = await parseJsonSafe(res);
  if (!res.ok) {
    return null;
  }
  const devices = j?.devices || [];
  if (!devices.length) {
    return null;
  }
  const active = devices.find((d) => d.is_active);
  if (active) {
    return active.id;
  }
  const computer = devices.find((d) => d.type === 'Computer');
  return computer?.id || devices[0].id;
}

/**
 * @param {string} token
 * @returns {Promise<boolean>}
 */
async function hasAnyDevice(token) {
  const id = await resolveDeviceId(token);
  return Boolean(id);
}

/**
 * @param {string} token
 * @param {string} uri
 * @param {string|null} deviceId
 * @returns {Promise<{ ok: boolean, status: number, body?: object }>}
 */
async function startPlayback(token, uri, deviceId) {
  const opts = deviceId ? { query: { device_id: deviceId } } : {};
  const res = await spotifyPut(token, '/me/player/play', { uris: [uri] }, opts);
  const body = await parseJsonSafe(res);
  return { ok: res.ok, status: res.status, body };
}

/**
 * @param {string} token
 * @param {string[]} mergedGenres
 * @param {object} dedup
 * @returns {Promise<{ uri: string, artistId: string|null, name: string }>}
 */
async function pickTrackRespectingDedup(token, mergedGenres, dedup) {
  const maxAttempts = 40;
  for (let i = 0; i < maxAttempts; i += 1) {
    const candidate = await pickCandidateTrack({
      token,
      mergedGenres,
    });
    if (!candidate) {
      // eslint-disable-next-line no-continue
      continue;
    }
    if (shouldRejectSelection(dedup, candidate.uri, candidate.artistId)) {
      // eslint-disable-next-line no-continue
      continue;
    }
    return candidate;
  }
  throw new Error('Could not find a fresh random track. Try again in a moment.');
}

/**
 * @returns {Promise<void>}
 */
async function ensureGenreSeeds(token) {
  const s = await loadStorage();
  const cached = s[STORAGE_KEYS.genreSeeds];
  const fetchedAt = s[STORAGE_KEYS.genreSeedsAt] || 0;
  const day = 24 * 60 * 60 * 1000;
  if (Array.isArray(cached) && cached.length && Date.now() - fetchedAt < day) {
    return;
  }
  const apiGenres = await fetchGenreSeedsFromApi(token, globalThis.fetch.bind(globalThis));
  const merged = buildMergedGenres(apiGenres);
  await saveStorage({
    [STORAGE_KEYS.genreSeeds]: merged,
    [STORAGE_KEYS.genreSeedsAt]: Date.now(),
  });
}

/**
 * @returns {Promise<object>}
 */
async function runTrueRandomFlow() {
  const token = await getValidAccessToken();
  const { premium } = await fetchProduct(token);
  if (!premium) {
    return {
      ok: false,
      code: 'PREMIUM_REQUIRED',
      message: 'Spotify Premium is required for API playback control. Upgrade or use Premium to play tracks from this extension.',
    };
  }

  const deviceOk = await hasAnyDevice(token);
  if (!deviceOk) {
    return {
      ok: false,
      code: 'NO_DEVICE',
      message: 'No Spotify device found. Open the Web Player or desktop app and start playback once, then try again.',
    };
  }

  await ensureGenreSeeds(token);
  const s = await loadStorage();
  const mergedGenres = s[STORAGE_KEYS.genreSeeds] || buildMergedGenres([]);
  let dedup = parseDedup(s[STORAGE_KEYS.dedup]);

  const deviceId = await resolveDeviceId(token);

  const maxPlayAttempts = 10;
  let lastFailure = null;

  for (let p = 0; p < maxPlayAttempts; p += 1) {
    const candidate = await pickTrackRespectingDedup(token, mergedGenres, dedup);
    const playResult = await startPlayback(token, candidate.uri, deviceId);

    if (playResult.ok) {
      dedup = recordSuccessfulPlay(dedup, candidate.uri, candidate.artistId);
      await saveStorage({
        [STORAGE_KEYS.dedup]: dedup,
      });
      return {
        ok: true,
        trackName: sanitizeDisplayText(candidate.name),
        uri: candidate.uri,
      };
    }

    lastFailure = playResult;

    if (playResult.status === 404) {
      return {
        ok: false,
        code: 'NO_ACTIVE_PLAYER',
        message: 'Playback could not start. Select the Web Player as your device in Spotify Connect.',
      };
    }

    if (playResult.status === 403) {
      const reason = playResult.body?.error?.reason;
      if (reason === 'PREMIUM_REQUIRED') {
        return {
          ok: false,
          code: 'PREMIUM_REQUIRED',
          message: 'This account cannot start playback via the API. Premium is usually required.',
        };
      }
    }

    if (playResult.status === 429 || playResult.status === 503) {
      return {
        ok: false,
        code: 'SERVICE_BUSY',
        message: 'Spotify rate limited or temporarily unavailable. Wait a few seconds and use the retry action.',
        retry: true,
      };
    }

    const transient = playResult.status >= 500 || playResult.status === 429;
    if (playResult.status === 403 || playResult.status === 400) {
      // try another random track when content is not playable in this market
      // eslint-disable-next-line no-continue
      continue;
    }

    if (transient) {
      return {
        ok: false,
        code: 'PLAYBACK_FAILED',
        message: playResult.body?.error?.message || 'Temporary Spotify error.',
        retry: true,
      };
    }

    return {
      ok: false,
      code: 'PLAYBACK_FAILED',
      message: playResult.body?.error?.message || `Playback failed (${playResult.status}).`,
      retry: false,
    };
  }

  const msg = lastFailure?.body?.error?.message || 'Could not play a track after several attempts. Try again.';
  return {
    ok: false,
    code: 'PLAYBACK_FAILED',
    message: msg,
    retry: true,
  };
}

/**
 * @returns {Promise<object>}
 */
async function importSessionFromServer() {
  let lastErr;
  for (const url of SESSION_URLS) {
    try {
      const res = await fetch(url, { method: 'GET' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        lastErr = new Error(data.message || data.error || `HTTP ${res.status}`);
        // eslint-disable-next-line no-continue
        continue;
      }
      if (!data.refresh_token || !data.client_id) {
        lastErr = new Error('Server session missing tokens. Complete OAuth at /login first.');
        // eslint-disable-next-line no-continue
        continue;
      }
      await saveStorage({
        [STORAGE_KEYS.clientId]: data.client_id,
        [STORAGE_KEYS.accessToken]: data.access_token,
        [STORAGE_KEYS.refreshToken]: data.refresh_token,
        [STORAGE_KEYS.expiresAt]: data.expires_at || 0,
      });
      return { ok: true };
    } catch (e) {
      lastErr = e;
    }
  }
  return {
    ok: false,
    error: lastErr ? lastErr.message : 'Could not reach local token server.',
  };
}

getApi().runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'TRUE_RANDOM_PLAY') {
    runTrueRandomFlow()
      .then(sendResponse)
      .catch((e) => sendResponse({ ok: false, code: 'ERROR', message: e.message || String(e) }));
    return true;
  }
  if (message?.type === 'IMPORT_SESSION') {
    importSessionFromServer()
      .then(sendResponse)
      .catch((e) => sendResponse({ ok: false, error: e.message }));
    return true;
  }
  if (message?.type === 'GET_STATUS') {
    loadStorage()
      .then((st) => {
        const connected = Boolean(st[STORAGE_KEYS.refreshToken] && st[STORAGE_KEYS.clientId]);
        sendResponse({ ok: true, connected });
      })
      .catch(() => sendResponse({ ok: false }));
    return true;
  }
  return false;
});
