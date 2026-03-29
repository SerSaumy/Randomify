import crypto from 'crypto';

const SPOTIFY_AUTH = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN = 'https://accounts.spotify.com/api/token';

function base64UrlEncode(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * @returns {{ verifier: string, challenge: string }}
 */
export function generatePkcePair() {
  const verifier = base64UrlEncode(crypto.randomBytes(32));
  const hash = crypto.createHash('sha256').update(verifier).digest();
  const challenge = base64UrlEncode(hash);
  return { verifier, challenge };
}

/**
 * @param {object} p
 * @param {string} p.clientId
 * @param {string} p.redirectUri
 * @param {string} p.codeChallenge
 * @param {string} p.state
 * @param {string[]} p.scopes
 * @returns {string}
 */
export function buildAuthorizeUrl(p) {
  const params = new URLSearchParams({
    client_id: p.clientId,
    response_type: 'code',
    redirect_uri: p.redirectUri,
    scope: p.scopes.join(' '),
    state: p.state,
    code_challenge_method: 'S256',
    code_challenge: p.codeChallenge,
  });
  return `${SPOTIFY_AUTH}?${params.toString()}`;
}

/**
 * @param {object} p
 * @param {string} p.clientId
 * @param {string} p.code
 * @param {string} p.redirectUri
 * @param {string} p.codeVerifier
 * @returns {Promise<object>}
 */
export async function exchangeCodeForTokens(p) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: p.code,
    redirect_uri: p.redirectUri,
    client_id: p.clientId,
    code_verifier: p.codeVerifier,
  });
  const res = await fetch(SPOTIFY_TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error_description || data.error || `Token exchange failed: ${res.status}`);
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

/**
 * Refresh access token (PKCE public client: no secret required).
 * @param {object} p
 * @param {string} p.clientId
 * @param {string} p.refreshToken
 * @returns {Promise<object>}
 */
export async function refreshAccessToken(p) {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: p.refreshToken,
    client_id: p.clientId,
  });
  const res = await fetch(SPOTIFY_TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error_description || data.error || `Refresh failed: ${res.status}`);
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

export const SPOTIFY_TOKEN_URL = SPOTIFY_TOKEN;
