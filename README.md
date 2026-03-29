# Randomify

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

**Randomify** is a browser extension for [Spotify Web Player](https://open.spotify.com/) that adds a **True Random** control next to the normal player buttons. Each click asks Spotify’s API for a track using randomized search, markets, and genre seeds so playback is not driven by your usual recommendations or chart bias. A small app on your computer handles Spotify login (OAuth PKCE) and keeps tokens out of the web page.

**Important:** Spotify Premium is required for API playback control. The extension does not embed your client secret; you run a local server on port 8888 while setting up and when importing session tokens.

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

## First-time setup (once per machine)

### 1. Get the code

```bash
git clone https://github.com/YOUR_USERNAME/randomify.git
cd randomify
```

(Replace the URL with your real repository after you publish it.)

### 2. Install dependencies

```bash
npm install
```

### 3. Create your Spotify app and `.env`

1. Open [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and log in.
2. **Create app**. Note the **Client ID**. You may copy **Client Secret** if you want (optional for this PKCE flow).
3. In app settings, add **Redirect URI**: `http://localhost:8888/callback`, then save.

Run the setup wizard (it will ask for Client ID and optional Secret and write a `.env` file in the project root):

```bash
npm run setup
```

Follow the prompts. When it tells you to start the server, continue to the next step.

### 4. Start the token server

In the project folder:

```bash
npm start
```

Leave this terminal open. You should see that Randomify is listening on `http://localhost:8888`.

### 5. Sign in with Spotify

Open:

`http://localhost:8888/login`

Approve access. When you see the success page, tokens are stored under `server/data/` on your machine (that folder is gitignored).

### 6. Build the extension

In a **second** terminal (keep `npm start` running):

```bash
npm run build
```

This bundles scripts into the `extension/` folder and writes `extension/manifest.json` for Chrome by default.

### 7. Load the extension in the browser

**Chrome / Edge (Chromium)**

1. Open `chrome://extensions` (or `edge://extensions`).
2. Turn on **Developer mode**.
3. Click **Load unpacked**.
4. Choose the **`extension`** folder inside this project (the same folder that contains `manifest.json`).

**Firefox**

1. Build with the Firefox manifest:

   ```bash
   node scripts/build.mjs firefox
   ```

2. Open `about:debugging#/runtime/this-firefox`.
3. **Load Temporary Add-on** and select `extension/manifest.json`.

Temporary add-ons are removed when Firefox closes; load again after restart or use a signed build for persistence.

### 8. Import the session into the extension

1. Click the Randomify icon in the toolbar to open the popup.
2. Click **Import session from local server** while `npm start` is still running.

You should see a connected status. You can stop the server afterward if you like; the extension keeps refresh tokens in the browser. Start the server again if you need to re-import or use a fresh machine.

---

## How to use it day to day

1. Open [open.spotify.com](https://open.spotify.com/) and log in with Premium.
2. Make sure Spotify has an active playback device (Web Player playing once, or desktop app open) so Connect sees a target.
3. Look for the **dice** button next to the usual shuffle control.
4. Click it. The extension picks a random track via the API and starts playback. A short message shows the track name or an error (no device, not Premium, rate limit, etc.).

If nothing happens, open the extension popup and confirm you are **connected**. Re-run `npm start` and **Import session** if the token expired or was revoked.

---

## Repository layout (for developers)

| Path | Purpose |
| --- | --- |
| `extension/` | Built extension (load unpacked from here after `npm run build`) |
| `extension/src/` | Source for background, content script, popup |
| `server/` | Express app: OAuth callback, `/api/session` |
| `lib/` | Shared logic (random picks, API helpers, deduplication) |
| `tests/` | Jest tests |
| `dist/` | Zip packages (`randomify-chrome.zip`, etc.), gitignored |

**Scripts:** `npm run setup`, `npm start`, `npm run build`, `npm test`, `npm run lint`. See `package.json` for details.

**Security:** Do not commit `.env` or `server/data/`. Client secret is not required inside the extension; tokens live in browser extension storage after import.

---

## Why this exists

Spotify’s shuffle is not a fair random sample of all music. Randomify reduces that bias by combining randomized search, random regions, and unweighted genre sampling, plus rules that avoid immediate repeats. It cannot guarantee a perfectly uniform distribution over every track on Spotify because the API does not expose the full catalog as a single list.

---

## FAQ

**Do I always need `npm start`?**  
Only for OAuth in the browser, and when you use **Import session** (or if you rely on hitting `http://localhost:8888/api/session`). After a successful import, normal playback works with the Web Player alone.

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
