# Randomify

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

**Randomify** is a browser extension for [Spotify Web Player](https://open.spotify.com/) that adds a **True Random** control next to the normal player buttons. Each click asks Spotify’s API for a track using randomized search, markets, and genre seeds so playback is not driven by your usual recommendations or chart bias.

**Important:** Spotify Premium is required for API playback control. The extension does not embed your client secret; you run a short local auth step once, then tokens live in extension storage (and can be baked in at build time).

---

## What you need

| Item | Notes |
| --- | --- |
| Computer | Windows, macOS, or Linux |
| [Node.js](https://nodejs.org/) | Version 18 or newer |
| [Spotify Premium](https://www.spotify.com/premium/) | Needed for `play` API |
| [Spotify Developer app](https://developer.spotify.com/dashboard) | Free; you create an app and set one redirect URI |

**Redirect URI** (must match exactly when you create the app):

`http://localhost:8888/callback`

---

## Setup (4 steps)

Create a Spotify Developer app at [https://developer.spotify.com/dashboard](https://developer.spotify.com/dashboard).

Add redirect URI: `http://localhost:8888/callback`. Copy your Client ID.

**Run setup:**

```bash
npm install
npm run setup
```

Paste your Client ID when prompted (Client Secret is optional for PKCE).

**Authenticate:**

```bash
npm run auth
```

Your browser opens automatically. Approve Spotify access. When you see the success page, tokens are saved, the extension is built, and the local server exits—you do not need to keep `npm start` running.

**Load in Chrome:**

1. Go to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** → select the **`extension/`** folder inside this project

**Firefox:** run `node scripts/build.mjs firefox`, then open `about:debugging#/runtime/this-firefox` and load **Temporary Add-on** → choose `extension/manifest.json`.

---

## How to use it day to day

1. Open [open.spotify.com](https://open.spotify.com/) and log in with Premium.
2. Make sure Spotify has an active playback device (Web Player playing once, or desktop app open) so Connect sees a target.
3. Look for the **dice** button (🎲) next to the usual shuffle control.
4. Click it. The extension picks a random track via the API and starts playback. A short message shows the track name or an error (no device, not Premium, rate limit, etc.).

If nothing happens, open the extension popup. If you are **Not connected**, run **`npm run auth`** again or use **Re-authenticate** (with `npm start` if you need the local OAuth server). You do not need the local server for normal playback once tokens are in the extension.

---

## Repository layout (for developers)

| Path | Purpose |
| --- | --- |
| `extension/` | Built extension (load unpacked from here after `npm run build` or `npm run auth`) |
| `extension/src/` | Source for background, content script, popup |
| `server/` | Express app: OAuth callback, `npm run auth`, optional `npm start` |
| `lib/` | Shared logic (random picks, API helpers, deduplication) |
| `tests/` | Jest tests |
| `dist/` | Zip packages (`randomify-chrome.zip`, etc.), gitignored |

**Scripts:** `npm run setup`, `npm run auth`, `npm run build`, `npm start`, `npm test`, `npm run lint`. See `package.json` for details.

**Security:** Do not commit `.env`, `server/data/`, or `extension/injected-session.js`. Client secret is not required inside the extension; tokens live in browser extension storage after auth.

---

## Why this exists

Spotify’s shuffle is not a fair random sample of all music. Randomify reduces that bias by combining randomized search, random regions, and unweighted genre sampling, plus rules that avoid immediate repeats. It cannot guarantee a perfectly uniform distribution over every track on Spotify because the API does not expose the full catalog as a single list.

---

## FAQ

**Do I always need `npm start`?**  
No. Use `npm run auth` for setup (or run `npm start` if you prefer the long-lived server and manual `/login`). After tokens are in the extension, day-to-day playback does not need a local server.

**Firefox vs Chrome**  
Run `npm run build` for Chrome. For Firefox, run `node scripts/build.mjs firefox` so `manifest.json` matches Mozilla’s format.

**Where is the license?**  
MIT. See `LICENSE`.

---

## Publish to GitHub (maintainers)

Your repo is ready to push from this folder: `git` is initialized on branch `main` with an initial commit.

**Option A: GitHub website**

1. On GitHub, create a **new repository** (for example `randomify`). Do **not** add a README, `.gitignore`, or license there (this project already has them).
2. In the project folder:

   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/randomify.git
   git push -u origin main
   ```

**Option B: GitHub CLI**

1. Run `gh auth login` and complete sign-in.
2. From the project folder:

   ```bash
   gh repo create randomify --public --source=. --remote=origin --push
   ```

3. After pushing, update the **clone URL** at the top of this README if you used a different name or organization.

---

## Contributing

See `CONTRIBUTING.md`.
