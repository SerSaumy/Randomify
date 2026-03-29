/**
 * Mocked Spotify HTTP behavior: status codes, refresh, and backoff paths.
 */

import {
  jest,
  describe,
  test,
  expect,
} from '@jest/globals';
import { spotifyGet, spotifyPut, parseJsonSafe } from '../lib/spotify-api.js';
import { refreshTokensInExtension } from '../lib/token-refresh.js';

function mockSequence(responses) {
  let i = 0;
  return jest.fn(() => {
    const r = responses[Math.min(i, responses.length - 1)];
    i += 1;
    return Promise.resolve(r);
  });
}

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

describe('spotify API helpers', () => {
  test('surfaces 401 without throwing inside spotifyGet', async () => {
    const fetchImpl = mockSequence([jsonResponse(401, { error: { message: 'Unauthorized' } })]);
    const res = await spotifyGet('tok', '/me', undefined, { fetchImpl, maxAttempts: 1 });
    expect(res.status).toBe(401);
  });

  test('retries 429 up to the attempt budget', async () => {
    jest.useFakeTimers();
    const fetchImpl = jest.fn()
      .mockResolvedValueOnce(jsonResponse(429, {}))
      .mockResolvedValueOnce(jsonResponse(200, { id: 'u' }));
    const p = spotifyGet('tok', '/me', undefined, { fetchImpl, maxAttempts: 3 });
    await jest.runAllTimersAsync();
    const res = await p;
    expect(res.status).toBe(200);
    expect(fetchImpl.mock.calls.length).toBeGreaterThanOrEqual(2);
    jest.useRealTimers();
  });

  test('spotifyPut returns 403 payload for premium errors', async () => {
    const fetchImpl = mockSequence([
      jsonResponse(403, { error: { reason: 'PREMIUM_REQUIRED' } }),
    ]);
    const res = await spotifyPut('tok', '/me/player/play', { uris: ['spotify:track:1'] }, { fetchImpl, maxAttempts: 1 });
    const body = await parseJsonSafe(res);
    expect(res.status).toBe(403);
    expect(body.error.reason).toBe('PREMIUM_REQUIRED');
  });

  test('refreshTokensInExtension swaps access tokens', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        access_token: 'next',
        expires_in: 3600,
        refresh_token: 'r2',
      }),
    });
    const out = await refreshTokensInExtension({
      clientId: 'cid',
      refreshToken: 'r1',
      fetchImpl,
    });
    expect(out.access_token).toBe('next');
    expect(out.refresh_token).toBe('r2');
  });
});
