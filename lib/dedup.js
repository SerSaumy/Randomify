/**
 * Anti repetition rules for track and artist selection.
 * Blocks replay of URIs in the recent window and the same artist twice in a row.
 */

export const MAX_BLOCKED_URIS = 100;
export const MAX_HISTORY_BEFORE_RESET = 500;

/**
 * @typedef {object} DedupState
 * @property {string[]} blockedUris Last N track URIs that must not repeat.
 * @property {string[]} playLog Append only log; cleared when it exceeds MAX_HISTORY_BEFORE_RESET.
 * @property {string|null} lastArtistId Spotify artist id for back to back check.
 */

/**
 * @returns {DedupState}
 */
export function createEmptyDedupState() {
  return {
    blockedUris: [],
    playLog: [],
    lastArtistId: null,
  };
}

/**
 * @param {DedupState} state
 * @param {string} trackUri
 * @param {string|null} artistId
 * @returns {boolean}
 */
export function shouldRejectSelection(state, trackUri, artistId) {
  if (state.blockedUris.includes(trackUri)) {
    return true;
  }
  if (artistId && state.lastArtistId && artistId === state.lastArtistId) {
    return true;
  }
  return false;
}

/**
 * Records a successful play and returns the next immutable state.
 * @param {DedupState} state
 * @param {string} trackUri
 * @param {string|null} artistId
 * @returns {DedupState}
 */
export function recordSuccessfulPlay(state, trackUri, artistId) {
  const { blockedUris, playLog } = state;
  const nextBlocked = [...blockedUris, trackUri];
  if (nextBlocked.length > MAX_BLOCKED_URIS) {
    nextBlocked.splice(0, nextBlocked.length - MAX_BLOCKED_URIS);
  }
  let nextLog = [...playLog, trackUri];
  if (nextLog.length > MAX_HISTORY_BEFORE_RESET) {
    nextLog = [];
    return {
      blockedUris: [],
      playLog: nextLog,
      lastArtistId: artistId || null,
    };
  }
  return {
    blockedUris: nextBlocked,
    playLog: nextLog,
    lastArtistId: artistId || null,
  };
}
