(() => {
  // lib/randomness.js
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

  // lib/track-picker.js
  var QUERY_TEMPLATES = [
    "top hits",
    "viral songs",
    "popular songs",
    "today top hits",
    "indie pop",
    "chill vibes",
    "lofi beats",
    "summer hits",
    "party mix",
    "workout mix",
    "romantic songs",
    "throwback hits",
    "hip hop hits",
    "dance pop",
    "rock classics",
    "rnb hits",
    "focus music",
    "sleep music",
    "jazz vibes",
    "instrumental chill"
  ];
  var ARTIST_SEEDS = [
    "the weeknd",
    "dua lipa",
    "billie eilish",
    "arijit singh",
    "taylor swift",
    "drake",
    "ed sheeran",
    "coldplay",
    "bruno mars",
    "ariana grande",
    "post malone",
    "shreya ghoshal"
  ];
  function buildRandomSearchQuery() {
    const mode = Math.random();
    if (mode < 0.65) {
      return pickUniform(QUERY_TEMPLATES);
    }
    return pickUniform(ARTIST_SEEDS);
  }

  // extension/src-src/background.js
  var PREFETCH_KEY = "prefetchedSearchQueue";
  var PREFETCH_TARGET_SIZE = 6;
  var PREFETCH_TICK_MS = 15e3;
  function buildSearchUrlFromQuery(query) {
    const encodedQuery = encodeURIComponent(query);
    return `https://open.spotify.com/search/${encodedQuery}/tracks?randomify_auto_play=true`;
  }
  function makePrefetchedEntry() {
    const query = buildRandomSearchQuery().trim() || "genre:indie";
    return {
      query,
      url: buildSearchUrlFromQuery(query),
      createdAt: Date.now()
    };
  }
  async function getPrefetchQueue() {
    const data = await chrome.storage.local.get([PREFETCH_KEY]);
    const queue = Array.isArray(data[PREFETCH_KEY]) ? data[PREFETCH_KEY] : [];
    return queue.filter((item) => item && typeof item.query === "string" && typeof item.url === "string");
  }
  async function setPrefetchQueue(queue) {
    await chrome.storage.local.set({ [PREFETCH_KEY]: queue });
  }
  async function refillPrefetchQueue() {
    const queue = await getPrefetchQueue();
    while (queue.length < PREFETCH_TARGET_SIZE) {
      queue.push(makePrefetchedEntry());
    }
    await setPrefetchQueue(queue);
  }
  async function popPrefetchedEntry() {
    const queue = await getPrefetchQueue();
    let entry = queue.shift();
    if (!entry) {
      entry = makePrefetchedEntry();
    }
    await setPrefetchQueue(queue);
    refillPrefetchQueue().catch(() => {
    });
    return entry;
  }
  async function findOrCreateSpotifyTab() {
    const tabs = await chrome.tabs.query({ url: "*://open.spotify.com/*" });
    if (tabs.length > 0 && tabs[0]?.id) {
      return tabs[0];
    }
    return null;
  }
  async function navigateSpotifyTab(tabId, url) {
    await chrome.tabs.update(tabId, { url, active: true });
  }
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "RANDOMIZE_AND_PLAY") {
      (async () => {
        try {
          const entry = await popPrefetchedEntry();
          const { query, url } = entry;
          const tab = await findOrCreateSpotifyTab();
          if (tab?.id) {
            await navigateSpotifyTab(tab.id, url);
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
  refillPrefetchQueue().catch(() => {
  });
  setInterval(() => {
    refillPrefetchQueue().catch(() => {
    });
  }, PREFETCH_TICK_MS);
})();
