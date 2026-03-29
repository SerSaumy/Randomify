/**
 * Refresh access tokens for PKCE public clients (client id only, no secret).
 */

export const ACCOUNTS_TOKEN_URL = 'https://accounts.spotify.com/api/token';

/**
 * @param {object} p
 * @param {string} p.clientId
 * @param {string} p.refreshToken
 * @param {typeof fetch} [p.fetchImpl]
 * @returns {Promise<{ access_token: string, expires_in: number, refresh_token?: string }>}
 */
export async function refreshTokensInExtension(p) {
  const fetchImpl = p.fetchImpl || globalThis.fetch.bind(globalThis);
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: p.refreshToken,
    client_id: p.clientId,
  });
  const res = await fetchImpl(ACCOUNTS_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error_description || data.error || `Refresh failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}
