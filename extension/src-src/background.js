/* global chrome */
import { buildRandomSearchQuery } from '../../lib/track-picker.js';

async function findOrCreateSpotifyTab() {
  const tabs = await chrome.tabs.query({ url: '*://open.spotify.com/*' });
  if (tabs.length > 0 && tabs[0]?.id) {
    return tabs[0];
  }
  return chrome.tabs.create({
    url: 'https://open.spotify.com',
    active: false,
    pinned: true,
  });
}

async function navigateSpotifyTab(tabId, url) {
  await chrome.tabs.update(tabId, { url, active: false });
}

async function setTabMuted(tabId, muted) {
  await chrome.tabs.update(tabId, { muted });
}

function notifyDailyLimit() {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: 'Randomify',
    message:
      "You've reached your daily free limit. The platform is forcing a shuffle, or try again tomorrow!",
  });
}

function startKeepAlive(tabId) {
  chrome.alarms.create(`randomify-ping-${tabId}`, { periodInMinutes: 1 });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'RANDOMIZE_AND_PLAY') {
    (async () => {
      try {
        const query = buildRandomSearchQuery();
        const encodedQuery = encodeURIComponent(query);
        const url = `https://open.spotify.com/search/${encodedQuery}/tracks?randomify_auto_play=true`;

        const tab = await findOrCreateSpotifyTab();
        await navigateSpotifyTab(tab.id, url);
        startKeepAlive(tab.id);
        sendResponse({ ok: true });
      } catch (e) {
        sendResponse({ ok: false, message: e.message });
      }
    })();
    return true; // Keep message channel open for async response
  }
  if (message?.type === 'RANDOMIFY_TAB_MUTE' && typeof message.tabId === 'number') {
    (async () => {
      try {
        await setTabMuted(message.tabId, Boolean(message.muted));
        sendResponse({ ok: true });
      } catch (e) {
        sendResponse({ ok: false, message: e.message });
      }
    })();
    return true;
  }
  if (message?.type === 'RANDOMIFY_DAILY_LIMIT') {
    notifyDailyLimit();
    sendResponse({ ok: true });
    return false;
  }
  return false;
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (!alarm?.name?.startsWith('randomify-ping-')) return;
  const tabId = Number(alarm.name.replace('randomify-ping-', ''));
  if (!Number.isFinite(tabId)) return;
  chrome.tabs.sendMessage(tabId, { type: 'RANDOMIFY_PING' }, () => {
    // ignore errors when tab isn't ready
  });
});
