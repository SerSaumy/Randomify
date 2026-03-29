(() => {
  // lib/token-refresh.js
  var ACCOUNTS_TOKEN_URL = "https://accounts.spotify.com/api/token";
  async function refreshTokensInExtension(p) {
    const fetchImpl = p.fetchImpl || globalThis.fetch.bind(globalThis);
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: p.refreshToken,
      client_id: p.clientId
    });
    const res = await fetchImpl(ACCOUNTS_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString()
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error_description || data.error || `Refresh failed: ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return data;
  }

  // lib/markets-data.js
  var SPOTIFY_MARKET_CODES = [
    "AD",
    "AE",
    "AG",
    "AL",
    "AM",
    "AO",
    "AR",
    "AT",
    "AU",
    "AZ",
    "BA",
    "BB",
    "BD",
    "BE",
    "BF",
    "BG",
    "BH",
    "BI",
    "BJ",
    "BN",
    "BO",
    "BR",
    "BS",
    "BT",
    "BW",
    "BY",
    "BZ",
    "CA",
    "CD",
    "CG",
    "CH",
    "CI",
    "CL",
    "CM",
    "CO",
    "CR",
    "CV",
    "CW",
    "CY",
    "CZ",
    "DE",
    "DJ",
    "DK",
    "DM",
    "DO",
    "DZ",
    "EC",
    "EE",
    "EG",
    "ES",
    "ET",
    "FI",
    "FJ",
    "FM",
    "FR",
    "GA",
    "GB",
    "GD",
    "GE",
    "GH",
    "GM",
    "GN",
    "GQ",
    "GR",
    "GT",
    "GW",
    "GY",
    "HK",
    "HN",
    "HR",
    "HT",
    "HU",
    "ID",
    "IE",
    "IL",
    "IN",
    "IQ",
    "IS",
    "IT",
    "JM",
    "JO",
    "JP",
    "KE",
    "KG",
    "KH",
    "KI",
    "KM",
    "KN",
    "KR",
    "KW",
    "KZ",
    "LA",
    "LB",
    "LC",
    "LI",
    "LK",
    "LR",
    "LS",
    "LT",
    "LU",
    "LV",
    "LY",
    "MA",
    "MC",
    "MD",
    "ME",
    "MG",
    "MH",
    "MK",
    "ML",
    "MM",
    "MN",
    "MO",
    "MR",
    "MT",
    "MU",
    "MV",
    "MW",
    "MX",
    "MY",
    "MZ",
    "NA",
    "NE",
    "NG",
    "NI",
    "NL",
    "NO",
    "NP",
    "NR",
    "NZ",
    "OM",
    "PA",
    "PE",
    "PG",
    "PH",
    "PK",
    "PL",
    "PS",
    "PT",
    "PW",
    "PY",
    "QA",
    "RO",
    "RS",
    "RW",
    "SA",
    "SB",
    "SC",
    "SE",
    "SG",
    "SI",
    "SK",
    "SL",
    "SM",
    "SN",
    "SR",
    "ST",
    "SV",
    "SZ",
    "TD",
    "TG",
    "TH",
    "TJ",
    "TL",
    "TN",
    "TO",
    "TR",
    "TT",
    "TV",
    "TW",
    "TZ",
    "UA",
    "UG",
    "US",
    "UY",
    "UZ",
    "VC",
    "VE",
    "VN",
    "VU",
    "WS",
    "XK",
    "YE",
    "ZA",
    "ZM",
    "ZW"
  ];

  // lib/genre-seeds-extra.js
  var EXTRA_GENRE_SEEDS = [
    "cumbia",
    "zydeco",
    "fado",
    "gamelan",
    "tuvan-throat-singing",
    "hindustani-classical",
    "ugandan-knuckles"
  ];

  // lib/genre-seeds-default.js
  var DEFAULT_SPOTIFY_GENRE_SEEDS = [
    "acoustic",
    "afrobeat",
    "alt-rock",
    "alternative",
    "ambient",
    "anime",
    "black-metal",
    "bluegrass",
    "blues",
    "bossanova",
    "brazil",
    "breakbeat",
    "british",
    "cantopop",
    "chicago-house",
    "children",
    "chill",
    "classical",
    "club",
    "comedy",
    "country",
    "dance",
    "dancehall",
    "death-metal",
    "deep-house",
    "detroit-techno",
    "disco",
    "disney",
    "drum-and-bass",
    "dub",
    "dubstep",
    "edm",
    "electro",
    "electronic",
    "emo",
    "folk",
    "forro",
    "french",
    "funk",
    "garage",
    "german",
    "gospel",
    "goth",
    "grindcore",
    "groove",
    "grunge",
    "guitar",
    "happy",
    "hard-rock",
    "hardcore",
    "hardstyle",
    "heavy-metal",
    "hip-hop",
    "holidays",
    "honky-tonk",
    "house",
    "idm",
    "indian",
    "indie",
    "indie-pop",
    "industrial",
    "iranian",
    "j-dance",
    "j-idol",
    "j-pop",
    "j-rock",
    "jazz",
    "k-pop",
    "kids",
    "latin",
    "latino",
    "malay",
    "mandopop",
    "metal",
    "metal-misc",
    "metalcore",
    "minimal-techno",
    "movies",
    "mpb",
    "new-age",
    "new-release",
    "opera",
    "pagode",
    "party",
    "philippines-opm",
    "piano",
    "pop",
    "pop-film",
    "post-dubstep",
    "power-metal",
    "progressive-house",
    "psych-rock",
    "punk",
    "punk-rock",
    "r-n-b",
    "rainy-day",
    "reggae",
    "reggaeton",
    "road-trip",
    "rock",
    "rock-n-roll",
    "rockabilly",
    "romance",
    "sad",
    "salsa",
    "samba",
    "sertanejo",
    "show-tunes",
    "singer-songwriter",
    "ska",
    "sleep",
    "songwriter",
    "soul",
    "soundtracks",
    "spanish",
    "study",
    "summer",
    "swedish",
    "synth-pop",
    "tango",
    "techno",
    "trance",
    "trip-hop",
    "turkish",
    "work-out",
    "world-music"
  ];

  // lib/randomness.js
  var STRATEGY_SEARCH = "search";
  var STRATEGY_RECOMMENDATIONS = "recommendations";
  var STRATEGY_MARKET_SEARCH = "market_search";
  function secureRandomUnit() {
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      const buf = new Uint32Array(1);
      crypto.getRandomValues(buf);
      return buf[0] / 2 ** 32;
    }
    return Math.random();
  }
  function randomInt(max) {
    if (max <= 0) return 0;
    return Math.floor(secureRandomUnit() * max);
  }
  function pickUniform(arr) {
    if (!arr.length) {
      throw new Error("pickUniform: empty array");
    }
    return arr[randomInt(arr.length)];
  }
  function randomSearchQuery() {
    const len = secureRandomUnit() < 0.5 ? 1 : 2;
    let out = "";
    for (let i = 0; i < len; i += 1) {
      const codePoint = 32 + randomInt(1114096 - 32);
      out += String.fromCodePoint(codePoint);
    }
    return out;
  }
  function randomSearchOffset() {
    return randomInt(1001);
  }
  function mergeGenreSeeds(apiSeeds) {
    const set = /* @__PURE__ */ new Set([...DEFAULT_SPOTIFY_GENRE_SEEDS, ...EXTRA_GENRE_SEEDS, ...apiSeeds]);
    return [...set];
  }
  function pickRandomGenreSeeds(genreSeeds, count = 2) {
    const copy = [...genreSeeds];
    const out = [];
    const n = Math.min(count, copy.length);
    for (let i = 0; i < n; i += 1) {
      const idx = randomInt(copy.length);
      out.push(copy[idx]);
      copy.splice(idx, 1);
    }
    return out;
  }
  function randomMarket() {
    return pickUniform(SPOTIFY_MARKET_CODES);
  }
  function pickRandomStrategy() {
    const r = secureRandomUnit();
    if (r < 1 / 3) return STRATEGY_SEARCH;
    if (r < 2 / 3) return STRATEGY_RECOMMENDATIONS;
    return STRATEGY_MARKET_SEARCH;
  }
  var STRATEGIES = {
    STRATEGY_SEARCH,
    STRATEGY_RECOMMENDATIONS,
    STRATEGY_MARKET_SEARCH
  };

  // lib/backoff.js
  var BASE_MS = 500;
  var MAX_MS = 32e3;
  function computeBackoffMs(attempt) {
    const cap = Math.min(MAX_MS, BASE_MS * 2 ** attempt);
    return Math.floor(secureRandomUnit() * cap);
  }
  function isRetriableStatus(status) {
    return status === 429 || status === 503 || status === 502 || status === 504;
  }

  // lib/spotify-api.js
  var API_BASE = "https://api.spotify.com/v1";
  function sanitizeDisplayText(str) {
    if (typeof str !== "string") {
      return "";
    }
    return str.replace(/[<>]/g, "").slice(0, 500);
  }
  async function spotifyGet(token, path, query, opts = {}) {
    const fetchImpl = opts.fetchImpl || globalThis.fetch.bind(globalThis);
    const maxAttempts = opts.maxAttempts ?? 4;
    const u = new URL(`${API_BASE}${path}`);
    if (query) {
      Object.entries(query).forEach(([k, v]) => {
        if (v !== void 0 && v !== null) {
          u.searchParams.set(k, String(v));
        }
      });
    }
    let lastErr;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const res = await fetchImpl(u.toString(), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        return res;
      }
      if (isRetriableStatus(res.status) && attempt < maxAttempts - 1) {
        const wait = computeBackoffMs(attempt);
        await new Promise((resolve) => {
          setTimeout(resolve, wait);
        });
        lastErr = res;
        continue;
      }
      return res;
    }
    return lastErr;
  }
  async function spotifyPut(token, path, body, opts = {}) {
    const fetchImpl = opts.fetchImpl || globalThis.fetch.bind(globalThis);
    const maxAttempts = opts.maxAttempts ?? 4;
    const u = new URL(`${API_BASE}${path}`);
    if (opts.query) {
      Object.entries(opts.query).forEach(([k, v]) => {
        if (v !== void 0 && v !== null) {
          u.searchParams.set(k, String(v));
        }
      });
    }
    const url = u.toString();
    let lastRes;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const res = await fetchImpl(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });
      lastRes = res;
      if (res.ok) {
        return res;
      }
      if (isRetriableStatus(res.status) && attempt < maxAttempts - 1) {
        const wait = computeBackoffMs(attempt);
        await new Promise((resolve) => {
          setTimeout(resolve, wait);
        });
        continue;
      }
      return res;
    }
    return lastRes;
  }
  async function parseJsonSafe(res) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }

  // lib/track-picker.js
  async function fetchGenreSeedsFromApi(token, fetchImpl) {
    const res = await spotifyGet(token, "/recommendations/available-genre-seeds", void 0, { fetchImpl });
    const j = await parseJsonSafe(res);
    if (!res.ok || !j?.genres || !Array.isArray(j.genres)) {
      return [];
    }
    return j.genres;
  }
  function normalizeTrack(track) {
    if (!track?.uri || !track.uri.startsWith("spotify:track:")) {
      return null;
    }
    const name = typeof track.name === "string" ? track.name : "";
    const artistId = track.artists?.[0]?.id || null;
    return { uri: track.uri, artistId, name };
  }
  function firstTrackFromSearch(json) {
    const items = json?.tracks?.items;
    if (!items?.length) {
      return null;
    }
    return normalizeTrack(items[0]);
  }
  function firstTrackFromRecommendations(json) {
    const tracks = json?.tracks;
    if (!tracks?.length) {
      return null;
    }
    return normalizeTrack(tracks[0]);
  }
  async function pickFromRecommendations(token, mergedGenres, fetchImpl) {
    const seeds = pickRandomGenreSeeds(mergedGenres, 3);
    if (!seeds.length) {
      return null;
    }
    const res = await spotifyGet(
      token,
      "/recommendations",
      {
        seed_genres: seeds.join(","),
        limit: 1
      },
      { fetchImpl }
    );
    const j = await parseJsonSafe(res);
    if (!res.ok || !j) {
      return null;
    }
    return firstTrackFromRecommendations(j);
  }
  async function pickFromSearch(token, q, market, fetchImpl) {
    const offset = randomSearchOffset();
    const query = {
      q,
      type: "track",
      limit: 1,
      offset
    };
    if (market) {
      query.market = market;
    }
    const res = await spotifyGet(token, "/search", query, { fetchImpl });
    const j = await parseJsonSafe(res);
    if (!res.ok || !j) {
      return null;
    }
    return firstTrackFromSearch(j);
  }
  async function pickCandidateTrack(ctx) {
    const { token, mergedGenres, fetchImpl } = ctx;
    const strategy = pickRandomStrategy();
    if (strategy === STRATEGIES.STRATEGY_RECOMMENDATIONS) {
      const t = await pickFromRecommendations(token, mergedGenres, fetchImpl);
      return t;
    }
    const q = randomSearchQuery();
    if (strategy === STRATEGIES.STRATEGY_MARKET_SEARCH) {
      const m = randomMarket();
      return pickFromSearch(token, q, m, fetchImpl);
    }
    return pickFromSearch(token, q, void 0, fetchImpl);
  }
  function buildMergedGenres(apiGenres) {
    return mergeGenreSeeds(apiGenres || []);
  }

  // lib/dedup.js
  var MAX_BLOCKED_URIS = 100;
  var MAX_HISTORY_BEFORE_RESET = 500;
  function createEmptyDedupState() {
    return {
      blockedUris: [],
      playLog: [],
      lastArtistId: null
    };
  }
  function shouldRejectSelection(state, trackUri, artistId) {
    if (state.blockedUris.includes(trackUri)) {
      return true;
    }
    if (artistId && state.lastArtistId && artistId === state.lastArtistId) {
      return true;
    }
    return false;
  }
  function recordSuccessfulPlay(state, trackUri, artistId) {
    const { blockedUris, playLog } = state;
    const nextBlocked = [...blockedUris, trackUri];
    if (nextBlocked.length > MAX_BLOCKED_URIS) {
      nextBlocked.splice(0, nextBlocked.length - MAX_BLOCKED_URIS);
    }
    let nextLog = [...playLog, trackUri];
    if (nextLog.length > MAX_HISTORY_BEFORE_RESET) {
      nextLog = [];
      return {
        blockedUris: [],
        playLog: nextLog,
        lastArtistId: artistId || null
      };
    }
    return {
      blockedUris: nextBlocked,
      playLog: nextLog,
      lastArtistId: artistId || null
    };
  }

  // extension/src/background.js
  var STORAGE_KEYS = {
    clientId: "sts_client_id",
    accessToken: "sts_access_token",
    refreshToken: "sts_refresh_token",
    expiresAt: "sts_expires_at",
    dedup: "sts_dedup_state",
    genreSeeds: "sts_genre_seeds",
    genreSeedsAt: "sts_genre_seeds_at"
  };
  var SESSION_URLS = [
    "http://127.0.0.1:8888/api/session",
    "http://localhost:8888/api/session"
  ];
  var TOKEN_SKEW_MS = 60 * 1e3;
  function getApi() {
    return globalThis.browser || globalThis.chrome;
  }
  async function loadStorage() {
    return new Promise((resolve) => {
      getApi().storage.local.get(null, resolve);
    });
  }
  async function saveStorage(patch) {
    return new Promise((resolve) => {
      getApi().storage.local.set(patch, resolve);
    });
  }
  function parseDedup(raw) {
    if (!raw || typeof raw !== "object") {
      return createEmptyDedupState();
    }
    return {
      blockedUris: Array.isArray(raw.blockedUris) ? raw.blockedUris : [],
      playLog: Array.isArray(raw.playLog) ? raw.playLog : [],
      lastArtistId: raw.lastArtistId || null
    };
  }
  async function getValidAccessToken() {
    const s = await loadStorage();
    const clientId = s[STORAGE_KEYS.clientId];
    const refreshToken = s[STORAGE_KEYS.refreshToken];
    const accessToken = s[STORAGE_KEYS.accessToken];
    const expiresAt = s[STORAGE_KEYS.expiresAt] || 0;
    if (!clientId || !refreshToken) {
      throw new Error("Not connected. Import a session from the local token server using the extension popup.");
    }
    if (accessToken && Date.now() < expiresAt - TOKEN_SKEW_MS) {
      return accessToken;
    }
    const data = await refreshTokensInExtension({
      clientId,
      refreshToken
    });
    const nextAccess = data.access_token;
    const nextRefresh = data.refresh_token || refreshToken;
    const nextExpires = Date.now() + data.expires_in * 1e3;
    await saveStorage({
      [STORAGE_KEYS.accessToken]: nextAccess,
      [STORAGE_KEYS.refreshToken]: nextRefresh,
      [STORAGE_KEYS.expiresAt]: nextExpires
    });
    return nextAccess;
  }
  async function fetchProduct(token) {
    const res = await spotifyGet(token, "/me", void 0, {});
    const j = await parseJsonSafe(res);
    if (!res.ok) {
      throw new Error(j?.error?.message || "Could not read your Spotify profile.");
    }
    const product = j.product || "free";
    return { premium: product === "premium", product };
  }
  async function resolveDeviceId(token) {
    const res = await spotifyGet(token, "/me/player/devices", void 0, {});
    const j = await parseJsonSafe(res);
    if (!res.ok) {
      return null;
    }
    const devices = j?.devices || [];
    if (!devices.length) {
      return null;
    }
    const active = devices.find((d) => d.is_active);
    if (active) {
      return active.id;
    }
    const computer = devices.find((d) => d.type === "Computer");
    return computer?.id || devices[0].id;
  }
  async function hasAnyDevice(token) {
    const id = await resolveDeviceId(token);
    return Boolean(id);
  }
  async function startPlayback(token, uri, deviceId) {
    const opts = deviceId ? { query: { device_id: deviceId } } : {};
    const res = await spotifyPut(token, "/me/player/play", { uris: [uri] }, opts);
    const body = await parseJsonSafe(res);
    return { ok: res.ok, status: res.status, body };
  }
  async function pickTrackRespectingDedup(token, mergedGenres, dedup) {
    const maxAttempts = 40;
    for (let i = 0; i < maxAttempts; i += 1) {
      const candidate = await pickCandidateTrack({
        token,
        mergedGenres
      });
      if (!candidate) {
        continue;
      }
      if (shouldRejectSelection(dedup, candidate.uri, candidate.artistId)) {
        continue;
      }
      return candidate;
    }
    throw new Error("Could not find a fresh random track. Try again in a moment.");
  }
  async function ensureGenreSeeds(token) {
    const s = await loadStorage();
    const cached = s[STORAGE_KEYS.genreSeeds];
    const fetchedAt = s[STORAGE_KEYS.genreSeedsAt] || 0;
    const day = 24 * 60 * 60 * 1e3;
    if (Array.isArray(cached) && cached.length && Date.now() - fetchedAt < day) {
      return;
    }
    const apiGenres = await fetchGenreSeedsFromApi(token, globalThis.fetch.bind(globalThis));
    const merged = buildMergedGenres(apiGenres);
    await saveStorage({
      [STORAGE_KEYS.genreSeeds]: merged,
      [STORAGE_KEYS.genreSeedsAt]: Date.now()
    });
  }
  async function runTrueRandomFlow() {
    const token = await getValidAccessToken();
    const { premium } = await fetchProduct(token);
    if (!premium) {
      return {
        ok: false,
        code: "PREMIUM_REQUIRED",
        message: "Spotify Premium is required for API playback control. Upgrade or use Premium to play tracks from this extension."
      };
    }
    const deviceOk = await hasAnyDevice(token);
    if (!deviceOk) {
      return {
        ok: false,
        code: "NO_DEVICE",
        message: "No Spotify device found. Open the Web Player or desktop app and start playback once, then try again."
      };
    }
    await ensureGenreSeeds(token);
    const s = await loadStorage();
    const mergedGenres = s[STORAGE_KEYS.genreSeeds] || buildMergedGenres([]);
    let dedup = parseDedup(s[STORAGE_KEYS.dedup]);
    const deviceId = await resolveDeviceId(token);
    const maxPlayAttempts = 10;
    let lastFailure = null;
    for (let p = 0; p < maxPlayAttempts; p += 1) {
      const candidate = await pickTrackRespectingDedup(token, mergedGenres, dedup);
      const playResult = await startPlayback(token, candidate.uri, deviceId);
      if (playResult.ok) {
        dedup = recordSuccessfulPlay(dedup, candidate.uri, candidate.artistId);
        await saveStorage({
          [STORAGE_KEYS.dedup]: dedup
        });
        return {
          ok: true,
          trackName: sanitizeDisplayText(candidate.name),
          uri: candidate.uri
        };
      }
      lastFailure = playResult;
      if (playResult.status === 404) {
        return {
          ok: false,
          code: "NO_ACTIVE_PLAYER",
          message: "Playback could not start. Select the Web Player as your device in Spotify Connect."
        };
      }
      if (playResult.status === 403) {
        const reason = playResult.body?.error?.reason;
        if (reason === "PREMIUM_REQUIRED") {
          return {
            ok: false,
            code: "PREMIUM_REQUIRED",
            message: "This account cannot start playback via the API. Premium is usually required."
          };
        }
      }
      if (playResult.status === 429 || playResult.status === 503) {
        return {
          ok: false,
          code: "SERVICE_BUSY",
          message: "Spotify rate limited or temporarily unavailable. Wait a few seconds and use the retry action.",
          retry: true
        };
      }
      const transient = playResult.status >= 500 || playResult.status === 429;
      if (playResult.status === 403 || playResult.status === 400) {
        continue;
      }
      if (transient) {
        return {
          ok: false,
          code: "PLAYBACK_FAILED",
          message: playResult.body?.error?.message || "Temporary Spotify error.",
          retry: true
        };
      }
      return {
        ok: false,
        code: "PLAYBACK_FAILED",
        message: playResult.body?.error?.message || `Playback failed (${playResult.status}).`,
        retry: false
      };
    }
    const msg = lastFailure?.body?.error?.message || "Could not play a track after several attempts. Try again.";
    return {
      ok: false,
      code: "PLAYBACK_FAILED",
      message: msg,
      retry: true
    };
  }
  async function importSessionFromServer() {
    let lastErr;
    for (const url of SESSION_URLS) {
      try {
        const res = await fetch(url, { method: "GET" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          lastErr = new Error(data.message || data.error || `HTTP ${res.status}`);
          continue;
        }
        if (!data.refresh_token || !data.client_id) {
          lastErr = new Error("Server session missing tokens. Complete OAuth at /login first.");
          continue;
        }
        await saveStorage({
          [STORAGE_KEYS.clientId]: data.client_id,
          [STORAGE_KEYS.accessToken]: data.access_token,
          [STORAGE_KEYS.refreshToken]: data.refresh_token,
          [STORAGE_KEYS.expiresAt]: data.expires_at || 0
        });
        return { ok: true };
      } catch (e) {
        lastErr = e;
      }
    }
    return {
      ok: false,
      error: lastErr ? lastErr.message : "Could not reach local token server."
    };
  }
  getApi().runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "TRUE_RANDOM_PLAY") {
      runTrueRandomFlow().then(sendResponse).catch((e) => sendResponse({ ok: false, code: "ERROR", message: e.message || String(e) }));
      return true;
    }
    if (message?.type === "IMPORT_SESSION") {
      importSessionFromServer().then(sendResponse).catch((e) => sendResponse({ ok: false, error: e.message }));
      return true;
    }
    if (message?.type === "GET_STATUS") {
      loadStorage().then((st) => {
        const connected = Boolean(st[STORAGE_KEYS.refreshToken] && st[STORAGE_KEYS.clientId]);
        sendResponse({ ok: true, connected });
      }).catch(() => sendResponse({ ok: false }));
      return true;
    }
    return false;
  });
})();
