/* global chrome */
import { buildRandomSearchQuery } from '../../lib/track-picker.js';

const PREFETCH_KEY = 'prefetchedSearchQueue';
const PREFETCH_TARGET_SIZE = 6;
const PREFETCH_TICK_MS = 15000;

function buildSearchUrlFromQuery(query) {
  const encodedQuery = encodeURIComponent(query);
  return `https://open.spotify.com/search/${encodedQuery}/tracks?randomify_auto_play=true`;
}

function makePrefetchedEntry() {
  const query = buildRandomSearchQuery().trim() || 'genre:indie';
  return {
    query,
    url: buildSearchUrlFromQuery(query),
    createdAt: Date.now(),
  };
}

async function getPrefetchQueue() {
  const data = await chrome.storage.local.get([PREFETCH_KEY]);
  const queue = Array.isArray(data[PREFETCH_KEY]) ? data[PREFETCH_KEY] : [];
  return queue.filter((item) => item && typeof item.query === 'string' && typeof item.url === 'string');
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
  // Refill in the background so the next click is pre-warmed.
  refillPrefetchQueue().catch(() => {});
  return entry;
}

async function findOrCreateSpotifyTab() {
  const tabs = await chrome.tabs.query({ url: '*://open.spotify.com/*' });
  if (tabs.length > 0 && tabs[0]?.id) {
    return tabs[0];
  }
  return null;
}

async function navigateSpotifyTab(tabId, url) {
  await chrome.tabs.update(tabId, { url, active: true });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'RANDOMIZE_AND_PLAY') {
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
    return true; // Keep message channel open for async response
  }
  return false;
});

// Keep prefetch queue warm whenever the worker is alive.
refillPrefetchQueue().catch(() => {});
setInterval(() => {
  refillPrefetchQueue().catch(() => {});
}, PREFETCH_TICK_MS);
