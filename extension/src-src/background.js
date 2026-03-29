/* global chrome */
import { buildRandomSearchQuery } from '../../lib/track-picker.js';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'RANDOMIZE_AND_PLAY') {
    (async () => {
      try {
        const query = buildRandomSearchQuery();
        const encodedQuery = encodeURIComponent(query);
        const url = `https://open.spotify.com/search/${encodedQuery}/tracks?randomify_auto_play=true`;

        // Find existing Spotify tab or create a new one
        const tabs = await chrome.tabs.query({ url: '*://open.spotify.com/*' });
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
    return true; // Keep message channel open for async response
  }
  return false;
});
