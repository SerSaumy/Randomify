/**
 * Anti repetition rules for tracks and artists.
 */

import {
  describe,
  test,
  expect,
} from '@jest/globals';
import {
  createEmptyDedupState,
  shouldRejectSelection,
  recordSuccessfulPlay,
  MAX_BLOCKED_URIS,
} from '../lib/dedup.js';

describe('deduplication', () => {
  test('no track repeats while it remains inside the blocked window for 100 sequential unique plays', () => {
    let state = createEmptyDedupState();
    const seen = new Set();
    for (let i = 0; i < 100; i += 1) {
      const uri = `spotify:track:${i}`;
      const artist = `artist-${i}`;
      expect(shouldRejectSelection(state, uri, artist)).toBe(false);
      state = recordSuccessfulPlay(state, uri, artist);
      expect(seen.has(uri)).toBe(false);
      seen.add(uri);
    }
  });

  test('blocks the same artist back to back', () => {
    let state = createEmptyDedupState();
    state = recordSuccessfulPlay(state, 'spotify:track:a', 'artist-1');
    expect(shouldRejectSelection(state, 'spotify:track:b', 'artist-1')).toBe(true);
    expect(shouldRejectSelection(state, 'spotify:track:b', 'artist-2')).toBe(false);
  });

  test('rejects a uri that is still listed as blocked', () => {
    let state = createEmptyDedupState();
    state = recordSuccessfulPlay(state, 'spotify:track:dup', 'artist-a');
    expect(shouldRejectSelection(state, 'spotify:track:dup', 'artist-b')).toBe(true);
  });

  test('trimming keeps blocked list at the configured maximum size', () => {
    let state = createEmptyDedupState();
    for (let i = 0; i < MAX_BLOCKED_URIS + 5; i += 1) {
      state = recordSuccessfulPlay(state, `spotify:track:${i}`, `a${i}`);
    }
    expect(state.blockedUris.length).toBeLessThanOrEqual(MAX_BLOCKED_URIS);
  });
});
