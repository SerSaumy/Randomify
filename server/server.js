/**
 * Local OAuth callback and token broker for Randomify.
 * Keeps refresh material on disk so the extension can sync without embedding secrets.
 */

import fs from 'fs';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import express from 'express';
import dotenv from 'dotenv';
import {
  generatePkcePair,
  buildAuthorizeUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
} from './pkce.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
dotenv.config({ path: path.join(rootDir, '.env') });

const PORT = Number(process.env.PORT || 8888);
const REDIRECT_URI = 'http://localhost:8888/callback';
const DATA_DIR = path.join(__dirname, 'data');
const TOKEN_PATH = path.join(DATA_DIR, 'tokens.json');

const SCOPES = [
  'user-read-private',
  'user-read-playback-state',
  'user-modify-playback-state',
];

/** @type {Map<string, { verifier: string, created: number }>} */
const oauthStates = new Map();

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readTokens() {
  try {
    const raw = fs.readFileSync(TOKEN_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeTokens(obj) {
  ensureDataDir();
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(obj, null, 2), 'utf8');
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export function createApp() {
  const app = express();
  app.use(express.json());

  app.options('*', (req, res) => {
    cors(res);
    res.sendStatus(204);
  });

  app.get('/login', (req, res) => {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    if (!clientId) {
      res.status(500).send('Missing SPOTIFY_CLIENT_ID in .env');
      return;
    }
    const { verifier, challenge } = generatePkcePair();
    const state = crypto.randomBytes(24).toString('base64url');
    oauthStates.set(state, { verifier, created: Date.now() });
    // prune old states
    for (const [k, v] of oauthStates) {
      if (Date.now() - v.created > 15 * 60 * 1000) oauthStates.delete(k);
    }
    const url = buildAuthorizeUrl({
      clientId,
      redirectUri: REDIRECT_URI,
      codeChallenge: challenge,
      state,
      scopes: SCOPES,
    });
    res.redirect(url);
  });

  app.get('/callback', async (req, res) => {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const { code, state, error } = req.query;
    if (error) {
      res.status(400).send(`Authorization error: ${error}`);
      return;
    }
    const entry = state && oauthStates.get(state);
    if (!code || !entry) {
      res.status(400).send('Invalid OAuth state or missing code. Start again from /login.');
      return;
    }
    oauthStates.delete(state);
    try {
      const tokenPayload = await exchangeCodeForTokens({
        clientId,
        code,
        redirectUri: REDIRECT_URI,
        codeVerifier: entry.verifier,
      });
      const expiresAt = Date.now() + (tokenPayload.expires_in * 1000);
      writeTokens({
        access_token: tokenPayload.access_token,
        refresh_token: tokenPayload.refresh_token,
        expires_at: expiresAt,
        client_id: clientId,
        scope: tokenPayload.scope,
      });
      res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Randomify</title></head>
<body style="font-family:system-ui;padding:2rem;">
<h1>Connected</h1>
<p>You can close this tab and use the extension popup to import tokens, or rely on automatic sync.</p>
</body></html>`);
    } catch (e) {
      res.status(500).send(`Token exchange failed: ${e.message}`);
    }
  });

  /**
   * Session for extension: access and refresh tokens for storage in chrome.storage.local
   */
  app.get('/api/session', (req, res) => {
    cors(res);
    const t = readTokens();
    if (!t || !t.refresh_token) {
      res.status(404).json({ error: 'no_session', message: 'Complete OAuth via /login first.' });
      return;
    }
    res.json({
      access_token: t.access_token,
      refresh_token: t.refresh_token,
      expires_at: t.expires_at,
      client_id: t.client_id,
    });
  });

  app.post('/api/refresh', async (req, res) => {
    cors(res);
    const t = readTokens();
    if (!t?.refresh_token || !t.client_id) {
      res.status(404).json({ error: 'no_session' });
      return;
    }
    try {
      const out = await refreshAccessToken({
        clientId: t.client_id,
        refreshToken: t.refresh_token,
      });
      const expiresAt = Date.now() + (out.expires_in * 1000);
      const next = {
        ...t,
        access_token: out.access_token,
        expires_at: expiresAt,
      };
      if (out.refresh_token) {
        next.refresh_token = out.refresh_token;
      }
      writeTokens(next);
      res.json({
        access_token: next.access_token,
        expires_at: next.expires_at,
        refresh_token: next.refresh_token,
      });
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message });
    }
  });

  app.get('/health', (req, res) => {
    cors(res);
    res.json({ ok: true, port: PORT });
  });

  return app;
}

function start() {
  ensureDataDir();
  const app = createApp();
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Randomify token server listening on http://localhost:${PORT}`);
    console.log(`Open http://localhost:${PORT}/login to authorize.`);
  });
}

const entryFile = process.argv[1] ? path.resolve(process.argv[1]) : '';
const isMainModule = entryFile && import.meta.url === pathToFileURL(entryFile).href;

if (isMainModule) {
  start();
}
