(() => {
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
  function randomSearchQuery() {
    const len = secureRandomUnit() < 0.5 ? 1 : 2;
    let out = "";
    for (let i = 0; i < len; i += 1) {
      const codePoint = 32 + randomInt(1114096 - 32);
      out += String.fromCodePoint(codePoint);
    }
    return out;
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

  // lib/track-picker.js
  function quoteIfNeeded(value) {
    return value.includes(" ") ? `"${value}"` : value;
  }
  function buildGenreYearQuery(genrePool) {
    const seeds = pickRandomGenreSeeds(genrePool, 1);
    const genre = seeds[0] || "indie";
    const start = 1960 + randomInt(60);
    const span = 3 + randomInt(8);
    const end = Math.min(2025, start + span);
    return `genre:${quoteIfNeeded(genre)} year:${start}-${end}`;
  }
  function buildRandomSearchQuery() {
    const strategy = pickRandomStrategy();
    if (strategy === STRATEGIES.STRATEGY_RECOMMENDATIONS) {
      return buildGenreYearQuery(mergeGenreSeeds([]));
    }
    const base = randomSearchQuery().trim();
    if (strategy === STRATEGIES.STRATEGY_MARKET_SEARCH) {
      return `${base} year:${1980 + randomInt(45)}-${1985 + randomInt(40)}`.trim();
    }
    return base || "a";
  }

  // extension/src-src/background.js
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "RANDOMIZE_AND_PLAY") {
      (async () => {
        try {
          const query = buildRandomSearchQuery();
          const encodedQuery = encodeURIComponent(query);
          const url = `https://open.spotify.com/search/${encodedQuery}/tracks?randomify_auto_play=true`;
          const tabs = await chrome.tabs.query({ url: "*://open.spotify.com/*" });
          if (tabs.length > 0) {
            await chrome.tabs.update(tabs[0].id, { url, active: true });
          } else {
            await chrome.tabs.create({ url, active: true });
          }
          chrome.storage.local.set({ lastQuery: query });
          sendResponse({ ok: true });
        } catch (e) {
          sendResponse({ ok: false, message: e.message });
        }
      })();
      return true;
    }
    return false;
  });
})();
