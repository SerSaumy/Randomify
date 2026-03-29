# ANNOUNCEMENT — I NEED HELP FIGURING OUT A TO AVOID SPOTIY'S POPULAR RESULT BIAS. IF YOU CAN HELP PLEASE CONTRIBUTE


# Randomify

<p align="center">
  <img src="assets/icon_transparent.png" alt="Randomify" width="160" />
</p>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

**Randomify** is a Chrome extension for [Spotify Web Player](https://open.spotify.com/) that starts **true random playback**.

It generates a random search query, navigates Spotify to that search URL, then uses a **content script** to auto-click a random result's Play button (DOM automation). No API keys, tokens, OAuth, PKCE, or backend server are required.

---

## What you need

| Item | Notes |
| --- | --- |
| Chrome (MV3) | Load unpacked in Developer Mode |
| Spotify account | Log in at `open.spotify.com` |
| [Node.js](https://nodejs.org/) | Version 18+ (only if building from source) |

---

## Install (recommended: GitHub Release zip)

1. Download `randomify-chrome.zip` from the latest GitHub Release.
2. Unzip it.
3. Go to `chrome://extensions`
4. Enable **Developer mode**
5. Click **Load unpacked** → select the unzipped **`extension/`** folder.

---

## Install (from source)

```bash
npm install
```

1. Go to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** → select the **`extension/`** folder

---

## How to use

1. Open `open.spotify.com` and log in.
2. Click the **dice (🎲) button** added inside Spotify’s player controls.

You can also use the extension popup as a fallback:

1. Click the Randomify extension icon.
2. Click **Play Random Track**.

Randomify will open (or reuse) a Spotify tab, run a random search query, then automatically click Play on a random track result. A small toast in the page shows status.

---

## Repository layout (for developers)

| Path | Purpose |
| --- | --- |
| `extension/` | Chrome extension (load unpacked from here) |
| `extension/src/` | Service worker, content script, popup |
| `lib/` | Shared logic (random query generation, deduplication, etc.) |
| `tests/` | Jest tests |
| `dist/` | Zip packages, gitignored |

**Scripts:** `npm run build`, `npm test`, `npm run lint`

**Important:** The files Chrome actually runs live under `extension/src/` (bundled output). After you pull or edit `extension/src-src/`, run `npm run build` so `extension/src/` and `extension/manifest.json` stay in sync, then click **Reload** on `chrome://extensions`.

### Extension still looks like an old version?

1. Run **`npm run build`** in the repo root (updates `extension/src/*.js` and `extension/manifest.json`).
2. On `chrome://extensions`, click **Reload** on Randomify (or **Remove** and **Load unpacked** again).
3. Hard-refresh Spotify (`Ctrl+Shift+R`) so the content script re-injects.

---

## Contributing

See `CONTRIBUTING.md`.
