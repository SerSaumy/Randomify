# Randomify

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

**Randomify** is a Chrome extension for [Spotify Web Player](https://open.spotify.com/) that starts **true random playback** with **zero setup**.

It generates a random Spotify **search query**, navigates a tab to Spotify’s search results, then uses a **content script** to physically click a random result’s **Play** button (DOM automation). No Spotify Web API, OAuth, PKCE, or backend server is used.

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
2. Click **Randomize**.

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

---

## Contributing

See `CONTRIBUTING.md`.
