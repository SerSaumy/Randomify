/**
 * One-shot OAuth: starts the local server, opens the browser, waits for callback,
 * saves tokens, runs the extension build, then exits.
 */

import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import http from 'http';
import dotenv from 'dotenv';
import open from 'open';
import { createApp } from './server.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const PORT = Number(process.env.PORT || 8888);
const LOGIN_URL = `http://localhost:${PORT}/login`;
const AUTH_TIMEOUT_MS = 3 * 60 * 1000;

dotenv.config({ path: path.join(rootDir, '.env') });

function printClientIdHelp() {
  console.error('');
  console.error('Missing SPOTIFY_CLIENT_ID in .env');
  console.error('');
  console.error('Create a Spotify app and add your Client ID:');
  console.error('  1. Open https://developer.spotify.com/dashboard and create an app.');
  console.error('  2. Add Redirect URI exactly: http://localhost:8888/callback');
  console.error('  3. Run: npm run setup');
  console.error('');
}

function printLoadInstructions() {
  const extPath = path.join(rootDir, 'extension');
  console.log('');
  console.log('Load the extension in Chrome:');
  console.log('  1. Open chrome://extensions');
  console.log('  2. Enable Developer mode');
  console.log('  3. Click "Load unpacked"');
  console.log(`  4. Select this folder: ${extPath}`);
  console.log('');
  console.log('Firefox (after chrome build, or run: node scripts/build.mjs firefox):');
  console.log('  1. Open about:debugging#/runtime/this-firefox');
  console.log('  2. Load Temporary Add-on → choose extension/manifest.json');
  console.log('');
  console.log('Then open Spotify in the browser and use the True Random (🎲) button.');
  console.log('');
}

async function runBuild() {
  const { runBuild: buildExt } = await import('../scripts/build.mjs');
  await buildExt('chrome');
}

export async function runAuthFlow(options = {}) {
  const { skipOpenBrowser = false } = options;

  if (!process.env.SPOTIFY_CLIENT_ID?.trim()) {
    printClientIdHelp();
    throw new Error('SPOTIFY_CLIENT_ID missing');
  }

  let settled = false;
  let server;

  try {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (settled) return;
        settled = true;
        reject(new Error('TIMEOUT'));
      }, AUTH_TIMEOUT_MS);

      const finishOk = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        resolve({ ok: true });
      };

      const finishErr = (err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        reject(err);
      };

      const app = createApp({
        onAuthSuccess: finishOk,
        onAuthFailure: finishErr,
      });

      server = http.createServer(app);
      server.listen(PORT, async () => {
        // eslint-disable-next-line no-console
        console.log(`Randomify auth server: ${LOGIN_URL}`);
        if (!skipOpenBrowser) {
          try {
            await open(LOGIN_URL);
          } catch (e) {
            // eslint-disable-next-line no-console
            console.warn(`Could not open a browser automatically (${e.message}). Visit ${LOGIN_URL} manually.`);
          }
        }
      });

      server.on('error', (e) => {
        finishErr(e);
      });
    });
  } finally {
    if (server) {
      await new Promise((resolve) => {
        server.close(() => resolve());
      });
    }
  }

  return { ok: true };
}

async function main() {
  try {
    await runAuthFlow();
  } catch (e) {
    if (e.message === 'TIMEOUT') {
      console.error('');
      console.error('⏱ Timed out. Run npm run auth again.');
      console.error('');
      process.exit(1);
    }
    if (e.message === 'SPOTIFY_CLIENT_ID missing') {
      process.exit(1);
    }
    console.error('');
    console.error('OAuth failed:', e.message || e);
    console.error('Fix the issue above, then run npm run auth again.');
    console.error('');
    process.exit(1);
  }

  console.log('');
  console.log('✅ Authenticated successfully');
  try {
    await runBuild();
  } catch (e) {
    console.error('');
    console.error('Build failed:', e.message || e);
    process.exit(1);
  }
  printLoadInstructions();
  process.exit(0);
}

const entryFile = process.argv[1] ? path.resolve(process.argv[1]) : '';
const isMainModule = entryFile && import.meta.url === pathToFileURL(entryFile).href;
if (isMainModule) {
  main();
}
