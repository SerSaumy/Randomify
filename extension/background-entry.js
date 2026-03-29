/* Chrome MV3: load baked OAuth session (if any) before the main service worker. */
try {
  importScripts('injected-session.js');
} catch (e) {
  /* missing or invalid injected-session.js — extension still works after popup auth */
}
importScripts('background.js');
