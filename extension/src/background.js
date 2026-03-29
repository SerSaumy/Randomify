/**
 * Background worker: create randomized Spotify search URL and navigate/open tab.
 */

import { buildRandomSearchQuery } from '../../lib/track-picker.js';

const STORAGE_KEYS = {
  lastQuery: 'sts_last_query',
};

function getApi() {
  return globalThis.browser || globalThis.chrome;
}

/**
 * @param {object} patch
 */
async function saveStorage(patch) {
  return new Promise((resolve) => {
    getApi().storage.local.set(patch, resolve);
  });
}

async function querySpotifyTabs() {
  const api = getApi();
  return new Promise((resolve) => {
    api.tabs.query({ url: ['*://open.spotify.com/*'] }, resolve);
  });
}

async function goToRandomSearch() {
  const query = buildRandomSearchQuery();
  const encodedQuery = encodeURIComponent(query);
  const url = `https://open.spotify.com/search/${encodedQuery}/tracks?randomify_auto_play=true`;

  const api = getApi();
  const tabs = await querySpotifyTabs();
  const tab = tabs[0];
  if (tab?.id) {
    await new Promise((resolve) => {
      api.tabs.update(tab.id, { url, active: true }, resolve);
    });
  } else {
    await new Promise((resolve) => {
      api.tabs.create({ url, active: true }, resolve);
    });
  }

  await saveStorage({ [STORAGE_KEYS.lastQuery]: query });
  return { ok: true, query, url };
}

getApi().runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'TRUE_RANDOM_PLAY' || message?.type === 'RANDOMIZE_AND_PLAY') {
    (async () => {
      try {
        const out = await goToRandomSearch();
        sendResponse(out);
      } catch (e) {
        sendResponse({ ok: false, message: e?.message || String(e) });
      }
    })();
    return true;
  }
  if (message?.type === 'GET_LAST_QUERY') {
    getApi().storage.local.get([STORAGE_KEYS.lastQuery], (data) => {
      sendResponse({ ok: true, lastQuery: data[STORAGE_KEYS.lastQuery] || null });
    });
    return true;
  }
  return false;
});
